"""
SDE Loader

Downloads and processes EVE Online Static Data Export (SDE) for local use.
Handles type information, dogma attributes, and other static game data.
"""

import asyncio
import logging
import zipfile
import hashlib
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
import json

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import EVAConfig
from ..core.models import Ship, Module, EVEType


logger = logging.getLogger(__name__)


class SDELoader:
    """
    EVE Online Static Data Export loader and processor.
    
    Downloads the latest SDE from CCP's official sources and processes
    it into a format suitable for EVA's holographic interface.
    """
    
    # Official SDE URLs from CCP
    SDE_BASE_URL = "https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility"
    SDE_URLS = {
        "full": f"{SDE_BASE_URL}/sde.zip",
        "fsd": f"{SDE_BASE_URL}/fsd.zip", 
        "bsd": f"{SDE_BASE_URL}/bsd.zip",
        "universe": f"{SDE_BASE_URL}/universe.zip",
        "checksums": f"{SDE_BASE_URL}/checksum"
    }
    
    def __init__(self, config: EVAConfig):
        """Initialize the SDE loader."""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Paths
        self.data_directory = Path("./eva-holographic/data")
        self.sde_directory = self.data_directory / "sde"
        self.cache_directory = config.get_cache_directory() / "sde"
        
        # Create directories
        for directory in [self.data_directory, self.sde_directory, self.cache_directory]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # HTTP client
        self._http_client: Optional[httpx.AsyncClient] = None
        
        # SDE data cache
        self._types_cache: Dict[int, EVEType] = {}
        self._ships_cache: Dict[int, Ship] = {}
        self._modules_cache: Dict[int, Module] = {}
        self._groups_cache: Dict[int, Dict[str, Any]] = {}
        self._categories_cache: Dict[int, Dict[str, Any]] = {}
        
        # Processing state
        self._last_update: Optional[datetime] = None
        self._is_loaded = False
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def initialize(self) -> None:
        """Initialize the HTTP client."""
        if self._http_client is None:
            headers = {
                "User-Agent": self.config.esi.user_agent,
                "Accept": "application/zip, application/json, text/plain",
                "Accept-Encoding": "gzip",
            }
            
            timeout = httpx.Timeout(
                connect=30.0,
                read=300.0,  # SDE files can be large
                write=30.0,
                pool=60.0
            )
            
            self._http_client = httpx.AsyncClient(
                headers=headers,
                timeout=timeout,
                follow_redirects=True
            )
        
        self.logger.info("SDE loader initialized")
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
    
    async def check_for_updates(self) -> bool:
        """
        Check if SDE updates are available.
        
        Returns:
            True if updates are available
        """
        try:
            if not self._http_client:
                await self.initialize()
            
            # Get current checksums
            response = await self._http_client.get(self.SDE_URLS["checksums"])
            response.raise_for_status()
            
            current_checksums = response.text.strip()
            
            # Check against stored checksums
            checksum_file = self.cache_directory / "checksums.txt"
            if checksum_file.exists():
                stored_checksums = checksum_file.read_text().strip()
                if current_checksums == stored_checksums:
                    self.logger.info("SDE is up to date")
                    return False
            
            # Store new checksums
            checksum_file.write_text(current_checksums)
            self.logger.info("SDE updates available")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to check for SDE updates: {e}")
            return False
    
    async def download_sde(self, package: str = "fsd", force: bool = False) -> bool:
        """
        Download the SDE package.
        
        Args:
            package: Which SDE package to download (fsd, bsd, universe, full)
            force: Force download even if file exists
            
        Returns:
            True if download was successful
        """
        if package not in self.SDE_URLS:
            raise ValueError(f"Unknown SDE package: {package}")
        
        url = self.SDE_URLS[package]
        filename = f"{package}.zip"
        file_path = self.cache_directory / filename
        
        # Check if we already have the file
        if file_path.exists() and not force:
            if not await self._verify_checksum(file_path, package):
                self.logger.warning(f"Checksum mismatch for {filename}, re-downloading")
            else:
                self.logger.info(f"SDE package {package} already exists and is valid")
                return True
        
        try:
            if not self._http_client:
                await self.initialize()
            
            self.logger.info(f"Downloading SDE package: {package}")
            
            # Download with progress tracking
            async with self._http_client.stream("GET", url) as response:
                response.raise_for_status()
                
                total_size = int(response.headers.get("content-length", 0))
                downloaded = 0
                
                with open(file_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Log progress every 10MB
                        if downloaded % (10 * 1024 * 1024) == 0:
                            if total_size > 0:
                                progress = (downloaded / total_size) * 100
                                self.logger.info(f"Download progress: {progress:.1f}%")
            
            # Verify checksum
            if await self._verify_checksum(file_path, package):
                self.logger.info(f"Successfully downloaded and verified {package}")
                return True
            else:
                self.logger.error(f"Checksum verification failed for {package}")
                file_path.unlink(missing_ok=True)
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to download SDE package {package}: {e}")
            file_path.unlink(missing_ok=True)
            return False
    
    async def _verify_checksum(self, file_path: Path, package: str) -> bool:
        """Verify the checksum of a downloaded file."""
        try:
            # Get checksums
            if not self._http_client:
                await self.initialize()
            
            response = await self._http_client.get(self.SDE_URLS["checksums"])
            response.raise_for_status()
            
            checksums = {}
            for line in response.text.strip().split("\\n"):
                if line.strip():
                    checksum, filename = line.strip().split(maxsplit=1)
                    checksums[filename] = checksum
            
            expected_checksum = checksums.get(f"{package}.zip")
            if not expected_checksum:
                self.logger.warning(f"No checksum found for {package}.zip")
                return True  # Assume valid if no checksum available
            
            # Calculate file checksum
            file_checksum = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    file_checksum.update(chunk)
            
            calculated_checksum = file_checksum.hexdigest()
            
            if calculated_checksum == expected_checksum:
                return True
            else:
                self.logger.error(
                    f"Checksum mismatch for {package}.zip: "
                    f"expected {expected_checksum}, got {calculated_checksum}"
                )
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to verify checksum: {e}")
            return False
    
    async def extract_sde(self, package: str = "fsd") -> bool:
        """
        Extract the SDE package.
        
        Args:
            package: Which package to extract
            
        Returns:
            True if extraction was successful
        """
        zip_path = self.cache_directory / f"{package}.zip"
        extract_path = self.sde_directory / package
        
        if not zip_path.exists():
            self.logger.error(f"SDE package {package}.zip not found")
            return False
        
        try:
            self.logger.info(f"Extracting SDE package: {package}")
            
            # Clean extraction directory
            if extract_path.exists():
                import shutil
                shutil.rmtree(extract_path)
            
            extract_path.mkdir(parents=True, exist_ok=True)
            
            # Extract zip file
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            
            self.logger.info(f"Successfully extracted {package} to {extract_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to extract SDE package {package}: {e}")
            return False
    
    async def load_sde_data(self, force_reload: bool = False) -> bool:
        """
        Load SDE data into memory caches.
        
        Args:
            force_reload: Force reload even if already loaded
            
        Returns:
            True if loading was successful
        """
        if self._is_loaded and not force_reload:
            return True
        
        try:
            self.logger.info("Loading SDE data into memory")
            
            # Load in order of dependencies
            await self._load_categories()
            await self._load_groups()
            await self._load_types()
            await self._process_ships_and_modules()
            
            self._is_loaded = True
            self._last_update = datetime.utcnow()
            
            self.logger.info(
                f"SDE data loaded successfully: "
                f"{len(self._types_cache)} types, "
                f"{len(self._ships_cache)} ships, "
                f"{len(self._modules_cache)} modules"
            )
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load SDE data: {e}")
            return False
    
    async def _load_categories(self) -> None:
        """Load category data from SDE."""
        categories_file = self.sde_directory / "fsd" / "categoryIDs.yaml"
        
        if not categories_file.exists():
            raise FileNotFoundError(f"Categories file not found: {categories_file}")
        
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories_data = yaml.safe_load(f)
        
        for category_id, category_info in categories_data.items():
            if category_info.get('published', False):
                self._categories_cache[category_id] = category_info
        
        self.logger.debug(f"Loaded {len(self._categories_cache)} categories")
    
    async def _load_groups(self) -> None:
        """Load group data from SDE."""
        groups_file = self.sde_directory / "fsd" / "groupIDs.yaml"
        
        if not groups_file.exists():
            raise FileNotFoundError(f"Groups file not found: {groups_file}")
        
        with open(groups_file, 'r', encoding='utf-8') as f:
            groups_data = yaml.safe_load(f)
        
        for group_id, group_info in groups_data.items():
            if group_info.get('published', False):
                self._groups_cache[group_id] = group_info
        
        self.logger.debug(f"Loaded {len(self._groups_cache)} groups")
    
    async def _load_types(self) -> None:
        """Load type data from SDE."""
        types_file = self.sde_directory / "fsd" / "typeIDs.yaml"
        
        if not types_file.exists():
            raise FileNotFoundError(f"Types file not found: {types_file}")
        
        self.logger.info("Loading type data (this may take a while...)")
        
        with open(types_file, 'r', encoding='utf-8') as f:
            types_data = yaml.safe_load(f)
        
        processed = 0
        for type_id, type_info in types_data.items():
            if type_info.get('published', False):
                eve_type = EVEType(
                    type_id=type_id,
                    name=type_info.get('name', {}).get('en', 'Unknown'),
                    description=type_info.get('description', {}).get('en'),
                    group_id=type_info.get('groupID', 0),
                    category_id=self._get_category_for_group(type_info.get('groupID', 0)),
                    published=True,
                    mass=type_info.get('mass'),
                    volume=type_info.get('volume'),
                    capacity=type_info.get('capacity'),
                    graphic_id=type_info.get('graphicID'),
                    icon_id=type_info.get('iconID'),
                    market_group_id=type_info.get('marketGroupID'),
                    attributes=self._extract_attributes(type_info),
                    effects=self._extract_effects(type_info)
                )
                
                self._types_cache[type_id] = eve_type
                processed += 1
                
                # Log progress
                if processed % 1000 == 0:
                    self.logger.info(f"Processed {processed} types...")
        
        self.logger.debug(f"Loaded {len(self._types_cache)} types")
    
    def _get_category_for_group(self, group_id: int) -> int:
        """Get the category ID for a given group."""
        group_info = self._groups_cache.get(group_id, {})
        return group_info.get('categoryID', 0)
    
    def _extract_attributes(self, type_info: Dict[str, Any]) -> Dict[int, float]:
        """Extract dogma attributes from type info."""
        attributes = {}
        
        dogma_attributes = type_info.get('dogmaAttributes', [])
        for attr in dogma_attributes:
            attr_id = attr.get('attributeID')
            value = attr.get('value')
            if attr_id is not None and value is not None:
                attributes[attr_id] = float(value)
        
        return attributes
    
    def _extract_effects(self, type_info: Dict[str, Any]) -> List[int]:
        """Extract dogma effects from type info."""
        effects = []
        
        dogma_effects = type_info.get('dogmaEffects', [])
        for effect in dogma_effects:
            effect_id = effect.get('effectID')
            if effect_id is not None:
                effects.append(effect_id)
        
        return effects
    
    async def _process_ships_and_modules(self) -> None:
        """Process types into ships and modules."""
        ship_categories = {6}  # Ship category ID
        module_categories = {7, 8, 18, 32, 35, 87}  # Various module categories
        
        for type_id, eve_type in self._types_cache.items():
            group_info = self._groups_cache.get(eve_type.group_id, {})
            category_id = group_info.get('categoryID', 0)
            
            if category_id in ship_categories:
                ship = self._create_ship_from_type(eve_type)
                if ship:
                    self._ships_cache[type_id] = ship
            elif category_id in module_categories:
                module = self._create_module_from_type(eve_type)
                if module:
                    self._modules_cache[type_id] = module
    
    def _create_ship_from_type(self, eve_type: EVEType) -> Optional[Ship]:
        """Create a Ship object from an EVEType."""
        try:
            # Map group to ship category
            ship_category_map = {
                25: "frigate", 26: "cruiser", 27: "battleship", 28: "industrial",
                29: "capsule", 30: "titan", 31: "shuttle", 237: "corvette",
                324: "assault_frigate", 358: "heavy_assault_cruiser", 419: "combat_battlecruiser",
                420: "destroyer", 463: "mining_barge", 513: "freighter", 540: "command_ship",
                541: "interdictor", 543: "exhumer", 547: "carrier", 659: "supercarrier",
                830: "covert_ops", 831: "interceptor", 832: "logistics", 833: "force_recon",
                834: "stealth_bomber", 883: "dreadnought", 893: "electronic_attack_ship",
                894: "heavy_interdictor", 898: "black_ops", 900: "marauder", 902: "jump_freighter",
                906: "combat_recon", 941: "industrial_command_ship", 963: "strategic_cruiser",
                1201: "attack_battlecruiser", 1202: "blockade_runner", 1283: "deep_space_transport",
                1305: "tactical_destroyer", 1527: "logistics_frigate", 1534: "command_destroyer",
                1538: "expedition_frigate", 1972: "flag_cruiser", 1974: "flag_battleship",
                2016: "force_auxiliary", 4594: "lancer_dreadnought"
            }
            
            category = ship_category_map.get(eve_type.group_id, "unknown")
            if category == "unknown":
                return None
            
            # Extract ship-specific attributes
            attrs = eve_type.attributes
            
            ship = Ship(
                type_id=eve_type.type_id,
                name=eve_type.name,
                description=eve_type.description,
                group_id=eve_type.group_id,
                category_id=eve_type.category_id,
                published=eve_type.published,
                mass=eve_type.mass,
                volume=eve_type.volume,
                capacity=eve_type.capacity,
                graphic_id=eve_type.graphic_id,
                icon_id=eve_type.icon_id,
                market_group_id=eve_type.market_group_id,
                attributes=eve_type.attributes,
                effects=eve_type.effects,
                category=category,
                slots_high=int(attrs.get(14, 0)),  # hiSlots
                slots_medium=int(attrs.get(13, 0)),  # medSlots
                slots_low=int(attrs.get(12, 0)),  # lowSlots
                slots_rig=int(attrs.get(1137, 0)),  # rigSlots
                slots_subsystem=int(attrs.get(1367, 0)),  # maxSubSystems
                drone_capacity=int(attrs.get(283, 0)),  # droneCapacity
                drone_bandwidth=int(attrs.get(1271, 0)),  # droneBandwidth
                tech_level=int(attrs.get(422, 1)),  # techLevel
                meta_level=int(attrs.get(633, 0))  # metaLevel
            )
            
            return ship
            
        except Exception as e:
            self.logger.warning(f"Failed to create ship from type {eve_type.type_id}: {e}")
            return None
    
    def _create_module_from_type(self, eve_type: EVEType) -> Optional[Module]:
        """Create a Module object from an EVEType."""
        try:
            # Determine slot type based on group
            slot_type_map = {
                # High slots
                53: "high", 74: "high", 76: "high", 85: "high", 508: "high", 771: "high",
                # Medium slots  
                40: "medium", 49: "medium", 56: "medium", 57: "medium", 61: "medium",
                65: "medium", 71: "medium", 77: "medium", 78: "medium", 88: "medium",
                # Low slots
                42: "low", 43: "low", 46: "low", 54: "low", 55: "low", 67: "low",
                # Rigs
                782: "rig", 786: "rig", 787: "rig",
                # Subsystems
                955: "subsystem"
            }
            
            slot_type = slot_type_map.get(eve_type.group_id)
            if not slot_type:
                return None
            
            # Extract module-specific attributes
            attrs = eve_type.attributes
            
            module = Module(
                type_id=eve_type.type_id,
                name=eve_type.name,
                description=eve_type.description,
                group_id=eve_type.group_id,
                category_id=eve_type.category_id,
                published=eve_type.published,
                mass=eve_type.mass,
                volume=eve_type.volume,
                capacity=eve_type.capacity,
                graphic_id=eve_type.graphic_id,
                icon_id=eve_type.icon_id,
                market_group_id=eve_type.market_group_id,
                attributes=eve_type.attributes,
                effects=eve_type.effects,
                slot_type=slot_type,
                cpu_usage=attrs.get(50, 0),  # cpu
                power_usage=attrs.get(30, 0),  # power
                activation_cost=attrs.get(6, 0),  # capacitorNeed
                tech_level=int(attrs.get(422, 1)),  # techLevel
                meta_level=int(attrs.get(633, 0)),  # metaLevel
                requires_target=bool(attrs.get(131, 0)),  # requiredSkill1
                can_activate=slot_type in ["high", "medium"],
                duration=attrs.get(73),  # activationTime
                range_optimal=attrs.get(54),  # maxRange
                range_falloff=attrs.get(158)  # falloff
            )
            
            return module
            
        except Exception as e:
            self.logger.warning(f"Failed to create module from type {eve_type.type_id}: {e}")
            return None
    
    # Public API methods
    
    async def update_sde(self, force: bool = False) -> bool:
        """
        Update the SDE if needed.
        
        Args:
            force: Force update even if no updates available
            
        Returns:
            True if update was successful
        """
        try:
            # Check for updates
            if not force and not await self.check_for_updates():
                return True
            
            # Download FSD package (contains most data we need)
            if not await self.download_sde("fsd", force=force):
                return False
            
            # Extract the package
            if not await self.extract_sde("fsd"):
                return False
            
            # Load data into memory
            if not await self.load_sde_data(force_reload=True):
                return False
            
            self.logger.info("SDE update completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"SDE update failed: {e}")
            return False
    
    def get_type(self, type_id: int) -> Optional[EVEType]:
        """Get type information by ID."""
        return self._types_cache.get(type_id)
    
    def get_ship(self, type_id: int) -> Optional[Ship]:
        """Get ship information by type ID."""
        return self._ships_cache.get(type_id)
    
    def get_module(self, type_id: int) -> Optional[Module]:
        """Get module information by type ID."""
        return self._modules_cache.get(type_id)
    
    def search_types(self, query: str, limit: int = 50) -> List[EVEType]:
        """Search for types by name."""
        query_lower = query.lower()
        results = []
        
        for eve_type in self._types_cache.values():
            if query_lower in eve_type.name.lower():
                results.append(eve_type)
                if len(results) >= limit:
                    break
        
        return sorted(results, key=lambda t: t.name)
    
    def get_ships_by_category(self, category: str) -> List[Ship]:
        """Get all ships of a specific category."""
        return [ship for ship in self._ships_cache.values() if ship.category == category]
    
    def get_modules_by_slot(self, slot_type: str) -> List[Module]:
        """Get all modules for a specific slot type."""
        return [module for module in self._modules_cache.values() if module.slot_type == slot_type]
    
    def is_loaded(self) -> bool:
        """Check if SDE data is loaded."""
        return self._is_loaded
    
    def get_stats(self) -> Dict[str, Any]:
        """Get SDE loading statistics."""
        return {
            "is_loaded": self._is_loaded,
            "last_update": self._last_update.isoformat() if self._last_update else None,
            "total_types": len(self._types_cache),
            "total_ships": len(self._ships_cache),
            "total_modules": len(self._modules_cache),
            "total_groups": len(self._groups_cache),
            "total_categories": len(self._categories_cache)
        }