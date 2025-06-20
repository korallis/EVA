"""
3D Graphics Engine for EVA Holographic Interface

Modern OpenGL-based rendering system for true 3D holographic panels,
wireframe models, and spatial effects.
"""

from .renderer import HolographicRenderer
from .camera import Camera3D
from .scene import Scene3D
from .shaders import ShaderManager

__all__ = ["HolographicRenderer", "Camera3D", "Scene3D", "ShaderManager"]