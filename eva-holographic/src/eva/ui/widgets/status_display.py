"""
Status Display Widget

Shows real-time status information for the holographic interface
including performance metrics, connection status, and system information.
"""

import logging
import psutil
from typing import Optional
from datetime import datetime

from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont

from ...core.config import EVAConfig


logger = logging.getLogger(__name__)


class StatusDisplay(QWidget):
    """
    Status display widget for the main window status bar.
    
    Shows performance metrics, connection status, and other
    real-time information about the holographic interface.
    """
    
    def __init__(self, config: EVAConfig, parent: Optional[QWidget] = None):
        """Initialize the status display."""
        super().__init__(parent)
        
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Status labels
        self.fps_label: Optional[QLabel] = None
        self.memory_label: Optional[QLabel] = None
        self.connection_label: Optional[QLabel] = None
        self.render_label: Optional[QLabel] = None
        self.time_label: Optional[QLabel] = None
        
        # Performance tracking
        self.last_fps = 0.0
        self.memory_usage = 0.0
        self.connection_status = "Disconnected"
        self.render_stats = {}
        
        # Reference to viewport for stats
        self.viewport = None
        
        # Initialize UI
        self._init_ui()
        self._apply_styling()
        
        self.logger.debug("Status display initialized")
    
    def _init_ui(self) -> None:
        """Initialize the status display UI."""
        layout = QHBoxLayout()
        layout.setContentsMargins(5, 2, 5, 2)
        layout.setSpacing(15)
        
        # FPS indicator
        self.fps_label = QLabel("FPS: --")
        self.fps_label.setFont(QFont("Arial", 9))
        layout.addWidget(self.fps_label)
        
        # Memory usage
        self.memory_label = QLabel("MEM: --")
        self.memory_label.setFont(QFont("Arial", 9))
        layout.addWidget(self.memory_label)
        
        # Connection status
        self.connection_label = QLabel("●  Offline")
        self.connection_label.setFont(QFont("Arial", 9))
        layout.addWidget(self.connection_label)
        
        # Render statistics
        self.render_label = QLabel("3D: --")
        self.render_label.setFont(QFont("Arial", 9))
        layout.addWidget(self.render_label)
        
        # Spacer
        layout.addStretch()
        
        # Current time
        self.time_label = QLabel("")
        self.time_label.setFont(QFont("Arial", 9))
        layout.addWidget(self.time_label)
        
        self.setLayout(layout)
        
        # Update immediately
        self.update_status()
    
    def update_status(self) -> None:
        """Update all status indicators."""
        try:
            self._update_performance_metrics()
            self._update_connection_status()
            self._update_render_stats()
            self._update_time_display()
        except Exception as e:
            self.logger.error(f"Error updating status display: {e}")
    
    def _update_performance_metrics(self) -> None:
        """Update performance-related status indicators."""
        try:
            # Memory usage
            process = psutil.Process()
            memory_mb = process.memory_info().rss / 1024 / 1024
            self.memory_usage = memory_mb
            
            # Update labels
            if self.fps_label:
                self.fps_label.setText(f"FPS: {self.last_fps:.0f}")
            
            if self.memory_label:
                self.memory_label.setText(f"MEM: {memory_mb:.0f}MB")
                
                # Color code memory usage
                if memory_mb > self.config.performance.memory_limit_mb * 0.8:
                    self.memory_label.setStyleSheet("color: #ff8800;")  # Warning
                elif memory_mb > self.config.performance.memory_limit_mb * 0.9:
                    self.memory_label.setStyleSheet("color: #ff4400;")  # Critical
                else:
                    self.memory_label.setStyleSheet("color: #00d4ff;")  # Normal
                    
        except Exception as e:
            self.logger.error(f"Failed to update performance metrics: {e}")
    
    def _update_connection_status(self) -> None:
        """Update EVE Online connection status."""
        if self.connection_label:
            # This will be updated based on actual ESI connection status
            status_text = f"●  {self.connection_status}"
            self.connection_label.setText(status_text)
            
            # Color code connection status
            if self.connection_status == "Connected":
                self.connection_label.setStyleSheet("color: #00ff80;")  # Green
            elif self.connection_status == "Connecting":
                self.connection_label.setStyleSheet("color: #ff8800;")  # Amber
            else:
                self.connection_label.setStyleSheet("color: #ff4400;")  # Red
    
    def _update_time_display(self) -> None:
        """Update the current time display."""
        if self.time_label:
            current_time = datetime.now().strftime("%H:%M:%S EVE")
            self.time_label.setText(current_time)
    
    def set_fps(self, fps: float) -> None:
        """Set the current FPS value."""
        self.last_fps = fps
        if self.fps_label:
            self.fps_label.setText(f"FPS: {fps:.0f}")
            
            # Color code FPS
            target_fps = self.config.graphics.max_fps
            if fps < target_fps * 0.5:
                self.fps_label.setStyleSheet("color: #ff4400;")  # Critical
            elif fps < target_fps * 0.8:
                self.fps_label.setStyleSheet("color: #ff8800;")  # Warning
            else:
                self.fps_label.setStyleSheet("color: #00d4ff;")  # Normal
    
    def set_connection_status(self, status: str) -> None:
        """Set the connection status."""
        self.connection_status = status
        self._update_connection_status()
    
    def set_viewport(self, viewport) -> None:
        """Set reference to viewport for render statistics."""
        self.viewport = viewport
    
    def _update_render_stats(self) -> None:
        """Update 3D rendering statistics."""
        if not self.render_label or not self.viewport:
            return
            
        try:
            stats = self.viewport.get_render_stats()
            
            # Show triangles and draw calls
            triangles = stats.get('triangles', 0)
            draw_calls = stats.get('draw_calls', 0)
            
            self.render_label.setText(f"3D: {triangles}△ {draw_calls}DC")
            
            # Color code based on performance
            if triangles > 100000 or draw_calls > 100:
                self.render_label.setStyleSheet("color: #ff8800;")  # Warning
            elif triangles > 500000 or draw_calls > 500:
                self.render_label.setStyleSheet("color: #ff4400;")  # Critical
            else:
                self.render_label.setStyleSheet("color: #00d4ff;")  # Normal
                
        except Exception as e:
            self.logger.error(f"Failed to update render stats: {e}")
            self.render_label.setText("3D: Error")
    
    def _apply_styling(self) -> None:
        """Apply holographic styling to the status display."""
        style = \"\"\"
        StatusDisplay {
            background-color: transparent;
        }
        
        QLabel {
            color: #00d4ff;
            background-color: transparent;
            padding: 2px 8px;
            border-radius: 3px;
        }
        
        QLabel:hover {
            background-color: rgba(0, 212, 255, 0.1);
        }
        \"\"\"
        
        self.setStyleSheet(style)