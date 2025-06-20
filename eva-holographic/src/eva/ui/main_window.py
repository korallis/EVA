"""
Holographic Main Window

The primary 3D holographic interface window for EVA.
Implements the futuristic holographic panel system with floating 3D elements.
"""

import logging
import sys
from typing import Optional, Dict, List
import asyncio

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QStackedWidget, QLabel, QFrame, QPushButton,
    QSplitter, QStatusBar, QMenuBar, QMessageBox
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread
from PyQt6.QtGui import (
    QFont, QPalette, QColor, QLinearGradient, 
    QBrush, QPainter, QAction, QIcon
)
from PyQt6.QtOpenGL import QOpenGLWidget

from ..core.config import EVAConfig
from ..core.models import HolographicPanel, Vector3D
from ..api.auth_manager import AuthenticationManager
from .widgets.holographic_viewport import HolographicViewport
from .widgets.navigation_panel import NavigationPanel
from .widgets.status_display import StatusDisplay
from .widgets.welcome_screen import WelcomeScreen


logger = logging.getLogger(__name__)


class HolographicMainWindow(QMainWindow):
    """
    Main application window with 3D holographic interface.
    
    Provides the primary interface for EVA with floating holographic panels,
    3D navigation, and immersive sci-fi styling.
    """
    
    # Signals
    panel_created = pyqtSignal(str, str)  # panel_id, panel_type
    panel_destroyed = pyqtSignal(str)  # panel_id
    authentication_requested = pyqtSignal()
    
    def __init__(self, config: EVAConfig, sound_manager=None, url_handler=None, parent: Optional[QWidget] = None):
        """Initialize the holographic main window."""
        super().__init__(parent)
        
        self.config = config
        self.sound_manager = sound_manager
        self.url_handler = url_handler
        self.logger = logging.getLogger(__name__)
        
        # 3D holographic panels
        self.holographic_panels: Dict[str, HolographicPanel] = {}
        self.active_panel: Optional[str] = None
        
        # Authentication
        self.auth_manager: Optional[AuthenticationManager] = None
        
        # UI components
        self.holographic_viewport: Optional[HolographicViewport] = None
        self.navigation_panel: Optional[NavigationPanel] = None
        self.status_display: Optional[StatusDisplay] = None
        self.welcome_screen: Optional[WelcomeScreen] = None
        
        # Layout components
        self.central_widget: Optional[QWidget] = None
        self.main_splitter: Optional[QSplitter] = None
        self.content_stack: Optional[QStackedWidget] = None
        
        # Timers
        self.render_timer: Optional[QTimer] = None
        self.status_update_timer: Optional[QTimer] = None
        
        # Initialize authentication manager
        if self.url_handler:
            self.auth_manager = AuthenticationManager(self.config, self.url_handler)
            asyncio.create_task(self.auth_manager.initialize())
        
        # Initialize UI
        self._init_ui()
        self._setup_holographic_theme()
        self._setup_timers()
        self._connect_signals()
        
        self.logger.info("Holographic main window initialized")
    
    def _init_ui(self) -> None:
        """Initialize the user interface components."""
        # Set window properties
        self.setWindowTitle(f"EVA Holographic v{self.config.app_version}")
        self.setMinimumSize(1200, 800)
        self.resize(1600, 1000)
        
        # Create menu bar
        self._create_menu_bar()
        
        # Create central widget and main layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        # Main horizontal splitter
        self.main_splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Create navigation panel (left sidebar)
        self.navigation_panel = NavigationPanel(self.config, self.sound_manager)
        self.navigation_panel.setFixedWidth(250)
        self.main_splitter.addWidget(self.navigation_panel)
        
        # Create content area with 3D viewport
        self._create_content_area()
        
        # Set splitter proportions
        self.main_splitter.setSizes([250, 1350])  # Navigation : Content
        self.main_splitter.setCollapsible(0, False)  # Don't allow navigation to collapse
        
        # Main layout
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        main_layout.addWidget(self.main_splitter)
        
        self.central_widget.setLayout(main_layout)
        
        # Create status bar
        self._create_status_bar()
        
        self.logger.debug("UI components initialized")
    
    def _create_menu_bar(self) -> None:
        """Create the application menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("&File")
        
        # Import fitting action
        import_action = QAction("&Import Fitting...", self)
        import_action.setShortcut("Ctrl+I")
        import_action.triggered.connect(self._import_fitting)
        file_menu.addAction(import_action)
        
        # Export fitting action
        export_action = QAction("&Export Fitting...", self)
        export_action.setShortcut("Ctrl+E")
        export_action.triggered.connect(self._export_fitting)
        file_menu.addAction(export_action)
        
        file_menu.addSeparator()
        
        # Settings action
        settings_action = QAction("&Settings...", self)
        settings_action.setShortcut("Ctrl+,")
        settings_action.triggered.connect(self._show_settings)
        file_menu.addAction(settings_action)
        
        file_menu.addSeparator()
        
        # Exit action
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # View menu
        view_menu = menubar.addMenu("&View")
        
        # Toggle navigation panel
        toggle_nav_action = QAction("Toggle &Navigation Panel", self)
        toggle_nav_action.setShortcut("F9")
        toggle_nav_action.triggered.connect(self._toggle_navigation_panel)
        view_menu.addAction(toggle_nav_action)
        
        # Fullscreen action
        fullscreen_action = QAction("&Fullscreen", self)
        fullscreen_action.setShortcut("F11")
        fullscreen_action.triggered.connect(self._toggle_fullscreen)
        view_menu.addAction(fullscreen_action)
        
        # Tools menu
        tools_menu = menubar.addMenu("&Tools")
        
        # Character authentication
        auth_action = QAction("&Authenticate Character...", self)
        auth_action.triggered.connect(self._authenticate_character)
        tools_menu.addAction(auth_action)
        
        # Help menu
        help_menu = menubar.addMenu("&Help")
        
        # About action
        about_action = QAction("&About EVA...", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)
    
    def _create_content_area(self) -> None:
        """Create the main content area with 3D holographic viewport."""
        # Content container
        content_container = QWidget()
        content_layout = QVBoxLayout()
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)
        
        # Create 3D holographic viewport
        self.holographic_viewport = HolographicViewport(self.config, self.sound_manager)
        
        # Content stack for different screens
        self.content_stack = QStackedWidget()
        
        # Add holographic viewport as main content
        self.content_stack.addWidget(self.holographic_viewport)
        
        # Create welcome screen
        self.welcome_screen = WelcomeScreen(self.config)
        self.content_stack.addWidget(self.welcome_screen)
        
        content_layout.addWidget(self.content_stack)
        content_container.setLayout(content_layout)
        
        self.main_splitter.addWidget(content_container)
    
    def _create_status_bar(self) -> None:
        """Create the status bar with holographic styling."""
        status_bar = QStatusBar()
        self.setStatusBar(status_bar)
        
        # Create status display widget
        self.status_display = StatusDisplay(self.config)
        status_bar.addPermanentWidget(self.status_display)
        
        # Connect viewport to status display for render stats
        if self.holographic_viewport:
            self.status_display.set_viewport(self.holographic_viewport)
        
        # Set initial status
        status_bar.showMessage("EVA Holographic Interface Ready")
    
    def _setup_holographic_theme(self) -> None:
        """Apply the holographic theme to the main window."""
        # Create holographic color palette
        palette = QPalette()
        
        # Background colors (deep space black)
        bg_color = QColor(10, 10, 10)  # #0a0a0a
        palette.setColor(QPalette.ColorRole.Window, bg_color)
        palette.setColor(QPalette.ColorRole.WindowText, QColor(0, 212, 255))  # Cyan text
        
        # Base colors for input fields
        palette.setColor(QPalette.ColorRole.Base, QColor(20, 20, 20))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(30, 30, 30))
        
        # Button colors
        palette.setColor(QPalette.ColorRole.Button, QColor(0, 100, 150))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(0, 212, 255))
        
        # Highlight colors
        palette.setColor(QPalette.ColorRole.Highlight, QColor(0, 150, 200))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor(255, 255, 255))
        
        self.setPalette(palette)
        
        # Set holographic stylesheet
        holographic_style = f\"\"\"
        QMainWindow {{
            background-color: #0a0a0a;
            color: #00d4ff;
            font-family: 'Segoe UI', 'Helvetica', monospace;
        }}
        
        QMenuBar {{
            background-color: #0a0a0a;
            color: #00d4ff;
            border-bottom: 1px solid #00d4ff;
            spacing: 3px;
            padding: 2px;
        }}
        
        QMenuBar::item {{
            background-color: transparent;
            padding: 4px 8px;
            border-radius: 3px;
        }}
        
        QMenuBar::item:selected {{
            background-color: rgba(0, 212, 255, 0.2);
            border: 1px solid #00d4ff;
        }}
        
        QMenu {{
            background-color: #1a1a1a;
            color: #00d4ff;
            border: 1px solid #00d4ff;
            border-radius: 5px;
            padding: 5px;
        }}
        
        QMenu::item {{
            padding: 5px 20px;
            border-radius: 3px;
        }}
        
        QMenu::item:selected {{
            background-color: rgba(0, 212, 255, 0.3);
        }}
        
        QStatusBar {{
            background-color: #0a0a0a;
            color: #00d4ff;
            border-top: 1px solid #00d4ff;
        }}
        
        QSplitter::handle {{
            background-color: #00d4ff;
            width: 2px;
            height: 2px;
        }}
        
        QSplitter::handle:hover {{
            background-color: #00ff80;
        }}
        \"\"\"
        
        self.setStyleSheet(holographic_style)
        
        # Set window icon (if available)
        try:
            # self.setWindowIcon(QIcon(":/icons/eva_holographic.png"))
            pass
        except:
            pass
        
        self.logger.debug("Holographic theme applied")
    
    def _setup_timers(self) -> None:
        """Setup application timers for updates and rendering."""
        # Render timer for 3D viewport
        self.render_timer = QTimer()
        self.render_timer.timeout.connect(self._update_3d_rendering)
        
        # Calculate interval based on target FPS
        target_fps = self.config.graphics.max_fps
        interval_ms = max(16, 1000 // target_fps)  # Minimum 16ms (60 FPS max)
        self.render_timer.start(interval_ms)
        
        # Status update timer
        self.status_update_timer = QTimer()
        self.status_update_timer.timeout.connect(self._update_status_display)
        self.status_update_timer.start(1000)  # Update every second
        
        self.logger.debug(f"Timers configured: render={interval_ms}ms, status=1000ms")
    
    def _connect_signals(self) -> None:
        """Connect UI signals and slots."""
        if self.navigation_panel:
            self.navigation_panel.panel_requested.connect(self._create_holographic_panel)
            self.navigation_panel.view_changed.connect(self._switch_to_view)
        
        if self.welcome_screen:
            self.welcome_screen.authentication_requested.connect(self._authenticate_character)
            self.welcome_screen.setup_completed.connect(self._show_main_interface)
        
        self.logger.debug("Signals connected")
    
    def _update_3d_rendering(self) -> None:
        """Update the 3D holographic rendering."""
        if self.holographic_viewport:
            self.holographic_viewport.update()
    
    def _update_status_display(self) -> None:
        """Update the status display with current information."""
        if self.status_display:
            self.status_display.update_status()
    
    def show_welcome_screen(self) -> None:
        """Show the welcome screen for first-time setup."""
        if self.content_stack and self.welcome_screen:
            self.content_stack.setCurrentWidget(self.welcome_screen)
            self.logger.info("Welcome screen displayed")
    
    def _show_main_interface(self) -> None:
        """Show the main holographic interface."""
        if self.content_stack and self.holographic_viewport:
            self.content_stack.setCurrentWidget(self.holographic_viewport)
            
            # Start ambient holographic sounds
            if self.sound_manager and self.config.audio.ambient_loops:
                self.sound_manager.play_ambient_loop("holographic_hum")
            
            self.logger.info("Main holographic interface displayed")
    
    def _create_holographic_panel(self, panel_type: str) -> None:
        """Create a new holographic panel."""
        try:
            panel = HolographicPanel(
                title=panel_type.replace("_", " ").title(),
                content_type=panel_type
            )
            
            # Set default position based on existing panels
            panel_count = len(self.holographic_panels)
            offset_x = (panel_count % 3) * 450
            offset_z = (panel_count // 3) * 100
            panel.set_position(offset_x - 450, 0, offset_z)
            
            self.holographic_panels[panel.panel_id] = panel
            
            if self.holographic_viewport:
                self.holographic_viewport.add_panel(panel)
            
            # Play success sound for panel creation
            if self.sound_manager:
                self.sound_manager.play_sound("success")
            
            self.panel_created.emit(panel.panel_id, panel_type)
            self.logger.info(f"Created holographic panel: {panel_type}")
            
        except Exception as e:
            # Play error sound for failed panel creation
            if self.sound_manager:
                self.sound_manager.play_sound("error")
            self.logger.error(f"Failed to create holographic panel {panel_type}: {e}")
    
    def _update_3d_rendering(self) -> None:
        """Update 3D rendering and viewport."""
        if self.holographic_viewport:
            # The viewport handles its own rendering via OpenGL
            pass
    
    def _update_status_display(self) -> None:
        """Update the status display with current metrics."""
        if self.status_display:
            self.status_display.update_status()
    
    def _switch_to_view(self, view_name: str) -> None:
        """Switch to a different view in the interface."""
        self.logger.info(f"Switching to view: {view_name}")
        # Implementation for view switching
    
    def _authenticate_character(self) -> None:
        """Start character authentication process."""
        # Play UI interaction sound
        if self.sound_manager:
            self.sound_manager.play_sound("button_click")
        
        if not self.auth_manager:
            QMessageBox.warning(
                self,
                "Authentication Error",
                "Authentication system is not available. Please restart the application."
            )
            return
        
        # Start authentication process
        asyncio.create_task(self._start_authentication())
    
    async def _start_authentication(self) -> None:
        """Start the authentication process asynchronously."""
        try:
            self.logger.info("Starting character authentication...")
            
            # Connect authentication signals
            self.auth_manager.authentication_completed.connect(self._on_authentication_success)
            self.auth_manager.authentication_failed.connect(self._on_authentication_failed)
            
            # Start authentication
            success = await self.auth_manager.start_authentication()
            
            if success:
                self.authentication_requested.emit()
                self.logger.info("Authentication process started")
            else:
                self.logger.error("Failed to start authentication process")
                
        except Exception as e:
            self.logger.error(f"Error starting authentication: {e}")
            QMessageBox.critical(
                self,
                "Authentication Error",
                f"Failed to start authentication: {str(e)}"
            )
    
    def _on_authentication_success(self, character_info: dict) -> None:
        """Handle successful authentication."""
        self.logger.info(f"Authentication successful for: {character_info.get('character_name', 'Unknown')}")
        
        # Play success sound
        if self.sound_manager:
            self.sound_manager.play_sound("success")
        
        # Show success message
        QMessageBox.information(
            self,
            "Authentication Successful",
            f"Successfully authenticated as {character_info.get('character_name', 'Unknown Character')}"
        )
        
        # Switch to main interface if on welcome screen
        if self.content_stack and self.content_stack.currentWidget() == self.welcome_screen:
            self._show_main_interface()
    
    def _on_authentication_failed(self, error_message: str) -> None:
        """Handle failed authentication."""
        self.logger.error(f"Authentication failed: {error_message}")
        
        # Play error sound
        if self.sound_manager:
            self.sound_manager.play_sound("error")
        
        # Show error message
        QMessageBox.warning(
            self,
            "Authentication Failed",
            f"Authentication failed: {error_message}"
        )
    
    def _import_fitting(self) -> None:
        """Import a ship fitting from file or clipboard."""
        self.logger.info("Import fitting requested")
        # Implementation for fitting import
    
    def _export_fitting(self) -> None:
        """Export current fitting to file or clipboard."""
        self.logger.info("Export fitting requested")
        # Implementation for fitting export
    
    def _show_settings(self) -> None:
        """Show application settings dialog."""
        self.logger.info("Settings dialog requested")
        # Implementation for settings dialog
    
    def _toggle_navigation_panel(self) -> None:
        """Toggle visibility of the navigation panel."""
        if self.navigation_panel:
            self.navigation_panel.setVisible(not self.navigation_panel.isVisible())
    
    def _toggle_fullscreen(self) -> None:
        """Toggle fullscreen mode."""
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()
    
    def _show_about(self) -> None:
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About EVA Holographic",
            f\"\"\"
            <h2>EVA - EVE Virtual Assistant</h2>
            <p><b>Version:</b> {self.config.app_version}</p>
            <p><b>Revolutionary 3D Holographic Interface</b></p>
            <p>
            EVA provides an immersive holographic experience for EVE Online pilots,
            featuring true 3D spatial interfaces, volumetric displays, and 
            cutting-edge visualization technology.
            </p>
            <p>
            <b>Technologies:</b><br>
            • Python {sys.version.split()[0]}<br>
            • PyQt6 with OpenGL<br>
            • ModernGL for 3D rendering<br>
            • ESI API integration
            </p>
            \"\"\"
        )
    
    async def cleanup(self) -> None:
        """Cleanup window resources."""
        try:
            self.logger.info("Cleaning up main window resources...")
            
            # Stop timers
            if self.render_timer:
                self.render_timer.stop()
            if self.status_update_timer:
                self.status_update_timer.stop()
            
            # Cleanup authentication manager
            if self.auth_manager:
                await self.auth_manager.cleanup()
            
            # Cleanup 3D viewport
            if self.holographic_viewport:
                await self.holographic_viewport.cleanup()
            
            # Clear holographic panels
            self.holographic_panels.clear()
            
            self.logger.info("Main window cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during main window cleanup: {e}")
    
    def closeEvent(self, event) -> None:
        """Handle window close event."""
        self.logger.info("Main window close requested")
        
        # Save window geometry
        try:
            # Could save window position/size to config here
            pass
        except Exception as e:
            self.logger.error(f"Failed to save window geometry: {e}")
        
        event.accept()