"""
Audio System for EVA Holographic Interface

Provides immersive sound effects for the holographic interface including
button clicks, panel movements, ambient sounds, and notification effects.
"""

from .sound_manager import SoundManager
from .sound_effects import SoundEffect

__all__ = ["SoundManager", "SoundEffect"]