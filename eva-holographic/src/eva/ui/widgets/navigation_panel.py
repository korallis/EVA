"""
Navigation Panel

Holographic navigation sidebar for accessing different EVA features
and managing 3D panels.
"""

import logging
from typing import Optional

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, 
    QLabel, QFrame, QScrollArea, QButtonGroup
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QIcon

from ...core.config import EVAConfig


logger = logging.getLogger(__name__)


class NavigationPanel(QWidget):
    """
    Holographic navigation panel for main interface sections.
    
    Provides access to different EVA features like ship fitting,
    skill planning, character analytics, etc.
    """
    
    # Signals
    panel_requested = pyqtSignal(str)  # panel_type
    view_changed = pyqtSignal(str)  # view_name
    
    def __init__(self, config: EVAConfig, sound_manager=None, parent: Optional[QWidget] = None):
        """Initialize the navigation panel."""
        super().__init__(parent)
        
        self.config = config
        self.sound_manager = sound_manager
        self.logger = logging.getLogger(__name__)
        
        # Button group for exclusive selection
        self.nav_button_group = QButtonGroup()
        self.nav_button_group.setExclusive(True)
        
        # Active view tracking
        self.active_view = "command_center"
        
        # Initialize UI
        self._init_ui()
        self._apply_holographic_styling()
        
        self.logger.info("Navigation panel initialized")
    
    def _init_ui(self) -> None:
        """Initialize the navigation panel UI."""
        layout = QVBoxLayout()
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(5)
        
        # Header
        header_label = QLabel("EVA NAVIGATION")
        header_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        header_label.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        layout.addWidget(header_label)
        
        # Separator
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        layout.addWidget(separator)
        
        # Navigation buttons
        self._create_navigation_buttons(layout)
        
        # Stretch to push everything to top
        layout.addStretch()
        
        # Panel management section
        self._create_panel_section(layout)
        
        self.setLayout(layout)
    
    def _create_navigation_buttons(self, layout: QVBoxLayout) -> None:
        """Create the main navigation buttons."""
        nav_items = [
            ("command_center", "Command Center", "Main dashboard and overview"),
            ("ship_fitting", "Ship Fitting", "Design and optimize ship fittings"),
            ("skill_planning", "Skill Planning", "Plan character skill training"),
            ("character_analytics", "Character Analytics", "Analyze character performance"),
            ("market_analysis", "Market Analysis", "Market data and trading tools"),
            ("fleet_manager", "Fleet Manager", "Fleet composition and management"),
        ]
        
        for view_id, title, tooltip in nav_items:
            button = self._create_nav_button(view_id, title, tooltip)
            layout.addWidget(button)
            self.nav_button_group.addButton(button)
    
    def _create_nav_button(self, view_id: str, title: str, tooltip: str) -> QPushButton:
        """Create a navigation button with holographic styling."""
        button = QPushButton(title)
        button.setToolTip(tooltip)
        button.setCheckable(True)
        button.setMinimumHeight(45)
        
        # Set as checked if this is the default view
        if view_id == self.active_view:
            button.setChecked(True)
        
        # Connect signal
        button.clicked.connect(lambda checked, vid=view_id: self._on_nav_button_clicked(vid))
        
        return button
    
    def _create_panel_section(self, layout: QVBoxLayout) -> None:
        """Create the 3D panel management section."""
        # Section header
        panel_header = QLabel("3D PANELS")
        panel_header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        panel_header.setFont(QFont("Arial", 10, QFont.Weight.Bold))
        layout.addWidget(panel_header)
        
        # Panel buttons
        panel_buttons = [
            ("ship_viewer", "Ship Viewer"),
            ("fitting_stats", "Fitting Stats"),
            ("skill_tree", "Skill Tree"),
            ("market_charts", "Market Charts"),
            ("character_sheet", "Character Sheet"),
        ]
        
        for panel_id, panel_name in panel_buttons:
            button = QPushButton(f"+ {panel_name}")
            button.setMinimumHeight(35)
            button.clicked.connect(lambda checked, pid=panel_id: self._create_panel(pid))
            layout.addWidget(button)
    
    def _on_nav_button_clicked(self, view_id: str) -> None:
        """Handle navigation button click."""
        if view_id != self.active_view:
            self.active_view = view_id
            self.view_changed.emit(view_id)
            self.logger.info(f"Navigation changed to: {view_id}")
    
    def _create_panel(self, panel_type: str) -> None:
        """Request creation of a 3D holographic panel."""
        self.panel_requested.emit(panel_type)
        self.logger.info(f"Panel creation requested: {panel_type}")
    
    def _apply_holographic_styling(self) -> None:
        """Apply holographic styling to the navigation panel."""
        style = \"\"\"
        NavigationPanel {
            background-color: #0f0f0f;
            border-right: 2px solid #00d4ff;
        }
        
        QLabel {
            color: #00d4ff;
            padding: 5px;
        }
        
        QPushButton {
            background-color: rgba(0, 100, 150, 0.3);
            border: 1px solid #00d4ff;
            border-radius: 5px;
            color: #00d4ff;
            font-weight: bold;
            padding: 8px;
            text-align: left;
        }
        
        QPushButton:hover {
            background-color: rgba(0, 150, 200, 0.4);
            border: 1px solid #00ff80;
            color: #00ff80;
        }
        
        QPushButton:checked {
            background-color: rgba(0, 212, 255, 0.5);
            border: 2px solid #00d4ff;
            color: #ffffff;
        }
        
        QPushButton:pressed {
            background-color: rgba(0, 212, 255, 0.7);
        }
        
        QFrame[frameShape="4"] {
            color: #00d4ff;
            background-color: #00d4ff;
        }
        \"\"\"
        
        self.setStyleSheet(style)