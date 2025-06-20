"""
Holographic 3D Viewport

The main 3D rendering widget that displays floating holographic panels
and provides spatial interaction capabilities.
"""

import logging
from typing import Optional, Dict, List
import sys
import time

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtOpenGL import QOpenGLWidget
from PyQt6.QtGui import QPainter, QColor, QFont

from ...core.config import EVAConfig
from ...core.models import HolographicPanel, Vector3D
from ...graphics.renderer import HolographicRenderer
from ...graphics.camera import Camera3D


logger = logging.getLogger(__name__)


class HolographicViewport(QOpenGLWidget):
    """
    3D OpenGL viewport for holographic interface rendering.
    
    This widget handles all 3D rendering including floating panels,
    particle effects, and spatial interactions.
    """
    
    # Signals
    panel_selected = pyqtSignal(str)  # panel_id
    panel_moved = pyqtSignal(str, float, float, float)  # panel_id, x, y, z
    
    def __init__(self, config: EVAConfig, sound_manager=None, parent: Optional[QWidget] = None):
        """Initialize the holographic viewport."""
        super().__init__(parent)
        
        self.config = config
        self.sound_manager = sound_manager
        self.logger = logging.getLogger(__name__)
        
        # 3D renderer
        self.renderer: Optional[HolographicRenderer] = None
        
        # 3D scene state
        self.panels: Dict[str, HolographicPanel] = {}
        
        # Mouse interaction
        self.last_mouse_pos = None
        self.is_rotating = False
        self.is_panning = False
        
        # Rendering state
        self.frame_count = 0
        self.last_fps_time = time.time()
        self.current_fps = 0
        
        # Animation timer for continuous rendering
        self.render_timer = QTimer()
        self.render_timer.timeout.connect(self.update)
        self.render_timer.start(16)  # ~60 FPS
        
        # Initialize OpenGL context
        self._init_opengl()
        
        self.logger.info("Holographic viewport initialized")
    
    def _init_opengl(self) -> None:
        """Initialize OpenGL settings."""
        # This will be implemented with actual OpenGL initialization
        self.setMinimumSize(800, 600)
        
        # Enable mouse tracking for spatial interactions
        self.setMouseTracking(True)
        
        self.logger.debug("OpenGL context initialized")
    
    def initializeGL(self) -> None:
        """Initialize OpenGL resources."""
        try:
            # Initialize the 3D holographic renderer
            self.renderer = HolographicRenderer(self.config, self)
            
            if self.renderer.initialize_gl():
                self.logger.info("OpenGL and holographic renderer initialized successfully")
                
                # Add some demo panels to showcase the 3D interface
                self._create_demo_panels()
            else:
                self.logger.error("Failed to initialize holographic renderer")
                self.renderer = None
                
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenGL: {e}")
            self.renderer = None
    
    def resizeGL(self, w: int, h: int) -> None:
        """Handle viewport resize."""
        try:
            if self.renderer:
                self.renderer.resize_viewport(w, h)
            self.logger.debug(f"Viewport resized to {w}x{h}")
        except Exception as e:
            self.logger.error(f"Failed to resize viewport: {e}")
    
    def paintGL(self) -> None:
        """Render the 3D holographic scene."""
        try:
            if self.renderer and self.renderer.is_opengl_available():
                # Use the 3D holographic renderer
                self.renderer.render_frame()
            else:
                # Fallback to 2D placeholder rendering
                self._render_2d_fallback()
            
            # Update performance stats
            self._update_fps_counter()
            
        except Exception as e:
            self.logger.error(f"Error during 3D rendering: {e}")
            # Try fallback rendering
            try:
                self._render_2d_fallback()
            except:
                pass  # Give up gracefully
    
    def _draw_placeholder_grid(self, painter: QPainter) -> None:
        """Draw a placeholder holographic grid."""
        painter.setPen(QColor(0, 212, 255, 50))  # Semi-transparent cyan
        
        width = self.width()
        height = self.height()
        grid_size = 50
        
        # Draw grid lines
        for x in range(0, width, grid_size):
            painter.drawLine(x, 0, x, height)
        
        for y in range(0, height, grid_size):
            painter.drawLine(0, y, width, y)
    
    def _draw_placeholder_panels(self, painter: QPainter) -> None:
        """Draw placeholder holographic panels."""
        if not self.panels:
            # Draw welcome message
            painter.setPen(QColor(0, 212, 255))
            painter.setFont(QFont("Arial", 24))
            
            text = "EVA HOLOGRAPHIC INTERFACE"
            text_rect = painter.fontMetrics().boundingRect(text)
            x = (self.width() - text_rect.width()) // 2
            y = self.height() // 2
            
            painter.drawText(x, y, text)
            
            # Draw subtitle
            painter.setFont(QFont("Arial", 12))
            subtitle = "3D Holographic Panels Will Appear Here"
            subtitle_rect = painter.fontMetrics().boundingRect(subtitle)
            x = (self.width() - subtitle_rect.width()) // 2
            y = y + 40
            
            painter.drawText(x, y, subtitle)
            return
        
        # Draw panel placeholders
        painter.setPen(QColor(0, 212, 255))
        painter.setBrush(QColor(0, 100, 150, 30))
        
        for panel_id, panel in self.panels.items():
            # Simple 2D representation of 3D panels
            x = int(panel.position.x + self.width() // 2)
            y = int(panel.position.y + self.height() // 2)
            w = int(panel.width)
            h = int(panel.height)
            
            # Draw panel border
            painter.drawRect(x, y, w, h)
            
            # Draw panel title
            painter.setFont(QFont("Arial", 10))
            painter.drawText(x + 10, y + 20, panel.title)
    
    def _create_demo_panels(self) -> None:
        """Create demo holographic panels to showcase the 3D interface."""
        try:
            # Main command panel
            command_panel = HolographicPanel(
                panel_id="demo_command",
                title="Ship Command Center",
                position=Vector3D(0, 0, 0),
                width=300,
                height=200,
                depth=20,
                color_theme="cyan",
                opacity=0.8,
                glow_intensity=1.2
            )
            self.add_panel(command_panel)
            
            # Navigation panel (to the right)
            nav_panel = HolographicPanel(
                panel_id="demo_navigation", 
                title="Navigation Systems",
                position=Vector3D(4, 1, -1),
                width=250,
                height=150,
                depth=15,
                color_theme="blue",
                opacity=0.7,
                glow_intensity=1.0
            )
            self.add_panel(nav_panel)
            
            # Status panel (to the left)
            status_panel = HolographicPanel(
                panel_id="demo_status",
                title="Ship Status",
                position=Vector3D(-4, -1, -0.5),
                width=200,
                height=180,
                depth=12,
                color_theme="green", 
                opacity=0.75,
                glow_intensity=0.8
            )
            self.add_panel(status_panel)
            
            self.logger.info("Created demo holographic panels")
            
        except Exception as e:
            self.logger.error(f"Failed to create demo panels: {e}")
    
    def _render_2d_fallback(self) -> None:
        """Render 2D fallback when 3D is not available."""
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(10, 10, 10))  # Deep space background
        
        # Draw placeholder holographic grid
        self._draw_placeholder_grid(painter)
        
        # Draw panels
        self._draw_placeholder_panels(painter)
        
        # Draw 3D unavailable message
        painter.setPen(QColor(255, 100, 100))
        painter.setFont(QFont("Arial", 16))
        
        message = "3D Rendering Unavailable - Using 2D Mode"
        text_rect = painter.fontMetrics().boundingRect(message)
        x = (self.width() - text_rect.width()) // 2
        y = 30
        
        painter.drawText(x, y, message)
    
    def _update_fps_counter(self) -> None:
        """Update FPS calculation."""
        self.frame_count += 1
        current_time = time.time()
        
        if current_time - self.last_fps_time >= 1.0:  # Update every second
            self.current_fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time

    def add_panel(self, panel: HolographicPanel) -> None:
        """Add a holographic panel to the viewport."""
        self.panels[panel.panel_id] = panel
        
        # Add to 3D renderer if available
        if self.renderer:
            self.renderer.add_holographic_panel(panel)
        
        # Play panel appear sound
        if self.sound_manager:
            self.sound_manager.play_sound("panel_appear", spatial_position=(
                panel.position.x, panel.position.y, panel.position.z
            ))
        
        self.update()  # Trigger repaint
        self.logger.info(f"Added panel to viewport: {panel.title}")
    
    def remove_panel(self, panel_id: str) -> bool:
        """Remove a holographic panel from the viewport."""
        if panel_id in self.panels:
            panel = self.panels[panel_id]
            
            # Play panel disappear sound
            if self.sound_manager:
                self.sound_manager.play_sound("panel_disappear", spatial_position=(
                    panel.position.x, panel.position.y, panel.position.z
                ))
            
            del self.panels[panel_id]
            
            # Remove from 3D renderer if available
            if self.renderer:
                self.renderer.remove_holographic_panel(panel_id)
            
            self.update()
            self.logger.info(f"Removed panel from viewport: {panel_id}")
            return True
        return False
    
    def mousePressEvent(self, event) -> None:
        """Handle mouse press for spatial interaction."""
        self.last_mouse_pos = event.position()
        
        if event.button() == Qt.MouseButton.LeftButton:
            # Check for panel selection
            panel_id = self._get_panel_at_position(event.position().x(), event.position().y())
            if panel_id:
                # Play panel selection sound
                if self.sound_manager:
                    panel = self.panels.get(panel_id)
                    if panel:
                        self.sound_manager.play_sound("panel_select", spatial_position=(
                            panel.position.x, panel.position.y, panel.position.z
                        ))
                self.panel_selected.emit(panel_id)
        elif event.button() == Qt.MouseButton.RightButton:
            self.is_rotating = True
        elif event.button() == Qt.MouseButton.MiddleButton:
            self.is_panning = True
    
    def mouseReleaseEvent(self, event) -> None:
        """Handle mouse release."""
        self.is_rotating = False
        self.is_panning = False
        self.last_mouse_pos = None
    
    def mouseMoveEvent(self, event) -> None:
        """Handle mouse movement for camera control."""
        if not self.last_mouse_pos:
            return
        
        delta_x = event.position().x() - self.last_mouse_pos.x()
        delta_y = event.position().y() - self.last_mouse_pos.y()
        
        if self.is_rotating:
            # Rotate camera around scene
            self._rotate_camera(delta_x, delta_y)
            self.update()
        elif self.is_panning:
            # Pan camera
            self._pan_camera(delta_x, delta_y)
            self.update()
        
        self.last_mouse_pos = event.position()
    
    def wheelEvent(self, event) -> None:
        """Handle mouse wheel for zooming."""
        delta = event.angleDelta().y()
        zoom_factor = 1.1 if delta > 0 else 0.9
        
        # Play camera zoom sound
        if self.sound_manager:
            self.sound_manager.play_sound("camera_zoom", volume_override=0.2)
        
        self._zoom_camera(zoom_factor)
        self.update()
    
    def _get_panel_at_position(self, x: float, y: float) -> Optional[str]:
        """Get the panel ID at the given screen position."""
        if self.renderer:
            # Use 3D raycast for precise selection
            camera = self.renderer.get_camera()
            ray_origin, ray_direction = camera.screen_to_world_ray(
                x, y, self.width(), self.height()
            )
            
            scene = self.renderer.get_scene()
            hit_object = scene.raycast(ray_origin, ray_direction)
            return hit_object
        else:
            # Fallback to simple 2D hit testing
            for panel_id, panel in self.panels.items():
                panel_x = panel.position.x + self.width() // 2
                panel_y = panel.position.y + self.height() // 2
                
                if (panel_x <= x <= panel_x + panel.width and
                    panel_y <= y <= panel_y + panel.height):
                    return panel_id
        
        return None
    
    def _rotate_camera(self, delta_x: float, delta_y: float) -> None:
        """Rotate the camera around the scene."""
        if self.renderer:
            camera = self.renderer.get_camera()
            camera.orbit_around_target(-delta_x, -delta_y)
    
    def _pan_camera(self, delta_x: float, delta_y: float) -> None:
        """Pan the camera."""
        if self.renderer:
            camera = self.renderer.get_camera()
            sensitivity = 0.01
            camera.move_right(delta_x * sensitivity)
            camera.move_up(-delta_y * sensitivity)
    
    def _zoom_camera(self, factor: float) -> None:
        """Zoom the camera in or out."""
        if self.renderer:
            camera = self.renderer.get_camera()
            camera.zoom(factor)
    
    def get_fps(self) -> float:
        """Get the current rendering FPS."""
        if self.renderer:
            return self.renderer.get_stats().fps
        return self.current_fps
    
    def get_render_stats(self) -> Dict:
        """Get detailed rendering statistics."""
        if self.renderer:
            stats = self.renderer.get_stats()
            return {
                'fps': stats.fps,
                'frame_time': stats.frame_time,
                'triangles': stats.triangles_rendered,
                'draw_calls': stats.draw_calls,
                'vertices': stats.vertices_processed
            }
        return {
            'fps': self.current_fps,
            'frame_time': 0.0,
            'triangles': 0,
            'draw_calls': 0,
            'vertices': 0
        }
    
    def set_glow_intensity(self, intensity: float) -> None:
        """Set holographic glow intensity."""
        if self.renderer:
            self.renderer.set_glow_intensity(intensity)
    
    def reset_camera(self) -> None:
        """Reset camera to default position."""
        if self.renderer:
            camera = self.renderer.get_camera()
            camera.reset_to_default()
    
    async def cleanup(self) -> None:
        """Cleanup OpenGL resources."""
        try:
            self.logger.info("Cleaning up holographic viewport...")
            
            # Stop render timer
            if hasattr(self, 'render_timer'):
                self.render_timer.stop()
            
            # Clear panels
            self.panels.clear()
            
            # Cleanup 3D renderer
            if self.renderer:
                self.renderer.cleanup()
                self.renderer = None
            
            self.logger.info("Holographic viewport cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during viewport cleanup: {e}")