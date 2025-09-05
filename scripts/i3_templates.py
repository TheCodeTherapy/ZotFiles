#!/usr/bin/env python3
"""
i3 Layout Templates Manager
Save, load, and apply custom window layout templates
"""

import i3ipc
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class LayoutTemplate:
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.containers = []
        self.window_rules = []
        self.created_at = datetime.now().isoformat()
    
    def add_container(self, container_type: str, layout: str, width_percent: float, 
                     height_percent: float = 100.0, windows: List[str] = None):
        """Add a container definition to the template"""
        container = {
            'type': container_type,  # 'window', 'tabbed', 'stacked', 'split_h', 'split_v'
            'layout': layout,
            'width_percent': width_percent,
            'height_percent': height_percent,
            'windows': windows or [],
            'window_rules': []  # Rules for auto-assigning windows
        }
        self.containers.append(container)
    
    def add_window_rule(self, container_index: int, rule: Dict):
        """Add a rule for automatically assigning windows to containers"""
        if 0 <= container_index < len(self.containers):
            self.containers[container_index]['window_rules'].append(rule)
    
    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at,
            'containers': self.containers,
            'window_rules': self.window_rules
        }
    
    @classmethod
    def from_dict(cls, data: Dict):
        template = cls(data['name'], data.get('description', ''))
        template.created_at = data.get('created_at', '')
        template.containers = data.get('containers', [])
        template.window_rules = data.get('window_rules', [])
        return template

class LayoutTemplateManager:
    def __init__(self, config_dir: str = None):
        self.i3 = i3ipc.Connection()
        self.config_dir = Path(config_dir or os.path.expanduser("~/.config/i3/layouts"))
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.templates = self.load_all_templates()
    
    def create_template_from_current(self, name: str, description: str = "") -> LayoutTemplate:
        """Create a template from the current workspace layout"""
        workspace = self.i3.get_tree().find_focused().workspace()
        template = LayoutTemplate(name, description)
        
        total_width = workspace.rect.width
        
        for node in workspace.nodes:
            width_percent = (node.rect.width / total_width) * 100
            
            if node.window:
                # Individual window
                template.add_container(
                    'window', 
                    'default',
                    width_percent,
                    windows=[node.name or f"Window_{node.id}"]
                )
            else:
                # Container with multiple windows
                container_windows = []
                self._collect_windows(node, container_windows)
                
                template.add_container(
                    node.layout or 'tabbed',
                    node.layout or 'tabbed', 
                    width_percent,
                    windows=container_windows
                )
        
        return template
    
    def _collect_windows(self, node, windows: List[str]):
        """Recursively collect window names from a container"""
        if node.window:
            windows.append(node.name or f"Window_{node.id}")
        for child in node.nodes:
            self._collect_windows(child, windows)
    
    def save_template(self, template: LayoutTemplate):
        """Save a template to disk"""
        template_file = self.config_dir / f"{template.name}.json"
        with open(template_file, 'w') as f:
            json.dump(template.to_dict(), f, indent=2)
        
        self.templates[template.name] = template
        print(f"Saved template '{template.name}' to {template_file}")
    
    def load_template(self, name: str) -> Optional[LayoutTemplate]:
        """Load a template from disk"""
        template_file = self.config_dir / f"{name}.json"
        
        if not template_file.exists():
            print(f"Template '{name}' not found")
            return None
        
        with open(template_file, 'r') as f:
            data = json.load(f)
        
        return LayoutTemplate.from_dict(data)
    
    def load_all_templates(self) -> Dict[str, LayoutTemplate]:
        """Load all templates from config directory"""
        templates = {}
        
        for template_file in self.config_dir.glob("*.json"):
            try:
                with open(template_file, 'r') as f:
                    data = json.load(f)
                template = LayoutTemplate.from_dict(data)
                templates[template.name] = template
            except Exception as e:
                print(f"Error loading template {template_file}: {e}")
        
        return templates
    
    def apply_template(self, template_name: str, auto_assign: bool = True):
        """Apply a template to the current workspace"""
        template = self.templates.get(template_name)
        if not template:
            template = self.load_template(template_name)
            if not template:
                print(f"Template '{template_name}' not found")
                return
        
        workspace = self.i3.get_tree().find_focused().workspace()
        current_windows = self._get_workspace_windows(workspace)
        
        print(f"Applying template '{template.name}' with {len(current_windows)} windows")
        
        # Reset workspace to default layout
        self.i3.command('layout default')
        
        # Create containers according to template
        self._create_template_containers(template, current_windows, auto_assign)
        
        # Apply sizing
        self._apply_template_sizing(template, workspace)
    
    def _get_workspace_windows(self, workspace):
        """Get all windows in workspace"""
        windows = []
        
        def find_windows(node):
            if node.window:
                windows.append({
                    'id': node.id,
                    'name': node.name,
                    'class': getattr(node, 'window_class', None),
                    'instance': getattr(node, 'window_instance', None)
                })
            for child in node.nodes:
                find_windows(child)
        
        find_windows(workspace)
        return windows
    
    def _create_template_containers(self, template: LayoutTemplate, windows: List[Dict], auto_assign: bool):
        """Create containers according to template specification"""
        if not windows:
            print("No windows to arrange")
            return
        
        # Group windows by containers based on rules or order
        container_assignments = self._assign_windows_to_containers(template, windows, auto_assign)
        
        for i, container in enumerate(template.containers):
            assigned_windows = container_assignments.get(i, [])
            
            if not assigned_windows:
                continue
            
            if len(assigned_windows) == 1:
                # Single window container
                print(f"Container {i}: Single window {assigned_windows[0]['name']}")
                continue
            
            # Multi-window container - create layout
            if container['layout'] in ['tabbed', 'stacked']:
                self._create_tabbed_container(assigned_windows, container['layout'])
            elif container['layout'] == 'split_h':
                self._create_split_container(assigned_windows, 'horizontal')
            elif container['layout'] == 'split_v':
                self._create_split_container(assigned_windows, 'vertical')
    
    def _assign_windows_to_containers(self, template: LayoutTemplate, windows: List[Dict], auto_assign: bool) -> Dict[int, List[Dict]]:
        """Assign windows to containers based on rules or simple distribution"""
        assignments = {i: [] for i in range(len(template.containers))}
        unassigned_windows = windows.copy()
        
        if auto_assign:
            # Use rules to assign windows
            for i, container in enumerate(template.containers):
                for rule in container.get('window_rules', []):
                    matched_windows = []
                    for window in unassigned_windows:
                        if self._window_matches_rule(window, rule):
                            matched_windows.append(window)
                    
                    for window in matched_windows:
                        assignments[i].append(window)
                        unassigned_windows.remove(window)
        
        # Distribute remaining windows evenly
        container_index = 0
        for window in unassigned_windows:
            assignments[container_index].append(window)
            container_index = (container_index + 1) % len(template.containers)
        
        return assignments
    
    def _window_matches_rule(self, window: Dict, rule: Dict) -> bool:
        """Check if a window matches a rule"""
        for key, pattern in rule.items():
            window_value = window.get(key, '')
            if not window_value:
                continue
            
            if isinstance(pattern, str):
                if pattern.lower() not in window_value.lower():
                    return False
            elif isinstance(pattern, list):
                if not any(p.lower() in window_value.lower() for p in pattern):
                    return False
        
        return True
    
    def _create_tabbed_container(self, windows: List[Dict], layout: str):
        """Create a tabbed or stacked container"""
        if len(windows) < 2:
            return
        
        # Focus first window
        self.i3.command(f'[con_id={windows[0]["id"]}] focus')
        
        # Create container
        self.i3.command('split vertical')
        self.i3.command(f'layout {layout}')
        
        # Move other windows into container
        for window in windows[1:]:
            self.i3.command(f'[con_id={window["id"]}] move left')
    
    def _create_split_container(self, windows: List[Dict], orientation: str):
        """Create a horizontally or vertically split container"""
        if len(windows) < 2:
            return
        
        # Focus first window
        self.i3.command(f'[con_id={windows[0]["id"]}] focus')
        
        # Create splits
        split_cmd = 'split horizontal' if orientation == 'horizontal' else 'split vertical'
        
        for window in windows[1:]:
            self.i3.command(f'[con_id={window["id"]}] focus')
            self.i3.command(split_cmd)
    
    def _apply_template_sizing(self, template: LayoutTemplate, workspace):
        """Apply container sizing from template"""
        total_width = workspace.rect.width
        
        current_containers = workspace.nodes
        
        for i, (container_def, current_container) in enumerate(zip(template.containers, current_containers)):
            target_width = int(total_width * container_def['width_percent'] / 100)
            current_width = current_container.rect.width
            delta = target_width - current_width
            
            if abs(delta) > 10:
                self.i3.command(f'[con_id={current_container.id}] focus')
                direction = "grow" if delta > 0 else "shrink"
                self.i3.command(f'resize {direction} width {abs(delta)} px')
    
    def list_templates(self):
        """List all available templates"""
        print("Available Templates:")
        for name, template in self.templates.items():
            print(f"  {name}: {template.description}")
            print(f"    Containers: {len(template.containers)}")
            print(f"    Created: {template.created_at}")
    
    def delete_template(self, name: str):
        """Delete a template"""
        template_file = self.config_dir / f"{name}.json"
        if template_file.exists():
            template_file.unlink()
            if name in self.templates:
                del self.templates[name]
            print(f"Deleted template '{name}'")
        else:
            print(f"Template '{name}' not found")

# Predefined templates
def create_default_templates(manager: LayoutTemplateManager):
    """Create some useful default templates"""
    
    # Three column layout
    three_col = LayoutTemplate("three_column", "Left-Center-Right layout with 27.5-45-27.5 split")
    three_col.add_container('window', 'default', 27.5)
    three_col.add_container('window', 'default', 45.0)
    three_col.add_container('window', 'default', 27.5)
    manager.save_template(three_col)
    
    # Master-stack layout
    master_stack = LayoutTemplate("master_stack", "Large master window with tabbed stack")
    master_stack.add_container('window', 'default', 60.0)
    master_stack.add_container('tabbed', 'tabbed', 40.0)
    manager.save_template(master_stack)
    
    # Development layout
    dev_layout = LayoutTemplate("development", "Code editor + terminal + browser")
    dev_layout.add_container('window', 'default', 50.0)  # Editor
    dev_layout.add_container('window', 'default', 25.0)  # Terminal  
    dev_layout.add_container('window', 'default', 25.0)  # Browser
    
    # Add window rules for auto-assignment
    dev_layout.add_window_rule(0, {'class': ['code', 'nvim', 'vim']})
    dev_layout.add_window_rule(1, {'class': ['terminal', 'alacritty', 'wezterm']})
    dev_layout.add_window_rule(2, {'class': ['firefox', 'chrome', 'brave']})
    
    manager.save_template(dev_layout)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='i3 Layout Template Manager')
    parser.add_argument('command', choices=[
        'save', 'apply', 'list', 'delete', 'create-defaults'
    ])
    parser.add_argument('name', nargs='?', help='Template name')
    parser.add_argument('--description', '-d', help='Template description')
    parser.add_argument('--no-auto-assign', action='store_true', 
                       help='Disable automatic window assignment')
    
    args = parser.parse_args()
    
    manager = LayoutTemplateManager()
    
    if args.command == 'save':
        if not args.name:
            print("Error: Template name required for save command")
            exit(1)
        
        template = manager.create_template_from_current(args.name, args.description or "")
        manager.save_template(template)
    
    elif args.command == 'apply':
        if not args.name:
            print("Error: Template name required for apply command")
            exit(1)
        
        manager.apply_template(args.name, not args.no_auto_assign)
    
    elif args.command == 'list':
        manager.list_templates()
    
    elif args.command == 'delete':
        if not args.name:
            print("Error: Template name required for delete command")
            exit(1)
        
        manager.delete_template(args.name)
    
    elif args.command == 'create-defaults':
        create_default_templates(manager)
        print("Created default templates")
