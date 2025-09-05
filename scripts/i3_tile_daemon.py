#!/usr/bin/env python3
"""
i3 Tile Management Daemon
Automatically manages window layouts based on events
"""

import i3ipc
import time
import threading
from collections import defaultdict

class TileManager:
    def __init__(self):
        self.i3 = i3ipc.Connection()
        self.workspace_configs = defaultdict(dict)
        self.setup_event_handlers()
    
    def setup_event_handlers(self):
        """Set up event listeners for automatic tile management"""
        # Listen for new windows
        self.i3.on(i3ipc.Event.WINDOW_NEW, self.on_window_new)
        # Listen for window focus changes
        self.i3.on(i3ipc.Event.WINDOW_FOCUS, self.on_window_focus)
        # Listen for window close
        self.i3.on(i3ipc.Event.WINDOW_CLOSE, self.on_window_close)
        # Listen for workspace changes
        self.i3.on(i3ipc.Event.WORKSPACE_FOCUS, self.on_workspace_focus)
    
    def on_window_new(self, i3, event):
        """Handle new window creation"""
        print(f"New window: {event.container.name}")
        
        # Get current workspace
        workspace = event.container.workspace()
        window_count = len(self.get_workspace_windows(workspace))
        
        # Auto-apply layout based on window count
        if window_count == 3:
            self.apply_three_window_layout(workspace)
        elif window_count > 3:
            self.apply_tabbed_layout(workspace)
    
    def on_window_focus(self, i3, event):
        """Handle window focus changes"""
        # Could implement smart resizing based on focus
        pass
    
    def on_window_close(self, i3, event):
        """Handle window closure"""
        # Rebalance layout when windows are closed
        workspace = self.get_current_workspace()
        self.rebalance_workspace(workspace)
    
    def on_workspace_focus(self, i3, event):
        """Handle workspace changes"""
        # Apply saved layout for this workspace
        workspace_name = event.current.name
        if workspace_name in self.workspace_configs:
            self.apply_saved_layout(event.current, workspace_name)
    
    def get_current_workspace(self):
        """Get the currently focused workspace"""
        return self.i3.get_tree().find_focused().workspace()
    
    def get_workspace_windows(self, workspace):
        """Get all windows in a workspace"""
        windows = []
        def find_windows(node):
            if node.window:
                windows.append(node)
            for child in node.nodes:
                find_windows(child)
        
        find_windows(workspace)
        return windows
    
    def apply_three_window_layout(self, workspace):
        """Apply optimal 3-window layout"""
        windows = self.get_workspace_windows(workspace)
        if len(windows) != 3:
            return
        
        # Sort by x position
        windows.sort(key=lambda w: w.rect.x)
        
        # Calculate target widths (similar to your current script)
        total_width = workspace.rect.width
        left_width = int(total_width * 0.275)
        center_width = int(total_width * 0.45)
        right_width = int(total_width * 0.275)
        
        # Apply resizing logic here
        self.resize_windows_to_targets(windows, [left_width, center_width, right_width])
    
    def apply_tabbed_layout(self, workspace):
        """Apply tabbed layout for 4+ windows"""
        windows = self.get_workspace_windows(workspace)
        if len(windows) < 4:
            return
        
        # Implementation for creating tabbed container
        # Similar to your create_tabbed_layout function
        pass
    
    def resize_windows_to_targets(self, windows, targets):
        """Resize windows to target widths"""
        for i, (window, target) in enumerate(zip(windows, targets)):
            current_width = window.rect.width
            delta = target - current_width
            
            if abs(delta) > 5:  # Only resize if difference is significant
                self.i3.command(f'[con_id={window.id}] focus')
                direction = "grow" if delta > 0 else "shrink"
                self.i3.command(f'resize {direction} width {abs(delta)} px')
                time.sleep(0.05)  # Small delay for i3 to process
    
    def save_workspace_layout(self, workspace_name):
        """Save current workspace layout configuration"""
        workspace = self.get_current_workspace()
        windows = self.get_workspace_windows(workspace)
        
        layout_config = {
            'window_count': len(windows),
            'windows': [
                {
                    'id': w.id,
                    'name': w.name,
                    'rect': {
                        'x': w.rect.x,
                        'y': w.rect.y,
                        'width': w.rect.width,
                        'height': w.rect.height
                    }
                }
                for w in windows
            ]
        }
        
        self.workspace_configs[workspace_name] = layout_config
        print(f"Saved layout for workspace {workspace_name}")
    
    def rebalance_workspace(self, workspace):
        """Rebalance windows after changes"""
        windows = self.get_workspace_windows(workspace)
        
        if len(windows) == 2:
            # 50/50 split
            self.apply_two_window_layout(workspace)
        elif len(windows) == 3:
            # Your preferred 27.5/45/27.5 split
            self.apply_three_window_layout(workspace)
        elif len(windows) > 3:
            # Tabbed layout
            self.apply_tabbed_layout(workspace)
    
    def apply_two_window_layout(self, workspace):
        """Apply 50/50 layout for 2 windows"""
        windows = self.get_workspace_windows(workspace)
        if len(windows) != 2:
            return
        
        total_width = workspace.rect.width
        target_width = total_width // 2
        
        self.resize_windows_to_targets(windows, [target_width, target_width])
    
    def run(self):
        """Start the daemon"""
        print("Starting i3 Tile Management Daemon...")
        self.i3.main()

if __name__ == "__main__":
    manager = TileManager()
    
    # Add some CLI commands for manual control
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "save":
            workspace_name = sys.argv[2] if len(sys.argv) > 2 else manager.get_current_workspace().name
            manager.save_workspace_layout(workspace_name)
        elif sys.argv[1] == "rebalance":
            manager.rebalance_workspace(manager.get_current_workspace())
        elif sys.argv[1] == "daemon":
            manager.run()
    else:
        print("Usage:")
        print("  python3 i3_tile_daemon.py daemon    # Run as daemon")
        print("  python3 i3_tile_daemon.py save [ws] # Save layout")
        print("  python3 i3_tile_daemon.py rebalance # Rebalance current workspace")
