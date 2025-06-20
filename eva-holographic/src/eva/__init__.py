"""
EVA - EVE Virtual Assistant
A revolutionary 3D holographic desktop application for EVE Online pilots.

This package provides a truly immersive holographic interface for ship fitting,
skill planning, and character management using cutting-edge 3D graphics technology.
"""

__version__ = "2.0.0"
__author__ = "EVA Development Team"
__license__ = "MIT"

# Core application components
from .main import EVAApplication
from .core.config import EVAConfig

__all__ = ["EVAApplication", "EVAConfig", "__version__"]