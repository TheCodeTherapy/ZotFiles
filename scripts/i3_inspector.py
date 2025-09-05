#!/usr/bin/env python3
"""
i3 Window Inspector and Management Tool
Advanced querying and manipulation of i3 windows
"""

import i3ipc
import json
import argparse
from typing import List, Dict, Optional

class I3WindowManager:
    def __init__(self):
        self.i3 = i3ipc.Connection()
    
    def get_tree_info(self) -> Dict:
        """Get complete information about the i3 tree"""
        tree = self.i3.get_tree()
        return self._serialize_node(tree)
    
    def _serialize_node(self, node) -> Dict:
        """Convert i3 node to serializable dict"""
        return {
            'id': node.id,
            'name': node.name,
            'type': node.type,
            'layout': node.layout,
            'rect': {
                'x': node.rect.x,
                'y': node.rect.y,
                'width': node.rect.width,
                'height': node.rect.height
            },
            'window': node.window,
            'window_class': getattr(node, 'window_class', None),
            'window_instance': getattr(node, 'window_instance', None),
            'window_role': getattr(node, 'window_role', None),
            'focused': node.focused,
            'nodes': [self._serialize_node(child) for child in node.nodes]
        }
    
    def find_windows_by_criteria(self, **criteria) -> List[Dict]:
        """Find windows matching specific criteria"""
        all_windows = self.get_all_windows()
        results = []
        
        for window in all_windows:
            match = True
            for key, value in criteria.items():
                if key == 'class' and window.get('window_class') != value:
                    match = False
                    break
                elif key == 'name' and value.lower() not in (window.get('name') or '').lower():
                    match = False
                    break
                elif key == 'workspace' and window.get('workspace') != value:
                    match = False
                    break
            
            if match:
                results.append(window)
        
        return results
    
    def get_all_windows(self) -> List[Dict]:
        """Get all windows with their workspace information"""
        tree = self.i3.get_tree()
        windows = []
        
        def extract_windows(node, workspace_name=None):
            if node.type == 'workspace':
                workspace_name = node.name
            
            if node.window:
                window_info = self._serialize_node(node)
                window_info['workspace'] = workspace_name
                windows.append(window_info)
            
            for child in node.nodes:
                extract_windows(child, workspace_name)
        
        extract_windows(tree)
        return windows
    
    def get_workspace_layout_info(self, workspace_name: Optional[str] = None) -> Dict:
        """Get detailed layout information for a workspace"""
        if workspace_name:
            workspace = self.i3.get_tree().find_named(workspace_name)[0]
        else:
            workspace = self.i3.get_tree().find_focused().workspace()
        
        info = {
            'name': workspace.name,
            'layout': workspace.layout,
            'rect': {
                'width': workspace.rect.width,
                'height': workspace.rect.height
            },
            'containers': [],
            'windows': [],
            'layout_analysis': self._analyze_layout(workspace)
        }
        
        for node in workspace.nodes:
            if node.window:
                info['windows'].append(self._serialize_node(node))
            else:
                container_info = self._serialize_node(node)
                container_info['child_windows'] = self._get_container_windows(node)
                info['containers'].append(container_info)
        
        return info
    
    def _get_container_windows(self, container) -> List[Dict]:
        """Get all windows within a container"""
        windows = []
        
        def find_windows(node):
            if node.window:
                windows.append(self._serialize_node(node))
            for child in node.nodes:
                find_windows(child)
        
        find_windows(container)
        return windows
    
    def _analyze_layout(self, workspace) -> Dict:
        """Analyze the layout type and structure"""
        total_containers = len(workspace.nodes)
        window_containers = [n for n in workspace.nodes if n.window]
        non_window_containers = [n for n in workspace.nodes if not n.window]
        
        # Count windows in non-window containers
        tabbed_windows = 0
        for container in non_window_containers:
            tabbed_windows += len(self._get_container_windows(container))
        
        total_windows = len(window_containers) + tabbed_windows
        
        analysis = {
            'total_containers': total_containers,
            'individual_windows': len(window_containers),
            'non_window_containers': len(non_window_containers),
            'total_windows': total_windows,
            'has_tabbed_containers': len(non_window_containers) > 0,
            'layout_type': 'unknown'
        }
        
        # Determine layout type
        if total_windows == 2 and len(window_containers) == 2:
            analysis['layout_type'] = 'two_windows'
        elif total_windows == 3 and len(window_containers) == 3:
            analysis['layout_type'] = 'three_windows'
        elif total_windows >= 4 and len(window_containers) >= 4:
            analysis['layout_type'] = 'multi_windows'
        elif total_containers == 3 and len(non_window_containers) == 1:
            analysis['layout_type'] = 'configured_layout'
        elif total_containers == 1 and len(non_window_containers) == 1:
            analysis['layout_type'] = 'single_container'
        
        return analysis
    
    def smart_move_window(self, window_id: int, direction: str, target_container: Optional[int] = None):
        """Intelligently move a window with context awareness"""
        # Focus the window first
        self.i3.command(f'[con_id={window_id}] focus')
        
        if target_container:
            # Move to specific container
            self.i3.command(f'[con_id={target_container}] focus')
            self.i3.command(f'[con_id={window_id}] focus')
            self.i3.command(f'move {direction}')
        else:
            # Smart directional move
            self.i3.command(f'move {direction}')
    
    def create_optimal_layout(self, layout_type: str):
        """Create an optimal layout based on current windows"""
        workspace = self.i3.get_tree().find_focused().workspace()
        windows = self._get_container_windows(workspace)
        
        if layout_type == "three_column" and len(windows) >= 3:
            self._create_three_column_layout(windows)
        elif layout_type == "master_stack" and len(windows) >= 2:
            self._create_master_stack_layout(windows)
        elif layout_type == "tabbed_center" and len(windows) >= 4:
            self._create_tabbed_center_layout(windows)
    
    def _create_three_column_layout(self, windows: List[Dict]):
        """Create left-center-right layout"""
        if len(windows) < 3:
            return
        
        # Sort windows by position
        windows.sort(key=lambda w: w['rect']['x'])
        
        # Ensure windows are in individual containers
        for window in windows[3:]:  # Move extra windows to center
            self.smart_move_window(window['id'], 'left')
        
        # Apply sizing (similar to your pyretile logic)
        total_width = windows[0]['rect']['width'] + windows[1]['rect']['width'] + windows[2]['rect']['width']
        target_widths = [
            int(total_width * 0.275),  # Left
            int(total_width * 0.45),   # Center  
            int(total_width * 0.275)   # Right
        ]
        
        for i, (window, target) in enumerate(zip(windows[:3], target_widths)):
            current = window['rect']['width']
            delta = target - current
            if abs(delta) > 10:
                self.i3.command(f'[con_id={window["id"]}] focus')
                direction = "grow" if delta > 0 else "shrink"
                self.i3.command(f'resize {direction} width {abs(delta)} px')
    
    def _create_master_stack_layout(self, windows: List[Dict]):
        """Create master window + stacked side windows"""
        if len(windows) < 2:
            return
        
        # Make first window master (left side)
        master = windows[0]
        stack_windows = windows[1:]
        
        # Create tabbed container for stack windows
        if len(stack_windows) > 1:
            self.i3.command(f'[con_id={stack_windows[0]["id"]}] focus')
            self.i3.command('split vertical')
            self.i3.command('layout tabbed')
            
            # Move other windows into the tabbed container
            for window in stack_windows[1:]:
                self.smart_move_window(window['id'], 'left')
    
    def _create_tabbed_center_layout(self, windows: List[Dict]):
        """Create left-tabbed_center-right layout"""
        if len(windows) < 4:
            return
        
        # Sort windows by position
        windows.sort(key=lambda w: w['rect']['x'])
        
        left_window = windows[0]
        right_window = windows[-1]
        center_windows = windows[1:-1]
        
        # Create tabbed container in center
        if len(center_windows) > 1:
            self.i3.command(f'[con_id={center_windows[0]["id"]}] focus')
            self.i3.command('split vertical') 
            self.i3.command('layout tabbed')
            
            # Move other center windows into tabbed container
            for window in center_windows[1:]:
                self.smart_move_window(window['id'], 'left')

def main():
    parser = argparse.ArgumentParser(description='i3 Window Manager Tool')
    parser.add_argument('command', choices=[
        'inspect', 'windows', 'layout', 'move', 'create-layout'
    ])
    parser.add_argument('--workspace', '-w', help='Workspace name')
    parser.add_argument('--window-id', type=int, help='Window ID')
    parser.add_argument('--direction', help='Direction for move command')
    parser.add_argument('--layout-type', help='Layout type to create')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--class', dest='window_class', help='Filter by window class')
    parser.add_argument('--name', help='Filter by window name')
    
    args = parser.parse_args()
    
    wm = I3WindowManager()
    
    if args.command == 'inspect':
        tree_info = wm.get_tree_info()
        if args.json:
            print(json.dumps(tree_info, indent=2))
        else:
            print("i3 Tree Structure:")
            print(f"Total nodes: {len(tree_info.get('nodes', []))}")
    
    elif args.command == 'windows':
        criteria = {}
        if args.window_class:
            criteria['class'] = args.window_class
        if args.name:
            criteria['name'] = args.name
        if args.workspace:
            criteria['workspace'] = args.workspace
        
        windows = wm.find_windows_by_criteria(**criteria)
        
        if args.json:
            print(json.dumps(windows, indent=2))
        else:
            print(f"Found {len(windows)} windows:")
            for window in windows:
                print(f"  {window['id']}: {window['name']} ({window.get('window_class', 'N/A')})")
    
    elif args.command == 'layout':
        layout_info = wm.get_workspace_layout_info(args.workspace)
        
        if args.json:
            print(json.dumps(layout_info, indent=2))
        else:
            analysis = layout_info['layout_analysis']
            print(f"Workspace: {layout_info['name']}")
            print(f"Layout Type: {analysis['layout_type']}")
            print(f"Total Windows: {analysis['total_windows']}")
            print(f"Individual Windows: {analysis['individual_windows']}")
            print(f"Containers: {analysis['non_window_containers']}")
            print(f"Has Tabbed: {analysis['has_tabbed_containers']}")
    
    elif args.command == 'move':
        if not args.window_id or not args.direction:
            print("Error: --window-id and --direction required for move command")
            return
        wm.smart_move_window(args.window_id, args.direction)
    
    elif args.command == 'create-layout':
        if not args.layout_type:
            print("Error: --layout-type required for create-layout command")
            return
        wm.create_optimal_layout(args.layout_type)

if __name__ == "__main__":
    main()
