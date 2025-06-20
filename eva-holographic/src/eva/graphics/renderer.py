"""
Holographic Renderer

Modern OpenGL renderer for 3D holographic interface elements.
Implements volumetric effects, wireframe rendering, and particle systems.
"""

import logging
import numpy as np
from typing import Optional, List, Dict, Tuple, Any
from dataclasses import dataclass
import time

try:
    import moderngl as mgl
    from OpenGL import GL
    OPENGL_AVAILABLE = True
except ImportError:
    OPENGL_AVAILABLE = False
    mgl = None
    GL = None

from PyQt6.QtOpenGL import QOpenGLWidget
from PyQt6.QtCore import QTimer

from ..core.config import EVAConfig
from ..core.models import HolographicPanel, Vector3D
from .camera import Camera3D
from .scene import Scene3D, SceneObject
from .shaders import ShaderManager


logger = logging.getLogger(__name__)


@dataclass
class RenderStats:
    """Rendering performance statistics."""
    frame_time: float = 0.0
    fps: float = 0.0
    triangles_rendered: int = 0
    draw_calls: int = 0
    vertices_processed: int = 0


class HolographicRenderer:
    """
    Modern OpenGL renderer for 3D holographic interface.
    
    Provides hardware-accelerated rendering of floating panels,
    wireframe models, particle effects, and volumetric lighting.
    """
    
    def __init__(self, config: EVAConfig, gl_widget: QOpenGLWidget):
        """Initialize the holographic renderer."""
        self.config = config
        self.gl_widget = gl_widget
        self.logger = logging.getLogger(__name__)
        
        # OpenGL context and resources
        self.ctx: Optional[mgl.Context] = None
        self.shader_manager: Optional[ShaderManager] = None
        
        # Scene management
        self.camera = Camera3D()
        self.scene = Scene3D()
        
        # Rendering state
        self.is_initialized = False
        self.viewport_size = (800, 600)
        self.frame_buffer: Optional[mgl.Framebuffer] = None
        
        # Performance tracking
        self.stats = RenderStats()
        self.frame_times: List[float] = []
        self.last_frame_time = time.time()
        
        # Holographic effects
        self.glow_intensity = config.ui.holographic_intensity
        self.particle_systems: List[Any] = []
        
        # Check OpenGL availability
        if not OPENGL_AVAILABLE:
            self.logger.error("OpenGL libraries not available - 3D rendering disabled")
            return
        
        self.logger.info("Holographic renderer created")
    
    def initialize_gl(self) -> bool:
        """
        Initialize OpenGL context and resources.
        
        Returns:
            True if initialization was successful
        """
        if not OPENGL_AVAILABLE:
            self.logger.error("Cannot initialize - OpenGL libraries not available")
            return False
        
        try:
            # Create ModernGL context
            self.ctx = mgl.create_context()
            
            if not self.ctx:
                self.logger.error("Failed to create OpenGL context")
                return False
            
            # Log OpenGL information
            self.logger.info(f"OpenGL Version: {self.ctx.info['GL_VERSION']}")
            self.logger.info(f"OpenGL Vendor: {self.ctx.info['GL_VENDOR']}")
            self.logger.info(f"OpenGL Renderer: {self.ctx.info['GL_RENDERER']}")
            
            # Initialize shader manager
            self.shader_manager = ShaderManager(self.ctx)
            if not self.shader_manager.initialize():
                self.logger.error("Failed to initialize shader manager")
                return False
            
            # Configure OpenGL state
            self._configure_opengl_state()
            
            # Initialize camera
            self.camera.set_perspective(
                fov=45.0,
                aspect=self.viewport_size[0] / self.viewport_size[1],
                near=0.1,
                far=1000.0
            )
            self.camera.set_position(0, 0, 5)
            
            # Create frame buffer for post-processing
            self._create_framebuffer()
            
            self.is_initialized = True
            self.logger.info("Holographic renderer initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenGL: {e}")
            return False
    
    def _configure_opengl_state(self) -> None:
        """Configure initial OpenGL state for holographic rendering."""
        if not self.ctx:
            return
        
        # Enable depth testing
        self.ctx.enable(mgl.DEPTH_TEST)
        self.ctx.depth_func = mgl.LESS
        
        # Enable blending for transparency
        self.ctx.enable(mgl.BLEND)
        self.ctx.blend_func = mgl.SRC_ALPHA, mgl.ONE_MINUS_SRC_ALPHA
        
        # Enable culling
        self.ctx.enable(mgl.CULL_FACE)
        self.ctx.cull_face = mgl.BACK
        
        # Configure line width for wireframes
        if hasattr(GL, 'glLineWidth'):
            GL.glLineWidth(1.5)
        
        # Set clear color (deep space)
        self.ctx.clear_color = (0.02, 0.02, 0.02, 1.0)
    
    def _create_framebuffer(self) -> None:
        """Create framebuffer for post-processing effects."""
        if not self.ctx:
            return
        
        try:
            width, height = self.viewport_size
            
            # Create color texture
            color_texture = self.ctx.texture((width, height), 4)
            color_texture.filter = (mgl.LINEAR, mgl.LINEAR)
            
            # Create depth texture
            depth_texture = self.ctx.depth_texture((width, height))
            depth_texture.filter = (mgl.LINEAR, mgl.LINEAR)
            
            # Create framebuffer
            self.frame_buffer = self.ctx.framebuffer(
                color_attachments=[color_texture],
                depth_attachment=depth_texture
            )
            
            self.logger.debug(f"Created framebuffer: {width}x{height}")
            
        except Exception as e:
            self.logger.error(f"Failed to create framebuffer: {e}")
    
    def resize_viewport(self, width: int, height: int) -> None:
        """Resize the viewport and update related resources."""
        self.viewport_size = (width, height)
        
        if self.ctx:
            self.ctx.viewport = (0, 0, width, height)
        
        # Update camera aspect ratio
        self.camera.set_aspect_ratio(width / height)
        
        # Recreate framebuffer
        if self.frame_buffer:
            self.frame_buffer.release()
            self._create_framebuffer()
        
        self.logger.debug(f"Viewport resized to {width}x{height}")
    
    def add_holographic_panel(self, panel: HolographicPanel) -> bool:
        """
        Add a holographic panel to the scene.
        
        Args:
            panel: The panel to add
            
        Returns:
            True if panel was added successfully
        """
        try:
            # Create panel geometry
            panel_object = self._create_panel_object(panel)
            if panel_object:
                self.scene.add_object(panel.panel_id, panel_object)
                self.logger.debug(f"Added holographic panel: {panel.title}")
                return True
            
        except Exception as e:
            self.logger.error(f"Failed to add holographic panel: {e}")
        
        return False
    
    def _create_panel_object(self, panel: HolographicPanel) -> Optional[SceneObject]:
        """Create a 3D object for a holographic panel."""
        if not self.ctx or not self.shader_manager:
            return None
        
        try:
            # Panel dimensions
            width = panel.width / 100.0  # Scale down for 3D scene
            height = panel.height / 100.0
            depth = panel.depth / 100.0
            
            # Create panel geometry (wireframe box)
            vertices, indices = self._generate_panel_geometry(width, height, depth)
            
            # Create vertex buffer
            vbo = self.ctx.buffer(vertices.astype(np.float32).tobytes())
            ibo = self.ctx.buffer(indices.astype(np.uint32).tobytes())
            
            # Create vertex array object
            vao = self.ctx.vertex_array(
                self.shader_manager.get_program("holographic_wireframe"),
                [(vbo, '3f', 'in_position')]
            )
            
            # Create scene object
            scene_object = SceneObject(
                vao=vao,
                index_buffer=ibo,
                vertex_count=len(indices),
                position=panel.position,
                rotation=panel.rotation,
                scale=panel.scale,
                material_params={
                    'color': self._get_panel_color(panel.color_theme),
                    'opacity': panel.opacity,
                    'glow_intensity': panel.glow_intensity
                }
            )
            
            return scene_object
            
        except Exception as e:
            self.logger.error(f"Failed to create panel object: {e}")
            return None
    
    def _generate_panel_geometry(self, width: float, height: float, depth: float) -> Tuple[np.ndarray, np.ndarray]:
        """Generate wireframe geometry for a holographic panel."""
        # Define the 8 corners of the panel box
        corners = np.array([
            # Front face
            [-width/2, -height/2, depth/2],   # 0: bottom-left-front
            [width/2, -height/2, depth/2],    # 1: bottom-right-front
            [width/2, height/2, depth/2],     # 2: top-right-front
            [-width/2, height/2, depth/2],    # 3: top-left-front
            
            # Back face
            [-width/2, -height/2, -depth/2],  # 4: bottom-left-back
            [width/2, -height/2, -depth/2],   # 5: bottom-right-back
            [width/2, height/2, -depth/2],    # 6: top-right-back
            [-width/2, height/2, -depth/2],   # 7: top-left-back
        ], dtype=np.float32)
        
        # Define wireframe edges
        edges = np.array([
            # Front face edges
            [0, 1], [1, 2], [2, 3], [3, 0],
            # Back face edges
            [4, 5], [5, 6], [6, 7], [7, 4],
            # Connecting edges
            [0, 4], [1, 5], [2, 6], [3, 7]
        ], dtype=np.uint32)
        
        return corners, edges.flatten()
    
    def _get_panel_color(self, color_theme: str) -> Tuple[float, float, float]:
        """Get RGB color values for a panel theme."""
        colors = {
            'cyan': (0.0, 0.83, 1.0),      # #00d4ff
            'blue': (0.0, 0.5, 1.0),       # #0080ff
            'green': (0.0, 1.0, 0.5),      # #00ff80
            'amber': (1.0, 0.53, 0.0),     # #ff8800
        }
        return colors.get(color_theme, colors['cyan'])
    
    def remove_holographic_panel(self, panel_id: str) -> bool:
        """Remove a holographic panel from the scene."""
        return self.scene.remove_object(panel_id)
    
    def render_frame(self) -> None:
        """Render a complete frame of the holographic interface."""
        if not self.is_initialized or not self.ctx:
            return
        
        frame_start = time.time()
        
        try:
            # Clear buffers
            if self.frame_buffer:
                self.frame_buffer.use()
            
            self.ctx.clear()
            
            # Update camera matrices
            view_matrix = self.camera.get_view_matrix()
            proj_matrix = self.camera.get_projection_matrix()
            
            # Reset stats
            self.stats.draw_calls = 0
            self.stats.triangles_rendered = 0
            self.stats.vertices_processed = 0
            
            # Render scene objects
            self._render_scene_objects(view_matrix, proj_matrix)
            
            # Render holographic grid
            self._render_holographic_grid(view_matrix, proj_matrix)
            
            # Render particle effects
            self._render_particle_effects(view_matrix, proj_matrix)
            
            # Post-processing effects
            if self.frame_buffer:
                self._apply_post_processing()
            
            # Update performance stats
            frame_time = time.time() - frame_start
            self._update_performance_stats(frame_time)
            
        except Exception as e:
            self.logger.error(f"Error during frame rendering: {e}")
    
    def _render_scene_objects(self, view_matrix: np.ndarray, proj_matrix: np.ndarray) -> None:
        """Render all scene objects."""
        if not self.shader_manager:
            return
        
        # Use holographic wireframe shader
        program = self.shader_manager.get_program("holographic_wireframe")
        if not program:
            return
        
        program.use()
        
        # Set common uniforms
        program['u_view_matrix'].write(view_matrix.astype(np.float32).tobytes())
        program['u_projection_matrix'].write(proj_matrix.astype(np.float32).tobytes())
        program['u_time'].value = time.time()
        program['u_glow_intensity'].value = self.glow_intensity
        
        # Render each object
        for obj in self.scene.get_objects():
            if not obj.visible:
                continue
            
            # Calculate model matrix
            model_matrix = self._calculate_model_matrix(obj)
            program['u_model_matrix'].write(model_matrix.astype(np.float32).tobytes())
            
            # Set material parameters
            color = obj.material_params.get('color', (0.0, 0.83, 1.0))
            program['u_color'].value = (*color, obj.material_params.get('opacity', 1.0))
            
            # Render the object
            if obj.index_buffer:
                obj.vao.render(mode=mgl.LINES)
            else:
                obj.vao.render(mode=mgl.LINES)
            
            self.stats.draw_calls += 1
            self.stats.vertices_processed += obj.vertex_count
    
    def _calculate_model_matrix(self, obj: SceneObject) -> np.ndarray:
        """Calculate the model transformation matrix for an object."""
        # This is a simplified version - in practice you'd use proper 3D math libraries
        model = np.eye(4, dtype=np.float32)
        
        # Apply translation
        model[0, 3] = obj.position.x
        model[1, 3] = obj.position.y
        model[2, 3] = obj.position.z
        
        # Apply scale
        model[0, 0] = obj.scale.x
        model[1, 1] = obj.scale.y
        model[2, 2] = obj.scale.z
        
        # TODO: Apply rotation (quaternion to matrix conversion)
        
        return model
    
    def _render_holographic_grid(self, view_matrix: np.ndarray, proj_matrix: np.ndarray) -> None:
        """Render the background holographic grid."""
        # This would render a grid pattern in 3D space
        # Implementation depends on having grid geometry and shaders
        pass
    
    def _render_particle_effects(self, view_matrix: np.ndarray, proj_matrix: np.ndarray) -> None:
        """Render particle systems for atmospheric effects."""
        # This would render particle systems for holographic atmosphere
        # Implementation depends on particle system setup
        pass
    
    def _apply_post_processing(self) -> None:
        """Apply post-processing effects for holographic appearance."""
        # This would apply bloom, glow, and other holographic effects
        # Implementation depends on post-processing shaders
        pass
    
    def _update_performance_stats(self, frame_time: float) -> None:
        """Update rendering performance statistics."""
        self.stats.frame_time = frame_time
        
        # Maintain rolling average of frame times
        self.frame_times.append(frame_time)
        if len(self.frame_times) > 60:  # Keep last 60 frames
            self.frame_times.pop(0)
        
        # Calculate FPS
        if frame_time > 0:
            self.stats.fps = 1.0 / frame_time
    
    def get_camera(self) -> Camera3D:
        """Get the rendering camera."""
        return self.camera
    
    def get_scene(self) -> Scene3D:
        """Get the 3D scene."""
        return self.scene
    
    def get_stats(self) -> RenderStats:
        """Get rendering performance statistics."""
        return self.stats
    
    def set_glow_intensity(self, intensity: float) -> None:
        """Set the holographic glow intensity."""
        self.glow_intensity = max(0.0, min(2.0, intensity))
    
    def cleanup(self) -> None:
        """Cleanup OpenGL resources."""
        try:
            if self.frame_buffer:
                self.frame_buffer.release()
                self.frame_buffer = None
            
            if self.shader_manager:
                self.shader_manager.cleanup()
                self.shader_manager = None
            
            # Scene cleanup
            self.scene.clear()
            
            if self.ctx:
                self.ctx.release()
                self.ctx = None
            
            self.is_initialized = False
            self.logger.info("Holographic renderer cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during renderer cleanup: {e}")
    
    def is_opengl_available(self) -> bool:
        """Check if OpenGL is available for rendering."""
        return OPENGL_AVAILABLE and self.is_initialized