"""
Core data models for EVA application.

Defines the fundamental data structures used throughout the application
including characters, ships, modules, and fittings.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid
from pydantic import BaseModel, Field, validator


# EVE Online specific enums and constants

class ModuleSlotType(str, Enum):
    """Module slot types in EVE Online."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    RIG = "rig"
    SUBSYSTEM = "subsystem"
    DRONE = "drone"


class ShipCategory(str, Enum):
    """Ship categories in EVE Online."""
    FRIGATE = "frigate"
    DESTROYER = "destroyer"
    CRUISER = "cruiser"
    BATTLECRUISER = "battlecruiser"
    BATTLESHIP = "battleship"
    CARRIER = "carrier"
    DREADNOUGHT = "dreadnought"
    SUPERCARRIER = "supercarrier"
    TITAN = "titan"
    INDUSTRIAL = "industrial"
    MINING_BARGE = "mining_barge"
    EXHUMER = "exhumer"


class ActivityType(str, Enum):
    """Activity types for skill planning."""
    PVP = "pvp"
    PVE = "pve"
    MINING = "mining"
    EXPLORATION = "exploration"
    TRADING = "trading"
    MANUFACTURING = "manufacturing"
    RESEARCH = "research"


# Core EVE data models

class EVEType(BaseModel):
    """Base model for EVE Online types (ships, modules, etc.)."""
    type_id: int
    name: str
    description: Optional[str] = None
    group_id: int
    category_id: int
    published: bool = True
    mass: Optional[float] = None
    volume: Optional[float] = None
    capacity: Optional[float] = None
    graphic_id: Optional[int] = None
    icon_id: Optional[int] = None
    market_group_id: Optional[int] = None
    attributes: Dict[int, float] = Field(default_factory=dict)
    effects: List[int] = Field(default_factory=list)


class Ship(EVEType):
    """Ship type with additional ship-specific properties."""
    category: ShipCategory
    slots_high: int = 0
    slots_medium: int = 0
    slots_low: int = 0
    slots_rig: int = 0
    slots_subsystem: int = 0
    drone_capacity: int = 0
    drone_bandwidth: int = 0
    tech_level: int = 1
    meta_level: int = 0


class Module(EVEType):
    """Module type with slot and fitting information."""
    slot_type: ModuleSlotType
    cpu_usage: float = 0
    power_usage: float = 0
    activation_cost: float = 0
    tech_level: int = 1
    meta_level: int = 0
    requires_target: bool = False
    can_activate: bool = True
    duration: Optional[float] = None
    range_optimal: Optional[float] = None
    range_falloff: Optional[float] = None


class Drone(EVEType):
    """Drone type with drone-specific properties."""
    bandwidth_usage: int = 0
    volume_launched: float = 0
    max_velocity: float = 0
    drone_damage: float = 0
    control_range: float = 0


# Character and skill models

class Skill(BaseModel):
    """Character skill with training information."""
    skill_id: int
    skill_name: str
    current_level: int = Field(0, ge=0, le=5)
    current_sp: int = 0
    target_level: Optional[int] = Field(None, ge=0, le=5)
    priority: int = Field(0, ge=0, le=10)
    
    @validator("target_level")
    def target_level_valid(cls, v, values):
        if v is not None and "current_level" in values:
            if v < values["current_level"]:
                raise ValueError("Target level cannot be less than current level")
        return v


class Character(BaseModel):
    """EVE Online character information."""
    character_id: int
    name: str
    corporation_id: Optional[int] = None
    alliance_id: Optional[int] = None
    faction_id: Optional[int] = None
    security_status: float = 0.0
    skills: Dict[int, Skill] = Field(default_factory=dict)
    implants: List[int] = Field(default_factory=list)
    attributes: Dict[str, int] = Field(default_factory=dict)
    skill_queue: List[Dict[str, Any]] = Field(default_factory=list)
    last_updated: Optional[datetime] = None
    
    def get_skill_level(self, skill_id: int) -> int:
        """Get the current level of a skill."""
        return self.skills.get(skill_id, Skill(skill_id=skill_id, skill_name="Unknown")).current_level
    
    def total_sp(self) -> int:
        """Calculate total skill points."""
        return sum(skill.current_sp for skill in self.skills.values())


# Fitting models

class FittedModule(BaseModel):
    """A module fitted to a specific slot on a ship."""
    module_type_id: int
    slot_type: ModuleSlotType
    slot_index: int
    quantity: int = 1
    state: str = "active"  # active, online, offline
    charge_type_id: Optional[int] = None
    
    class Config:
        use_enum_values = True


class Fitting(BaseModel):
    """Complete ship fitting configuration."""
    fitting_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    ship_type_id: int
    modules: List[FittedModule] = Field(default_factory=list)
    drones: Dict[int, int] = Field(default_factory=dict)  # drone_type_id -> quantity
    cargo: Dict[int, int] = Field(default_factory=dict)  # item_type_id -> quantity
    implants: List[int] = Field(default_factory=list)
    boosters: List[int] = Field(default_factory=list)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    character_id: Optional[int] = None
    is_public: bool = False
    
    def add_module(self, module_type_id: int, slot_type: ModuleSlotType, 
                   slot_index: int, charge_type_id: Optional[int] = None) -> None:
        """Add a module to the fitting."""
        module = FittedModule(
            module_type_id=module_type_id,
            slot_type=slot_type,
            slot_index=slot_index,
            charge_type_id=charge_type_id
        )
        self.modules.append(module)
        self.updated_at = datetime.utcnow()
    
    def remove_module(self, slot_type: ModuleSlotType, slot_index: int) -> bool:
        """Remove a module from the fitting."""
        for i, module in enumerate(self.modules):
            if module.slot_type == slot_type and module.slot_index == slot_index:
                del self.modules[i]
                self.updated_at = datetime.utcnow()
                return True
        return False
    
    def get_module_at_slot(self, slot_type: ModuleSlotType, slot_index: int) -> Optional[FittedModule]:
        """Get the module fitted at a specific slot."""
        for module in self.modules:
            if module.slot_type == slot_type and module.slot_index == slot_index:
                return module
        return None


# Performance and analytics models

class FittingStats(BaseModel):
    """Calculated statistics for a fitting."""
    fitting_id: str
    
    # DPS Statistics
    turret_dps: float = 0
    missile_dps: float = 0
    drone_dps: float = 0
    total_dps: float = 0
    alpha_strike: float = 0
    
    # Tank Statistics
    shield_hp: float = 0
    armor_hp: float = 0
    hull_hp: float = 0
    total_hp: float = 0
    shield_resists: Dict[str, float] = Field(default_factory=dict)
    armor_resists: Dict[str, float] = Field(default_factory=dict)
    
    # Capacitor Statistics
    capacitor_capacity: float = 0
    capacitor_recharge: float = 0
    capacitor_stable_ratio: float = 0
    capacitor_stable_time: Optional[float] = None
    
    # Navigation Statistics
    max_velocity: float = 0
    agility: float = 0
    align_time: float = 0
    warp_speed: float = 0
    
    # Targeting Statistics
    max_targets: int = 0
    max_range: float = 0
    scan_resolution: float = 0
    signature_radius: float = 0
    
    # Resource Usage
    cpu_used: float = 0
    cpu_total: float = 0
    power_used: float = 0
    power_total: float = 0
    calibration_used: float = 0
    calibration_total: float = 0
    
    # Calculated at
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def cpu_usage_percent(self) -> float:
        """CPU usage as percentage."""
        return (self.cpu_used / self.cpu_total * 100) if self.cpu_total > 0 else 0
    
    @property
    def power_usage_percent(self) -> float:
        """Power usage as percentage."""
        return (self.power_used / self.power_total * 100) if self.power_total > 0 else 0
    
    @property
    def calibration_usage_percent(self) -> float:
        """Calibration usage as percentage."""
        return (self.calibration_used / self.calibration_total * 100) if self.calibration_total > 0 else 0


# Market and pricing models

class MarketPrice(BaseModel):
    """Market price information for an item."""
    type_id: int
    region_id: int
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    buy_volume: int = 0
    sell_volume: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class MarketHistory(BaseModel):
    """Historical market data point."""
    type_id: int
    region_id: int
    date: datetime
    average_price: float
    highest_price: float
    lowest_price: float
    volume: int
    order_count: int


# 3D Graphics models

class Vector3D(BaseModel):
    """3D vector for spatial calculations."""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    
    def length(self) -> float:
        """Calculate vector length."""
        return (self.x ** 2 + self.y ** 2 + self.z ** 2) ** 0.5
    
    def normalize(self) -> "Vector3D":
        """Return normalized vector."""
        length = self.length()
        if length > 0:
            return Vector3D(x=self.x/length, y=self.y/length, z=self.z/length)
        return Vector3D()


class HolographicPanel(BaseModel):
    """3D holographic panel configuration."""
    panel_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    position: Vector3D = Field(default_factory=Vector3D)
    rotation: Vector3D = Field(default_factory=Vector3D)
    scale: Vector3D = Field(default_factory=lambda: Vector3D(x=1.0, y=1.0, z=1.0))
    width: float = 400.0
    height: float = 300.0
    depth: float = 20.0
    opacity: float = Field(0.9, ge=0.0, le=1.0)
    glow_intensity: float = Field(1.0, ge=0.0, le=2.0)
    is_visible: bool = True
    is_interactive: bool = True
    color_theme: str = "cyan"  # cyan, blue, green, amber
    content_type: str = "general"  # general, ship_fitting, skill_planning, analytics
    
    def set_position(self, x: float, y: float, z: float) -> None:
        """Set panel position in 3D space."""
        self.position = Vector3D(x=x, y=y, z=z)
    
    def move_by(self, dx: float, dy: float, dz: float) -> None:
        """Move panel by relative amounts."""
        self.position.x += dx
        self.position.y += dy
        self.position.z += dz