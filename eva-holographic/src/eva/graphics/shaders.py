"""
Shader Management System

GLSL shader compilation, linking, and management for holographic effects.
"""

import logging
from typing import Dict, Optional, Any
from pathlib import Path

try:
    import moderngl as mgl
    MODERNGL_AVAILABLE = True
except ImportError:
    MODERNGL_AVAILABLE = False
    mgl = None


logger = logging.getLogger(__name__)


class ShaderManager:
    """
    GLSL shader compiler and manager for holographic effects.
    
    Compiles, links, and manages OpenGL shader programs for
    wireframe rendering, particle effects, and post-processing.
    """
    
    def __init__(self, ctx: Any):
        """Initialize shader manager."""
        self.ctx = ctx
        self.logger = logging.getLogger(__name__)
        
        # Shader programs cache
        self.programs: Dict[str, Any] = {}
        
        # Shader source cache
        self.vertex_shaders: Dict[str, str] = {}
        self.fragment_shaders: Dict[str, str] = {}
        self.geometry_shaders: Dict[str, str] = {}
        
        # Built-in shaders
        self._init_builtin_shaders()
    
    def _init_builtin_shaders(self) -> None:
        """Initialize built-in shader sources."""
        
        # Holographic wireframe vertex shader
        self.vertex_shaders["holographic_wireframe_vs"] = """
        #version 330 core
        
        in vec3 in_position;
        
        uniform mat4 u_model_matrix;
        uniform mat4 u_view_matrix;
        uniform mat4 u_projection_matrix;
        uniform float u_time;
        
        out vec3 world_position;
        out float vertex_time;
        
        void main() {
            vec4 world_pos = u_model_matrix * vec4(in_position, 1.0);
            world_position = world_pos.xyz;
            vertex_time = u_time;
            
            gl_Position = u_projection_matrix * u_view_matrix * world_pos;
        }
        """
        
        # Holographic wireframe fragment shader
        self.fragment_shaders["holographic_wireframe_fs"] = """
        #version 330 core
        
        in vec3 world_position;
        in float vertex_time;
        
        uniform vec4 u_color;
        uniform float u_glow_intensity;
        uniform float u_time;
        
        out vec4 frag_color;
        
        void main() {
            // Base holographic color
            vec3 base_color = u_color.rgb;
            
            // Pulsing effect based on time
            float pulse = sin(u_time * 2.0) * 0.3 + 0.7;
            
            // Distance-based intensity
            float distance_factor = 1.0 / (1.0 + length(world_position) * 0.1);
            
            // Combine effects
            float intensity = pulse * distance_factor * u_glow_intensity;
            vec3 final_color = base_color * intensity;
            
            // Add glow
            float glow = smoothstep(0.0, 1.0, intensity);
            final_color += base_color * glow * 0.5;
            
            frag_color = vec4(final_color, u_color.a * intensity);
        }
        """
        
        # Holographic panel vertex shader
        self.vertex_shaders["holographic_panel_vs"] = """
        #version 330 core
        
        in vec3 in_position;
        in vec2 in_texcoord;
        
        uniform mat4 u_model_matrix;
        uniform mat4 u_view_matrix;
        uniform mat4 u_projection_matrix;
        
        out vec2 texcoord;
        out vec3 world_position;
        
        void main() {
            vec4 world_pos = u_model_matrix * vec4(in_position, 1.0);
            world_position = world_pos.xyz;
            texcoord = in_texcoord;
            
            gl_Position = u_projection_matrix * u_view_matrix * world_pos;
        }
        """
        
        # Holographic panel fragment shader
        self.fragment_shaders["holographic_panel_fs"] = """
        #version 330 core
        
        in vec2 texcoord;
        in vec3 world_position;
        
        uniform vec4 u_color;
        uniform float u_opacity;
        uniform float u_time;
        uniform float u_glow_intensity;
        
        out vec4 frag_color;
        
        // Generate holographic scanlines
        float scanlines(vec2 uv, float time) {
            float scanline = sin(uv.y * 200.0 + time * 10.0) * 0.04 + 0.96;
            return scanline;
        }
        
        // Generate holographic noise
        float noise(vec2 uv) {
            return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec2 uv = texcoord;
            
            // Base panel color
            vec3 base_color = u_color.rgb;
            
            // Add scanlines
            float scanline_effect = scanlines(uv, u_time);
            
            // Add subtle noise
            float noise_effect = noise(uv + u_time * 0.1) * 0.1 + 0.9;
            
            // Border glow effect
            vec2 border_dist = min(uv, 1.0 - uv);
            float border_factor = min(border_dist.x, border_dist.y);
            float border_glow = smoothstep(0.0, 0.1, border_factor);
            border_glow = 1.0 - border_glow;
            
            // Combine effects
            vec3 final_color = base_color * scanline_effect * noise_effect;
            final_color += base_color * border_glow * u_glow_intensity;
            
            // Pulsing opacity
            float pulse = sin(u_time * 1.5) * 0.1 + 0.9;
            float final_opacity = u_opacity * pulse;
            
            frag_color = vec4(final_color, final_opacity);
        }
        """
        
        # Particle system vertex shader
        self.vertex_shaders["particle_vs"] = """
        #version 330 core
        
        in vec3 in_position;
        in vec3 in_velocity;
        in float in_life;
        in float in_size;
        
        uniform mat4 u_view_matrix;
        uniform mat4 u_projection_matrix;
        uniform float u_time;
        
        out float particle_life;
        out float particle_size;
        
        void main() {
            // Update particle position based on velocity and time
            vec3 updated_position = in_position + in_velocity * u_time;
            
            particle_life = in_life;
            particle_size = in_size;
            
            vec4 view_pos = u_view_matrix * vec4(updated_position, 1.0);
            gl_Position = u_projection_matrix * view_pos;
            gl_PointSize = particle_size * (1.0 / -view_pos.z);
        }
        """
        
        # Particle system fragment shader
        self.fragment_shaders["particle_fs"] = """
        #version 330 core
        
        in float particle_life;
        in float particle_size;
        
        uniform vec4 u_color;
        uniform sampler2D u_particle_texture;
        
        out vec4 frag_color;
        
        void main() {
            // Create circular particles
            vec2 coord = gl_PointCoord - vec2(0.5);
            float distance = length(coord);
            
            if (distance > 0.5) {
                discard;
            }
            
            // Fade based on life
            float alpha = particle_life * (1.0 - distance * 2.0);
            
            // Holographic color with fade
            vec3 color = u_color.rgb;
            frag_color = vec4(color, alpha * u_color.a);
        }
        """
        
        # Post-processing vertex shader
        self.vertex_shaders["postprocess_vs"] = """
        #version 330 core
        
        in vec2 in_position;
        in vec2 in_texcoord;
        
        out vec2 texcoord;
        
        void main() {
            texcoord = in_texcoord;
            gl_Position = vec4(in_position, 0.0, 1.0);
        }
        """
        
        # Bloom post-processing fragment shader
        self.fragment_shaders["bloom_fs"] = """
        #version 330 core
        
        in vec2 texcoord;
        
        uniform sampler2D u_scene_texture;
        uniform float u_bloom_intensity;
        uniform vec2 u_texture_size;
        
        out vec4 frag_color;
        
        void main() {
            vec3 scene_color = texture(u_scene_texture, texcoord).rgb;
            
            // Simple bloom effect
            vec3 bloom = vec3(0.0);
            vec2 tex_offset = 1.0 / u_texture_size;
            
            // Sample surrounding pixels
            for (int i = -2; i <= 2; i++) {
                for (int j = -2; j <= 2; j++) {
                    vec2 offset = vec2(float(i), float(j)) * tex_offset;
                    vec3 sample_color = texture(u_scene_texture, texcoord + offset).rgb;
                    
                    // Extract bright areas
                    float brightness = dot(sample_color, vec3(0.2126, 0.7152, 0.0722));
                    if (brightness > 0.8) {
                        bloom += sample_color * 0.04; // 1/25 for 5x5 kernel
                    }
                }
            }
            
            // Combine scene and bloom
            vec3 final_color = scene_color + bloom * u_bloom_intensity;
            frag_color = vec4(final_color, 1.0);
        }
        """
    
    def initialize(self) -> bool:
        """
        Initialize shader programs.
        
        Returns:
            True if initialization was successful
        """
        if not MODERNGL_AVAILABLE:
            self.logger.error("ModernGL not available")
            return False
        
        try:
            # Compile holographic wireframe program
            self._compile_program(
                "holographic_wireframe",
                "holographic_wireframe_vs",
                "holographic_wireframe_fs"
            )
            
            # Compile holographic panel program
            self._compile_program(
                "holographic_panel",
                "holographic_panel_vs", 
                "holographic_panel_fs"
            )
            
            # Compile particle system program
            self._compile_program(
                "particle_system",
                "particle_vs",
                "particle_fs"
            )
            
            # Compile post-processing programs
            self._compile_program(
                "bloom_postprocess",
                "postprocess_vs",
                "bloom_fs"
            )
            
            self.logger.info(f"Initialized {len(self.programs)} shader programs")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize shaders: {e}")
            return False
    
    def _compile_program(self, name: str, vertex_shader: str, 
                        fragment_shader: str, geometry_shader: Optional[str] = None) -> bool:
        """
        Compile a shader program.
        
        Args:
            name: Program name
            vertex_shader: Vertex shader source key
            fragment_shader: Fragment shader source key
            geometry_shader: Optional geometry shader source key
            
        Returns:
            True if compilation was successful
        """
        try:
            # Get shader sources
            vs_source = self.vertex_shaders.get(vertex_shader)
            fs_source = self.fragment_shaders.get(fragment_shader)
            
            if not vs_source or not fs_source:
                raise ValueError(f"Shader source not found for program: {name}")
            
            # Optional geometry shader
            gs_source = None
            if geometry_shader:
                gs_source = self.geometry_shaders.get(geometry_shader)
            
            # Compile program
            program = self.ctx.program(
                vertex_shader=vs_source,
                fragment_shader=fs_source,
                geometry_shader=gs_source
            )
            
            self.programs[name] = program
            self.logger.debug(f"Compiled shader program: {name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to compile shader program '{name}': {e}")
            return False
    
    def get_program(self, name: str) -> Optional[Any]:
        """Get a compiled shader program by name."""
        return self.programs.get(name)
    
    def reload_program(self, name: str) -> bool:
        """
        Reload a shader program (useful for development).
        
        Args:
            name: Program name to reload
            
        Returns:
            True if reload was successful
        """
        if name not in self.programs:
            self.logger.error(f"Program '{name}' not found")
            return False
        
        # Release old program
        try:
            self.programs[name].release()
        except:
            pass
        
        # Recompile based on name patterns
        if name == "holographic_wireframe":
            return self._compile_program(name, "holographic_wireframe_vs", "holographic_wireframe_fs")
        elif name == "holographic_panel":
            return self._compile_program(name, "holographic_panel_vs", "holographic_panel_fs")
        elif name == "particle_system":
            return self._compile_program(name, "particle_vs", "particle_fs")
        elif name == "bloom_postprocess":
            return self._compile_program(name, "postprocess_vs", "bloom_fs")
        else:
            self.logger.error(f"Unknown program type for reload: {name}")
            return False
    
    def load_shader_from_file(self, file_path: Path, shader_type: str) -> bool:
        """
        Load shader source from file.
        
        Args:
            file_path: Path to shader file
            shader_type: Type of shader (vertex, fragment, geometry)
            
        Returns:
            True if loaded successfully
        """
        try:
            if not file_path.exists():
                self.logger.error(f"Shader file not found: {file_path}")
                return False
            
            with open(file_path, 'r') as f:
                source = f.read()
            
            # Store in appropriate cache
            shader_name = file_path.stem
            if shader_type == "vertex":
                self.vertex_shaders[shader_name] = source
            elif shader_type == "fragment":
                self.fragment_shaders[shader_name] = source
            elif shader_type == "geometry":
                self.geometry_shaders[shader_name] = source
            else:
                self.logger.error(f"Unknown shader type: {shader_type}")
                return False
            
            self.logger.debug(f"Loaded {shader_type} shader: {shader_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load shader from {file_path}: {e}")
            return False
    
    def add_custom_shader(self, name: str, source: str, shader_type: str) -> bool:
        """
        Add a custom shader source.
        
        Args:
            name: Shader name
            source: GLSL source code
            shader_type: Type of shader (vertex, fragment, geometry)
            
        Returns:
            True if added successfully
        """
        try:
            if shader_type == "vertex":
                self.vertex_shaders[name] = source
            elif shader_type == "fragment":
                self.fragment_shaders[name] = source
            elif shader_type == "geometry":
                self.geometry_shaders[name] = source
            else:
                self.logger.error(f"Unknown shader type: {shader_type}")
                return False
            
            self.logger.debug(f"Added custom {shader_type} shader: {name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to add custom shader: {e}")
            return False
    
    def validate_shader_source(self, source: str, shader_type: str) -> bool:
        """
        Validate shader source by attempting compilation.
        
        Args:
            source: GLSL source code
            shader_type: Type of shader
            
        Returns:
            True if shader is valid
        """
        try:
            # Create a temporary program to test compilation
            if shader_type == "vertex":
                # Use minimal fragment shader for testing
                test_fs = """
                #version 330 core
                out vec4 frag_color;
                void main() { frag_color = vec4(1.0); }
                """
                self.ctx.program(vertex_shader=source, fragment_shader=test_fs).release()
            elif shader_type == "fragment":
                # Use minimal vertex shader for testing
                test_vs = """
                #version 330 core
                in vec3 in_position;
                void main() { gl_Position = vec4(in_position, 1.0); }
                """
                self.ctx.program(vertex_shader=test_vs, fragment_shader=source).release()
            else:
                self.logger.warning(f"Validation not implemented for {shader_type} shaders")
                return True
            
            return True
            
        except Exception as e:
            self.logger.error(f"Shader validation failed: {e}")
            return False
    
    def get_program_info(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a shader program.
        
        Args:
            name: Program name
            
        Returns:
            Program information dict or None
        """
        program = self.programs.get(name)
        if not program:
            return None
        
        try:
            return {
                "name": name,
                "uniforms": list(program),
                "attributes": getattr(program, 'attributes', []),
                "geometry_input": getattr(program, 'geometry_input', None),
                "geometry_output": getattr(program, 'geometry_output', None),
                "geometry_vertices": getattr(program, 'geometry_vertices', None)
            }
        except Exception as e:
            self.logger.error(f"Failed to get program info: {e}")
            return None
    
    def cleanup(self) -> None:
        """Cleanup all shader programs."""
        try:
            for name, program in self.programs.items():
                try:
                    program.release()
                except:
                    pass  # Ignore cleanup errors
            
            self.programs.clear()
            self.logger.debug("Shader manager cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during shader cleanup: {e}")
    
    def get_stats(self) -> Dict[str, int]:
        """Get shader manager statistics."""
        return {
            "total_programs": len(self.programs),
            "vertex_shaders": len(self.vertex_shaders),
            "fragment_shaders": len(self.fragment_shaders),
            "geometry_shaders": len(self.geometry_shaders)
        }