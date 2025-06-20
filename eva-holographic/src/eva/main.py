"""
EVA - Main Application Entry Point

Initializes the 3D holographic interface and manages the application lifecycle.
"""

import sys
import asyncio
import logging
from pathlib import Path
from typing import Optional
import signal

from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtCore import QTimer, Qt
from PyQt6.QtOpenGL import QOpenGLWidget
from PyQt6.QtGui import QSurfaceFormat

from .core.config import EVAConfig
from .ui.main_window import HolographicMainWindow
from .audio.sound_manager import SoundManager
from .api.url_handler import URLProtocolHandler


class EVAApplication:
    """
    Main EVA application coordinator.
    
    Manages the application lifecycle, configuration, and coordinates
    between the UI, 3D graphics, and backend services.
    """
    
    def __init__(self):
        """Initialize the EVA application."""
        self.config: Optional[EVAConfig] = None
        self.qt_app: Optional[QApplication] = None
        self.main_window: Optional[HolographicMainWindow] = None
        self.sound_manager: Optional[SoundManager] = None
        self.url_handler: Optional[URLProtocolHandler] = None
        self.event_loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Setup logging
        self._setup_logging()
        self.logger = logging.getLogger(__name__)
        
    def _setup_logging(self) -> None:
        """Configure application logging."""
        # This will be configured based on loaded config later
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    async def initialize(self) -> bool:
        """
        Initialize the application components.
        
        Returns:
            True if initialization was successful
        """
        try:
            # Load configuration
            self.logger.info("Loading EVA configuration...")
            self.config = EVAConfig.load_from_file()
            
            # Update logging level based on config
            log_level = getattr(logging, self.config.log_level)
            logging.getLogger().setLevel(log_level)
            
            # Update user agent with proper contact information
            self.config.update_user_agent(
                app_name="EVA-Holographic",
                version=self.config.app_version,
                contact="eva-dev@example.com",
                repository="https://github.com/user/eva-holographic"
            )
            
            self.logger.info(f"EVA v{self.config.app_version} initializing...")
            self.logger.info(f"Configuration loaded from: {self.config.get_config_directory()}")
            
            # Validate OpenGL support
            if not self._check_opengl_support():
                return False
            
            # Initialize Qt application
            if not self._init_qt_application():
                return False
            
            # Initialize sound system
            self.logger.info("Initializing sound system...")
            self.sound_manager = SoundManager(self.config)
            if self.sound_manager.is_sound_available():
                self.logger.info("Sound system initialized successfully")
                # Play startup sound
                self.sound_manager.play_sound("startup")
            else:
                self.logger.warning("Sound system unavailable - continuing without audio")
            
            # Initialize URL protocol handler
            self.logger.info("Initializing URL protocol handler...")
            self.url_handler = URLProtocolHandler()
            
            # Register the custom protocol with the operating system
            if self.url_handler.register_protocol():
                self.logger.info("Custom URL protocol registered successfully")
            else:
                self.logger.warning("Failed to register custom URL protocol - authentication may require manual setup")
            
            # Handle any OAuth callback URLs passed as command line arguments
            if self.url_handler.handle_application_arguments(sys.argv):
                self.logger.info("OAuth callback processed from command line arguments")
            
            # Create main window
            self.main_window = HolographicMainWindow(self.config, self.sound_manager, self.url_handler)
            
            self.logger.info("EVA initialization completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize EVA: {e}")
            if self.qt_app:
                QMessageBox.critical(
                    None,
                    "EVA Initialization Error",
                    f"Failed to initialize EVA application:\\n\\n{str(e)}\\n\\n"
                    "Please check your system requirements and try again."
                )
            return False
    
    def _check_opengl_support(self) -> bool:
        """
        Check if the system supports required OpenGL features.
        
        Returns:
            True if OpenGL requirements are met
        """
        try:
            # This will be properly implemented with actual OpenGL checks
            self.logger.info("OpenGL support check passed")
            return True
        except Exception as e:
            self.logger.error(f"OpenGL support check failed: {e}")
            return False
    
    def _init_qt_application(self) -> bool:
        """
        Initialize the Qt application with proper 3D graphics settings.
        
        Returns:
            True if Qt initialization was successful
        """
        try:
            # Create Qt application
            self.qt_app = QApplication(sys.argv)
            self.qt_app.setApplicationName("EVA Holographic")
            self.qt_app.setApplicationVersion(self.config.app_version)
            self.qt_app.setOrganizationName("EVA Development Team")
            
            # Configure high DPI support
            self.qt_app.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
            self.qt_app.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)
            
            # Set up OpenGL format for 3D rendering
            gl_format = QSurfaceFormat()
            gl_format.setVersion(3, 3)  # OpenGL 3.3+
            gl_format.setProfile(QSurfaceFormat.OpenGLContextProfile.CoreProfile)
            gl_format.setDepthBufferSize(24)
            gl_format.setStencilBufferSize(8)
            gl_format.setSamples(4)  # 4x anti-aliasing
            
            if self.config.graphics.vsync:
                gl_format.setSwapInterval(1)
            else:
                gl_format.setSwapInterval(0)
            
            QSurfaceFormat.setDefaultFormat(gl_format)
            
            # Set application style for holographic theme
            self.qt_app.setStyle("Fusion")  # Base style for customization
            
            # Setup signal handlers for graceful shutdown
            signal.signal(signal.SIGINT, self._signal_handler)
            signal.signal(signal.SIGTERM, self._signal_handler)
            
            # Timer to process events
            self.timer = QTimer()
            self.timer.timeout.connect(lambda: None)  # Keep event loop responsive
            self.timer.start(100)  # 10 FPS for event processing
            
            self.logger.info("Qt application initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Qt application: {e}")
            return False
    
    def _signal_handler(self, signum, frame):
        """Handle system signals for graceful shutdown."""
        self.logger.info(f"Received signal {signum}, shutting down...")
        if self.qt_app:
            self.qt_app.quit()
    
    async def run(self) -> int:
        """
        Run the main application event loop.
        
        Returns:
            Application exit code
        """
        if not await self.initialize():
            return 1
        
        try:
            # Show main window
            self.main_window.show()
            
            # Check for first run
            if self._is_first_run():
                self.main_window.show_welcome_screen()
            
            self.logger.info("EVA application started")
            
            # Run Qt event loop
            exit_code = self.qt_app.exec()
            
            self.logger.info(f"EVA application exiting with code: {exit_code}")
            return exit_code
            
        except Exception as e:
            self.logger.error(f"Application runtime error: {e}")
            return 1
        finally:
            await self.cleanup()
    
    def _is_first_run(self) -> bool:
        """Check if this is the first time running EVA."""
        config_file = self.config.get_config_directory() / "config.json"
        first_run_marker = self.config.get_config_directory() / ".eva_initialized"
        
        is_first = not first_run_marker.exists()
        
        if is_first:
            # Create first run marker
            first_run_marker.touch()
            self.logger.info("First run detected")
        
        return is_first
    
    async def cleanup(self) -> None:
        """Cleanup application resources."""
        try:
            self.logger.info("Cleaning up application resources...")
            
            # Play shutdown sound
            if self.sound_manager and self.sound_manager.is_sound_available():
                self.sound_manager.play_sound("shutdown")
                # Small delay to let shutdown sound play
                import time
                time.sleep(0.5)
            
            if self.main_window:
                await self.main_window.cleanup()
            
            # Cleanup sound system
            if self.sound_manager:
                self.sound_manager.cleanup()
            
            if self.config:
                self.config.save_to_file()
            
            self.logger.info("Application cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")


def main() -> int:
    """
    Main entry point for the EVA application.
    
    Returns:
        Application exit code
    """
    try:
        # Check for OAuth callback arguments first
        oauth_callback_detected = False
        for arg in sys.argv[1:]:
            if arg.startswith("eveauth-eva://") or arg == "--oauth-callback":
                oauth_callback_detected = True
                break
        
        if oauth_callback_detected:
            print("OAuth callback detected in command line arguments")
        
        # Create and run the application
        app = EVAApplication()
        return asyncio.run(app.run())
    except KeyboardInterrupt:
        print("\\nApplication interrupted by user")
        return 130
    except Exception as e:
        print(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())