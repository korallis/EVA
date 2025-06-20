"""
Sound Manager for Holographic Interface

Manages playback of sound effects with volume control, spatial audio,
and procedural sound generation for the holographic interface.
"""

import logging
import math
import numpy as np
from typing import Dict, Optional, Tuple
import threading
import time

try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    pygame = None

from ..core.config import EVAConfig
from .sound_effects import SoundEffect, SoundCategory, HOLOGRAPHIC_SOUNDS


logger = logging.getLogger(__name__)


class ProceduralSoundGenerator:
    """Generate procedural sound effects for holographic interface."""
    
    def __init__(self, sample_rate: int = 22050):
        self.sample_rate = sample_rate
    
    def generate_beep(self, frequency: float, duration: float, volume: float = 0.5, 
                     envelope: str = "linear") -> np.ndarray:
        """Generate a beep tone with specified parameters."""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        # Generate base tone
        wave = np.sin(2 * np.pi * frequency * t)
        
        # Apply envelope
        if envelope == "linear":
            # Linear fade in/out
            fade_samples = samples // 10
            wave[:fade_samples] *= np.linspace(0, 1, fade_samples)
            wave[-fade_samples:] *= np.linspace(1, 0, fade_samples)
        elif envelope == "exponential":
            # Exponential decay
            decay = np.exp(-t * 3)
            wave *= decay
        
        # Apply volume and convert to int16
        wave = (wave * volume * 32767).astype(np.int16)
        
        # Make stereo
        return np.array([wave, wave]).T
    
    def generate_harmonic_chord(self, base_freq: float, duration: float, 
                               harmonics: list[float], volume: float = 0.5) -> np.ndarray:
        """Generate a harmonic chord for success/notification sounds."""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        wave = np.zeros(samples)
        for i, harmonic in enumerate(harmonics):
            freq = base_freq * harmonic
            harmonic_wave = np.sin(2 * np.pi * freq * t)
            # Reduce amplitude for higher harmonics
            harmonic_wave *= (1.0 / (i + 1))
            wave += harmonic_wave
        
        # Normalize
        if np.max(np.abs(wave)) > 0:
            wave = wave / np.max(np.abs(wave))
        
        # Apply envelope
        fade_samples = samples // 8
        wave[:fade_samples] *= np.linspace(0, 1, fade_samples)
        wave[-fade_samples:] *= np.linspace(1, 0, fade_samples)
        
        # Apply volume and convert to int16
        wave = (wave * volume * 32767).astype(np.int16)
        
        # Make stereo
        return np.array([wave, wave]).T
    
    def generate_noise_burst(self, duration: float, frequency_range: Tuple[float, float],
                           volume: float = 0.5) -> np.ndarray:
        """Generate filtered noise for error/warning sounds."""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        # Generate white noise
        noise = np.random.normal(0, 0.1, samples)
        
        # Apply simple low-pass filter effect
        low_freq, high_freq = frequency_range
        freq_factor = (high_freq - low_freq) / 2 + low_freq
        modulation = np.sin(2 * np.pi * freq_factor * t * 0.1)
        noise *= (modulation + 1) / 2
        
        # Apply envelope
        envelope = np.exp(-t * 2)
        noise *= envelope
        
        # Apply volume and convert to int16
        noise = (noise * volume * 32767).astype(np.int16)
        
        # Make stereo
        return np.array([noise, noise]).T
    
    def generate_sweep(self, start_freq: float, end_freq: float, duration: float,
                      volume: float = 0.5) -> np.ndarray:
        """Generate frequency sweep for scanning/processing sounds."""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        # Create frequency sweep
        freq_progression = np.linspace(start_freq, end_freq, samples)
        phase = np.cumsum(2 * np.pi * freq_progression) / self.sample_rate
        wave = np.sin(phase)
        
        # Apply envelope
        envelope = np.exp(-t * 1)
        wave *= envelope
        
        # Apply volume and convert to int16
        wave = (wave * volume * 32767).astype(np.int16)
        
        # Make stereo
        return np.array([wave, wave]).T


class SoundManager:
    """
    Manages sound effects for the holographic interface.
    
    Provides procedural sound generation, volume control, and spatial audio
    for an immersive sci-fi experience.
    """
    
    def __init__(self, config: EVAConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Audio state
        self.is_initialized = False
        self.master_volume = config.audio.master_volume
        self.category_volumes: Dict[SoundCategory, float] = {
            SoundCategory.UI_INTERACTION: config.audio.ui_volume,
            SoundCategory.HOLOGRAPHIC_AMBIENT: config.audio.ambient_volume,
            SoundCategory.NOTIFICATIONS: config.audio.notification_volume,
            SoundCategory.PANEL_MOVEMENT: config.audio.ui_volume,
            SoundCategory.DATA_PROCESSING: config.audio.ui_volume,
        }
        self.muted = False
        
        # Sound generation
        self.sound_generator = ProceduralSoundGenerator()
        self.sound_cache: Dict[str, any] = {}
        
        # Pygame mixer state
        self.mixer_channels = 8
        self.current_ambient_channel = None
        
        # Threading for non-blocking playback
        self.playback_lock = threading.Lock()
        
        # Initialize audio system
        self.initialize()
    
    def initialize(self) -> bool:
        """Initialize the audio system."""
        if not PYGAME_AVAILABLE:
            self.logger.warning("Pygame not available - sound effects disabled")
            return False
        
        try:
            # Initialize pygame mixer
            pygame.mixer.pre_init(
                frequency=22050,
                size=-16,
                channels=2,
                buffer=1024
            )
            pygame.mixer.init()
            pygame.mixer.set_num_channels(self.mixer_channels)
            
            self.is_initialized = True
            self.logger.info("Sound system initialized successfully")
            
            # Pre-generate common sounds
            self._pregenerate_sounds()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize sound system: {e}")
            return False
    
    def _pregenerate_sounds(self) -> None:
        """Pre-generate procedural sounds for better performance."""
        try:
            # Generate common UI sounds
            self.sound_cache["button_hover"] = self._generate_procedural_sound("button_hover")
            self.sound_cache["button_click"] = self._generate_procedural_sound("button_click")
            self.sound_cache["panel_select"] = self._generate_procedural_sound("panel_select")
            self.sound_cache["success"] = self._generate_procedural_sound("success")
            self.sound_cache["error"] = self._generate_procedural_sound("error")
            self.sound_cache["notification"] = self._generate_procedural_sound("notification")
            
            self.logger.debug(f"Pre-generated {len(self.sound_cache)} procedural sounds")
            
        except Exception as e:
            self.logger.error(f"Failed to pre-generate sounds: {e}")
    
    def _generate_procedural_sound(self, sound_name: str) -> Optional[any]:
        """Generate a procedural sound effect."""
        if not self.is_initialized:
            return None
        
        sound_effect = HOLOGRAPHIC_SOUNDS.get(sound_name)
        if not sound_effect:
            return None
        
        try:
            # Generate different types of sounds based on their purpose
            if sound_name == "button_hover":
                audio_data = self.sound_generator.generate_beep(800, 0.1, 0.3)
            elif sound_name == "button_click":
                audio_data = self.sound_generator.generate_beep(1200, 0.15, 0.5)
            elif sound_name == "panel_select":
                audio_data = self.sound_generator.generate_harmonic_chord(
                    440, 0.3, [1.0, 1.5, 2.0], 0.4
                )
            elif sound_name == "success":
                audio_data = self.sound_generator.generate_harmonic_chord(
                    523, 0.5, [1.0, 1.25, 1.5, 2.0], 0.6
                )
            elif sound_name == "error":
                audio_data = self.sound_generator.generate_noise_burst(
                    0.4, (200, 400), 0.5
                )
            elif sound_name == "notification":
                audio_data = self.sound_generator.generate_beep(880, 0.2, 0.4)
            elif sound_name == "data_scan":
                audio_data = self.sound_generator.generate_sweep(
                    600, 1200, 0.8, 0.3
                )
            elif sound_name == "camera_zoom":
                audio_data = self.sound_generator.generate_sweep(
                    300, 600, 0.3, 0.2
                )
            else:
                # Default beep
                audio_data = self.sound_generator.generate_beep(600, 0.2, 0.3)
            
            # Convert to pygame sound
            sound = pygame.sndarray.make_sound(audio_data)
            return sound
            
        except Exception as e:
            self.logger.error(f"Failed to generate sound '{sound_name}': {e}")
            return None
    
    def play_sound(self, sound_name: str, volume_override: Optional[float] = None,
                   spatial_position: Optional[Tuple[float, float, float]] = None) -> bool:
        """
        Play a sound effect.
        
        Args:
            sound_name: Name of the sound to play
            volume_override: Override the default volume (0.0 to 1.0)
            spatial_position: 3D position for spatial audio (x, y, z)
            
        Returns:
            True if sound was played successfully
        """
        if not self.is_initialized or self.muted:
            return False
        
        sound_effect = HOLOGRAPHIC_SOUNDS.get(sound_name)
        if not sound_effect:
            self.logger.warning(f"Unknown sound effect: {sound_name}")
            return False
        
        try:
            # Get or generate the sound
            sound = self.sound_cache.get(sound_name)
            if not sound:
                sound = self._generate_procedural_sound(sound_name)
                if sound:
                    self.sound_cache[sound_name] = sound
                else:
                    return False
            
            # Calculate final volume
            category_volume = self.category_volumes.get(sound_effect.category, 1.0)
            final_volume = self.master_volume * category_volume * sound_effect.volume
            
            if volume_override is not None:
                final_volume = volume_override
            
            final_volume = max(0.0, min(1.0, final_volume))
            
            # Apply spatial audio if specified
            left_volume = final_volume
            right_volume = final_volume
            
            if spatial_position and sound_effect.spatial:
                left_volume, right_volume = self._calculate_spatial_audio(
                    spatial_position, final_volume
                )
            
            # Play the sound
            sound.set_volume(final_volume)
            channel = pygame.mixer.find_channel()
            if channel:
                channel.play(sound)
                
                # Apply stereo positioning if spatial
                if spatial_position and sound_effect.spatial:
                    channel.set_volume(left_volume, right_volume)
                
                return True
            else:
                self.logger.warning("No available audio channels")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to play sound '{sound_name}': {e}")
            return False
    
    def _calculate_spatial_audio(self, position: Tuple[float, float, float], 
                               base_volume: float) -> Tuple[float, float]:
        """Calculate stereo positioning based on 3D position."""
        x, y, z = position
        
        # Simple stereo panning based on X position
        # Assumes listener at origin facing negative Z
        pan = max(-1.0, min(1.0, x / 10.0))  # Normalize to -1 to 1
        
        # Calculate distance attenuation
        distance = math.sqrt(x*x + y*y + z*z)
        distance_factor = max(0.1, 1.0 / (1.0 + distance * 0.1))
        
        # Apply panning
        left_volume = base_volume * distance_factor * (1.0 - max(0, pan))
        right_volume = base_volume * distance_factor * (1.0 + min(0, pan))
        
        return left_volume, right_volume
    
    def play_ambient_loop(self, sound_name: str) -> bool:
        """Start playing an ambient sound loop."""
        if not self.is_initialized or self.muted:
            return False
        
        sound_effect = HOLOGRAPHIC_SOUNDS.get(sound_name)
        if not sound_effect or not sound_effect.loop:
            return False
        
        try:
            # Stop current ambient if playing
            self.stop_ambient_loop()
            
            # Generate ambient sound
            if sound_name == "holographic_hum":
                # Generate continuous low hum
                audio_data = self.sound_generator.generate_beep(120, 2.0, 0.1, "linear")
            elif sound_name == "energy_flow":
                # Generate flowing energy sound
                audio_data = self.sound_generator.generate_sweep(80, 200, 3.0, 0.15)
            else:
                audio_data = self.sound_generator.generate_beep(100, 1.0, 0.1)
            
            sound = pygame.sndarray.make_sound(audio_data)
            
            # Play on dedicated ambient channel
            self.current_ambient_channel = pygame.mixer.Channel(0)
            self.current_ambient_channel.play(sound, loops=-1)  # Infinite loop
            
            # Set volume
            category_volume = self.category_volumes.get(sound_effect.category, 1.0)
            final_volume = self.master_volume * category_volume * sound_effect.volume
            self.current_ambient_channel.set_volume(final_volume)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to play ambient loop '{sound_name}': {e}")
            return False
    
    def stop_ambient_loop(self) -> None:
        """Stop the current ambient loop."""
        if self.current_ambient_channel:
            self.current_ambient_channel.stop()
            self.current_ambient_channel = None
    
    def set_master_volume(self, volume: float) -> None:
        """Set master volume (0.0 to 1.0)."""
        self.master_volume = max(0.0, min(1.0, volume))
        self.config.audio.master_volume = self.master_volume
    
    def set_category_volume(self, category: SoundCategory, volume: float) -> None:
        """Set volume for a specific sound category."""
        self.category_volumes[category] = max(0.0, min(1.0, volume))
    
    def set_muted(self, muted: bool) -> None:
        """Mute or unmute all sounds."""
        self.muted = muted
        if muted:
            self.stop_ambient_loop()
    
    def is_sound_available(self) -> bool:
        """Check if sound system is available and initialized."""
        return self.is_initialized
    
    def cleanup(self) -> None:
        """Cleanup audio resources."""
        try:
            self.stop_ambient_loop()
            self.sound_cache.clear()
            
            if PYGAME_AVAILABLE and pygame.mixer.get_init():
                pygame.mixer.quit()
            
            self.is_initialized = False
            self.logger.info("Sound system cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during sound cleanup: {e}")
    
    def get_sound_info(self) -> Dict:
        """Get information about the sound system."""
        return {
            "initialized": self.is_initialized,
            "pygame_available": PYGAME_AVAILABLE,
            "master_volume": self.master_volume,
            "muted": self.muted,
            "cached_sounds": len(self.sound_cache),
            "category_volumes": {cat.value: vol for cat, vol in self.category_volumes.items()}
        }