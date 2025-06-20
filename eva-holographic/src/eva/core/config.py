"""
EVA Configuration Management System

Handles all application settings including UI preferences, graphics options,
ESI authentication, and performance tuning for the holographic interface.
"""

import os
from pathlib import Path
from typing import Literal, Optional
from pydantic import BaseModel, Field, validator
from pydantic_settings import BaseSettings


class GraphicsConfig(BaseModel):
    """3D Graphics and holographic rendering settings."""
    
    max_fps: int = Field(60, ge=30, le=144, description="Maximum framerate")
    particle_density: Literal["low", "medium", "high", "ultra"] = "high"
    volumetric_lighting: bool = True
    wireframe_quality: Literal["low", "medium", "high", "ultra"] = "ultra"
    glow_effects: bool = True
    atmospheric_particles: bool = True
    vsync: bool = True
    antialiasing: bool = True
    texture_filtering: Literal["nearest", "linear", "trilinear"] = "trilinear"
    shadow_quality: Literal["off", "low", "medium", "high"] = "medium"


class UIConfig(BaseModel):
    """User interface and interaction settings."""
    
    theme: Literal["holographic"] = "holographic"
    enable_3d: bool = True
    holographic_intensity: float = Field(0.8, ge=0.0, le=1.0)
    spatial_animations: bool = True
    spatial_audio: bool = True
    panel_transparency: float = Field(0.9, ge=0.1, le=1.0)
    text_size: Literal["small", "medium", "large"] = "medium"
    color_scheme: Literal["cyan", "blue", "green", "amber"] = "cyan"


class ESIConfig(BaseModel):
    """EVE Online ESI API configuration."""
    
    # EVA Application Client Credentials (no user setup required)
    client_id: str = "53781295f2e644268c846a070cb5845d"
    client_secret: str = "mjlNGicbibaoMMYshkpeP8JYM68W7Kg3B1YYm6XN"
    redirect_uri: str = "eveauth-eva://callback"
    
    user_agent: str = "EVA-Holographic/2.0.0 (eva-dev@example.com; +https://github.com/user/eva-holographic)"
    auto_refresh: bool = True
    cache_duration: int = Field(3600, ge=300, le=86400)  # 5 minutes to 24 hours
    real_time_updates: bool = True
    timeout_seconds: int = Field(30, ge=5, le=120)
    max_retries: int = Field(3, ge=1, le=10)
    rate_limit_buffer: float = Field(0.1, ge=0.0, le=1.0)  # Buffer for rate limiting


class AudioConfig(BaseModel):
    """Audio and sound effect settings."""
    
    master_volume: float = Field(0.7, ge=0.0, le=1.0, description="Master volume level")
    ui_volume: float = Field(0.8, ge=0.0, le=1.0, description="UI interaction sounds")
    ambient_volume: float = Field(0.3, ge=0.0, le=1.0, description="Ambient holographic sounds") 
    notification_volume: float = Field(0.9, ge=0.0, le=1.0, description="Notification and alert sounds")
    sound_enabled: bool = True
    spatial_audio: bool = True
    ambient_loops: bool = True


class SpatialConfig(BaseModel):
    """Spatial interaction and 3D control settings."""
    
    mouse_sensitivity: float = Field(0.7, ge=0.1, le=2.0)
    panel_depth: float = Field(1.0, ge=0.5, le=2.0)
    interaction_radius: int = Field(150, ge=50, le=500)
    auto_arrange_panels: bool = True
    depth_sorting: bool = True
    collision_detection: bool = True


class PerformanceConfig(BaseModel):
    """Performance optimization settings."""
    
    enable_multithreading: bool = True
    memory_limit_mb: int = Field(600, ge=200, le=2048)
    cache_size_mb: int = Field(100, ge=50, le=500)
    background_updates: bool = True
    lod_distance: float = Field(100.0, ge=50.0, le=500.0)  # Level of detail distance
    culling_enabled: bool = True


class DatabaseConfig(BaseModel):
    """Database configuration settings."""
    
    database_path: Optional[Path] = None
    backup_enabled: bool = True
    backup_interval_hours: int = Field(24, ge=1, le=168)  # 1 hour to 1 week
    vacuum_on_startup: bool = False
    connection_pool_size: int = Field(10, ge=1, le=50)


class EVAConfig(BaseSettings):
    """
    Main EVA application configuration.
    
    Loads settings from environment variables, config files, and provides
    sensible defaults for the holographic interface system.
    """
    
    # Core configuration sections
    ui: UIConfig = Field(default_factory=UIConfig)
    graphics: GraphicsConfig = Field(default_factory=GraphicsConfig)
    audio: AudioConfig = Field(default_factory=AudioConfig)
    esi: ESIConfig = Field(default_factory=ESIConfig)
    spatial: SpatialConfig = Field(default_factory=SpatialConfig)
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    
    # Application metadata
    app_name: str = "EVA Holographic"
    app_version: str = "2.0.0"
    debug_mode: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    
    class Config:
        env_prefix = "EVA_"
        env_nested_delimiter = "__"
        case_sensitive = False
        
    @validator("database", always=True)
    def set_database_path(cls, v, values):
        """Set default database path based on platform."""
        if v.database_path is None:
            config_dir = cls.get_config_directory()
            v.database_path = config_dir / "eva.db"
        return v
    
    @staticmethod
    def get_config_directory() -> Path:
        """Get the platform-appropriate configuration directory."""
        if os.name == "nt":  # Windows
            config_dir = Path(os.environ.get("APPDATA", "")) / "EVA"
        else:  # macOS
            config_dir = Path.home() / "Library" / "Application Support" / "EVA"
        
        config_dir.mkdir(parents=True, exist_ok=True)
        return config_dir
    
    @staticmethod
    def get_cache_directory() -> Path:
        """Get the platform-appropriate cache directory."""
        config_dir = EVAConfig.get_config_directory()
        cache_dir = config_dir / "cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
    
    @staticmethod
    def get_logs_directory() -> Path:
        """Get the platform-appropriate logs directory."""
        config_dir = EVAConfig.get_config_directory()
        logs_dir = config_dir / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        return logs_dir
    
    def save_to_file(self, file_path: Optional[Path] = None) -> None:
        """Save configuration to JSON file."""
        if file_path is None:
            file_path = self.get_config_directory() / "config.json"
        
        with open(file_path, "w") as f:
            f.write(self.model_dump_json(indent=2))
    
    @classmethod
    def load_from_file(cls, file_path: Optional[Path] = None) -> "EVAConfig":
        """Load configuration from JSON file."""
        if file_path is None:
            file_path = cls.get_config_directory() / "config.json"
        
        if file_path.exists():
            with open(file_path, "r") as f:
                config_data = f.read()
            return cls.model_validate_json(config_data)
        else:
            # Return default configuration if file doesn't exist
            config = cls()
            config.save_to_file(file_path)  # Save defaults
            return config
    
    def update_user_agent(self, app_name: str, version: str, contact: str, 
                         repository: Optional[str] = None) -> None:
        """Update ESI user agent with application information."""
        user_agent_parts = [f"{app_name}/{version}"]
        
        if contact:
            user_agent_parts.append(f"({contact}")
            if repository:
                user_agent_parts[-1] += f"; +{repository}"
            user_agent_parts[-1] += ")"
        
        self.esi.user_agent = " ".join(user_agent_parts)
    
    def is_development_mode(self) -> bool:
        """Check if running in development mode."""
        return self.debug_mode or os.environ.get("EVA_DEBUG", "").lower() in ("1", "true", "yes")
    
    def get_opengl_profile(self) -> str:
        """Get the appropriate OpenGL profile for the current graphics settings."""
        if self.graphics.wireframe_quality in ("high", "ultra"):
            return "core"
        else:
            return "compatibility"