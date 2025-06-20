"""
Sound Effect Definitions

Defines all the sound effects used in the holographic interface.
Each sound effect has metadata about its purpose, volume, and playback settings.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional


class SoundCategory(Enum):
    """Categories of sound effects for organization and volume control."""
    UI_INTERACTION = "ui_interaction"
    HOLOGRAPHIC_AMBIENT = "holographic_ambient"
    NOTIFICATIONS = "notifications"
    PANEL_MOVEMENT = "panel_movement"
    DATA_PROCESSING = "data_processing"


@dataclass
class SoundEffect:
    """Represents a sound effect with its properties."""
    name: str
    category: SoundCategory
    file_path: Optional[str] = None
    volume: float = 1.0
    pitch: float = 1.0
    loop: bool = False
    spatial: bool = False
    description: str = ""
    
    def __post_init__(self):
        if self.file_path is None:
            # Generate procedural sound if no file specified
            self.file_path = f"procedural://{self.name}"


# Define all holographic interface sound effects
HOLOGRAPHIC_SOUNDS = {
    # UI Interaction Sounds
    "button_hover": SoundEffect(
        name="button_hover",
        category=SoundCategory.UI_INTERACTION,
        volume=0.3,
        pitch=1.2,
        description="Soft holographic hum when hovering over buttons"
    ),
    
    "button_click": SoundEffect(
        name="button_click",
        category=SoundCategory.UI_INTERACTION,
        volume=0.5,
        pitch=1.0,
        description="Crisp digital beep for button activation"
    ),
    
    "panel_select": SoundEffect(
        name="panel_select",
        category=SoundCategory.UI_INTERACTION,
        volume=0.4,
        pitch=0.8,
        description="Harmonic chime when selecting holographic panels"
    ),
    
    "navigation_beep": SoundEffect(
        name="navigation_beep",
        category=SoundCategory.UI_INTERACTION,
        volume=0.3,
        pitch=1.5,
        description="High-pitched beep for navigation actions"
    ),
    
    # Panel Movement Sounds
    "panel_appear": SoundEffect(
        name="panel_appear",
        category=SoundCategory.PANEL_MOVEMENT,
        volume=0.6,
        pitch=1.0,
        spatial=True,
        description="Materializing sound when panels appear"
    ),
    
    "panel_disappear": SoundEffect(
        name="panel_disappear",
        category=SoundCategory.PANEL_MOVEMENT,
        volume=0.5,
        pitch=0.7,
        spatial=True,
        description="Dematerializing sound when panels disappear"
    ),
    
    "panel_move": SoundEffect(
        name="panel_move",
        category=SoundCategory.PANEL_MOVEMENT,
        volume=0.3,
        pitch=1.1,
        spatial=True,
        description="Floating sound for panel movement in 3D space"
    ),
    
    "panel_resize": SoundEffect(
        name="panel_resize",
        category=SoundCategory.PANEL_MOVEMENT,
        volume=0.4,
        pitch=0.9,
        description="Morphing sound for panel size changes"
    ),
    
    # Holographic Ambient Sounds
    "holographic_hum": SoundEffect(
        name="holographic_hum",
        category=SoundCategory.HOLOGRAPHIC_AMBIENT,
        volume=0.1,
        pitch=1.0,
        loop=True,
        description="Continuous low-level holographic field sound"
    ),
    
    "energy_flow": SoundEffect(
        name="energy_flow",
        category=SoundCategory.HOLOGRAPHIC_AMBIENT,
        volume=0.15,
        pitch=0.8,
        loop=True,
        description="Flowing energy sound for data streams"
    ),
    
    "particle_shimmer": SoundEffect(
        name="particle_shimmer",
        category=SoundCategory.HOLOGRAPHIC_AMBIENT,
        volume=0.2,
        pitch=1.3,
        description="Sparkling sound for particle effects"
    ),
    
    # Data Processing Sounds
    "data_scan": SoundEffect(
        name="data_scan",
        category=SoundCategory.DATA_PROCESSING,
        volume=0.4,
        pitch=1.2,
        description="Scanning beep for data analysis"
    ),
    
    "calculation_complete": SoundEffect(
        name="calculation_complete",
        category=SoundCategory.DATA_PROCESSING,
        volume=0.5,
        pitch=1.0,
        description="Confirmation tone for completed calculations"
    ),
    
    "data_update": SoundEffect(
        name="data_update",
        category=SoundCategory.DATA_PROCESSING,
        volume=0.3,
        pitch=1.4,
        description="Quick beep for real-time data updates"
    ),
    
    "fitting_optimize": SoundEffect(
        name="fitting_optimize",
        category=SoundCategory.DATA_PROCESSING,
        volume=0.6,
        pitch=0.9,
        description="Harmonic progression for fitting optimization"
    ),
    
    # Notification Sounds
    "success": SoundEffect(
        name="success",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.7,
        pitch=1.0,
        description="Positive confirmation for successful actions"
    ),
    
    "error": SoundEffect(
        name="error",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.6,
        pitch=0.6,
        description="Alert sound for errors and warnings"
    ),
    
    "warning": SoundEffect(
        name="warning",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.5,
        pitch=0.8,
        description="Attention sound for warnings"
    ),
    
    "notification": SoundEffect(
        name="notification",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.4,
        pitch=1.1,
        description="General notification chime"
    ),
    
    "auth_success": SoundEffect(
        name="auth_success",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.8,
        pitch=1.2,
        description="Character authentication success"
    ),
    
    "connection_established": SoundEffect(
        name="connection_established",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.6,
        pitch=1.3,
        description="ESI connection established"
    ),
    
    # Camera and 3D Navigation
    "camera_zoom": SoundEffect(
        name="camera_zoom",
        category=SoundCategory.UI_INTERACTION,
        volume=0.2,
        pitch=1.0,
        description="Zoom sound for camera movement"
    ),
    
    "camera_rotate": SoundEffect(
        name="camera_rotate",
        category=SoundCategory.UI_INTERACTION,
        volume=0.15,
        pitch=0.9,
        description="Rotation sound for camera orbiting"
    ),
    
    # Application Lifecycle
    "startup": SoundEffect(
        name="startup",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.8,
        pitch=1.0,
        description="Application startup sound"
    ),
    
    "shutdown": SoundEffect(
        name="shutdown",
        category=SoundCategory.NOTIFICATIONS,
        volume=0.7,
        pitch=0.7,
        description="Application shutdown sound"
    ),
}


def get_sound(name: str) -> Optional[SoundEffect]:
    """Get a sound effect by name."""
    return HOLOGRAPHIC_SOUNDS.get(name)


def get_sounds_by_category(category: SoundCategory) -> dict[str, SoundEffect]:
    """Get all sound effects in a specific category."""
    return {
        name: sound for name, sound in HOLOGRAPHIC_SOUNDS.items()
        if sound.category == category
    }