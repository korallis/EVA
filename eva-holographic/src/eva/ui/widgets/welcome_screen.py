"""
Welcome Screen

First-time setup and onboarding screen for new EVA users.
Provides guided setup for ESI authentication and initial configuration.
"""

import logging
from typing import Optional

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QFrame, QProgressBar, QTextEdit
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QFont, QMovie, QPixmap

from ...core.config import EVAConfig


logger = logging.getLogger(__name__)


class WelcomeScreen(QWidget):
    """
    Welcome and setup screen for first-time EVA users.
    
    Guides users through initial setup including ESI authentication,
    basic configuration, and introduction to the holographic interface.
    """
    
    # Signals
    authentication_requested = pyqtSignal()
    setup_completed = pyqtSignal()
    
    def __init__(self, config: EVAConfig, parent: Optional[QWidget] = None):
        """Initialize the welcome screen."""
        super().__init__(parent)
        
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Setup state
        self.setup_step = 0
        self.max_steps = 3
        
        # UI components
        self.title_label: Optional[QLabel] = None
        self.subtitle_label: Optional[QLabel] = None
        self.content_label: Optional[QLabel] = None
        self.progress_bar: Optional[QProgressBar] = None
        self.action_button: Optional[QPushButton] = None
        self.skip_button: Optional[QPushButton] = None
        
        # Initialize UI
        self._init_ui()
        self._apply_holographic_styling()
        self._update_step_content()
        
        self.logger.info("Welcome screen initialized")
    
    def _init_ui(self) -> None:
        """Initialize the welcome screen UI."""
        layout = QVBoxLayout()
        layout.setContentsMargins(50, 50, 50, 50)
        layout.setSpacing(30)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Header section
        self._create_header_section(layout)
        
        # Content section
        self._create_content_section(layout)
        
        # Progress section
        self._create_progress_section(layout)
        
        # Action buttons
        self._create_action_section(layout)
        
        self.setLayout(layout)
    
    def _create_header_section(self, layout: QVBoxLayout) -> None:
        """Create the header section with title and logo."""
        # Main title
        self.title_label = QLabel("Welcome to EVA Holographic")
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title_label.setFont(QFont("Arial", 32, QFont.Weight.Bold))
        layout.addWidget(self.title_label)
        
        # Subtitle
        self.subtitle_label = QLabel("Revolutionary 3D Holographic Interface for EVE Online")
        self.subtitle_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.subtitle_label.setFont(QFont("Arial", 16))
        layout.addWidget(self.subtitle_label)
        
        # Separator
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        separator.setMaximumWidth(600)
        layout.addWidget(separator, alignment=Qt.AlignmentFlag.AlignCenter)
    
    def _create_content_section(self, layout: QVBoxLayout) -> None:
        """Create the main content section."""
        # Content container
        content_frame = QFrame()
        content_frame.setMaximumWidth(800)
        content_frame.setMinimumHeight(300)
        
        content_layout = QVBoxLayout()
        content_layout.setContentsMargins(30, 30, 30, 30)
        
        # Content text
        self.content_label = QLabel()
        self.content_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.content_label.setFont(QFont("Arial", 14))
        self.content_label.setWordWrap(True)
        content_layout.addWidget(self.content_label)
        
        content_frame.setLayout(content_layout)
        layout.addWidget(content_frame, alignment=Qt.AlignmentFlag.AlignCenter)
    
    def _create_progress_section(self, layout: QVBoxLayout) -> None:
        """Create the progress indicator section."""
        progress_layout = QVBoxLayout()
        
        # Progress label
        progress_label = QLabel("Setup Progress")
        progress_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        progress_label.setFont(QFont("Arial", 12))
        progress_layout.addWidget(progress_label)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setMaximumWidth(400)
        self.progress_bar.setMinimum(0)
        self.progress_bar.setMaximum(self.max_steps)
        self.progress_bar.setValue(0)
        progress_layout.addWidget(self.progress_bar, alignment=Qt.AlignmentFlag.AlignCenter)
        
        layout.addLayout(progress_layout)
    
    def _create_action_section(self, layout: QVBoxLayout) -> None:
        """Create the action buttons section."""
        button_layout = QHBoxLayout()
        button_layout.setSpacing(20)
        
        # Skip button
        self.skip_button = QPushButton("Skip Setup")
        self.skip_button.setMinimumSize(120, 40)
        self.skip_button.clicked.connect(self._skip_setup)
        button_layout.addWidget(self.skip_button)
        
        # Spacer
        button_layout.addStretch()
        
        # Main action button
        self.action_button = QPushButton("Get Started")
        self.action_button.setMinimumSize(150, 40)
        self.action_button.setDefault(True)
        self.action_button.clicked.connect(self._handle_action_button)
        button_layout.addWidget(self.action_button)
        
        layout.addLayout(button_layout)
    
    def _update_step_content(self) -> None:
        """Update the content based on current setup step."""
        if self.setup_step == 0:
            self._show_welcome_step()
        elif self.setup_step == 1:
            self._show_authentication_step()
        elif self.setup_step == 2:
            self._show_configuration_step()
        elif self.setup_step == 3:
            self._show_completion_step()
        
        # Update progress bar
        if self.progress_bar:
            self.progress_bar.setValue(self.setup_step)
    
    def _show_welcome_step(self) -> None:
        """Show the welcome step content."""
        content = \"\"\"
        <h2>Welcome to the Future of EVE Online Tools</h2>
        <p>
        EVA Holographic transforms how you interact with EVE Online data through 
        a revolutionary 3D holographic interface. Experience ship fitting, skill planning, 
        and character analysis like never before.
        </p>
        <p><b>Key Features:</b></p>
        <ul>
        <li>• <b>3D Holographic Panels</b> - Floating interface elements in true 3D space</li>
        <li>• <b>Spatial Interaction</b> - Navigate through data with natural gestures</li>
        <li>• <b>Real-time Visualization</b> - Live ship models and data streams</li>
        <li>• <b>Advanced Analytics</b> - AI-powered recommendations and insights</li>
        </ul>
        <p>Let's get you set up with secure access to your EVE Online character data.</p>
        \"\"\"
        
        if self.content_label:
            self.content_label.setText(content)
        
        if self.action_button:
            self.action_button.setText("Continue")
    
    def _show_authentication_step(self) -> None:
        """Show the ESI authentication step."""
        content = \"\"\"
        <h2>Connect Your EVE Online Character</h2>
        <p>
        To provide personalized ship fitting recommendations and character analysis, 
        EVA needs secure access to your EVE Online character data.
        </p>
        <p><b>EVA uses CCP's official ESI API with:</b></p>
        <ul>
        <li>• <b>OAuth2 Security</b> - Industry-standard authentication</li>
        <li>• <b>Limited Permissions</b> - Only reads necessary character data</li>
        <li>• <b>Local Storage</b> - All data stays on your computer</li>
        <li>• <b>No Passwords</b> - EVA never sees your EVE login credentials</li>
        </ul>
        <p>
        Click "Authenticate" to open your browser and log in through CCP's 
        secure authentication system.
        </p>
        \"\"\"
        
        if self.content_label:
            self.content_label.setText(content)
        
        if self.action_button:
            self.action_button.setText("Authenticate")
    
    def _show_configuration_step(self) -> None:
        """Show the configuration step."""
        content = \"\"\"
        <h2>Configure Your Holographic Experience</h2>
        <p>
        Customize EVA's 3D holographic interface to match your preferences 
        and system capabilities.
        </p>
        <p><b>Recommended Settings:</b></p>
        <ul>
        <li>• <b>Graphics Quality:</b> High (adjustable in settings later)</li>
        <li>• <b>Particle Effects:</b> Enabled for full immersion</li>
        <li>• <b>Spatial Audio:</b> Enabled for enhanced feedback</li>
        <li>• <b>Auto-arrangement:</b> Let EVA organize panels intelligently</li>
        </ul>
        <p>
        These settings provide the best balance of visual quality and performance. 
        You can adjust them anytime in the Settings menu.
        </p>
        \"\"\"
        
        if self.content_label:
            self.content_label.setText(content)
        
        if self.action_button:
            self.action_button.setText("Apply Settings")
    
    def _show_completion_step(self) -> None:
        """Show the setup completion step."""
        content = \"\"\"
        <h2>Setup Complete!</h2>
        <p>
        <b>🎉 Welcome to the EVA Holographic experience!</b>
        </p>
        <p>
        Your 3D holographic interface is now ready. You can:
        </p>
        <ul>
        <li>• <b>Browse Ships</b> - Explore ship models in 3D wireframe glory</li>
        <li>• <b>Create Fittings</b> - Design optimized ship configurations</li>
        <li>• <b>Plan Skills</b> - Visualize character progression in 3D</li>
        <li>• <b>Analyze Performance</b> - View real-time statistics and recommendations</li>
        </ul>
        <p>
        <b>Quick Tips:</b><br>
        • Right-click and drag to rotate the 3D view<br>
        • Use the mouse wheel to zoom in and out<br>
        • Create new panels from the Navigation sidebar<br>
        • Press F11 for fullscreen immersion
        </p>
        \"\"\"
        
        if self.content_label:
            self.content_label.setText(content)
        
        if self.action_button:
            self.action_button.setText("Enter EVA")
        
        if self.skip_button:
            self.skip_button.hide()
    
    def _handle_action_button(self) -> None:
        """Handle action button click based on current step."""
        if self.setup_step == 0:
            # Move to authentication step
            self.setup_step = 1
            self._update_step_content()
        elif self.setup_step == 1:
            # Start authentication process
            self.authentication_requested.emit()
            # For now, just advance to next step
            # In real implementation, this would wait for auth completion
            QTimer.singleShot(1000, self._authentication_completed)
        elif self.setup_step == 2:
            # Apply configuration and move to completion
            self._apply_configuration()
            self.setup_step = 3
            self._update_step_content()
        elif self.setup_step == 3:
            # Complete setup
            self._complete_setup()
    
    def _authentication_completed(self) -> None:
        """Handle successful authentication."""
        self.setup_step = 2
        self._update_step_content()
        self.logger.info("Authentication step completed")
    
    def _apply_configuration(self) -> None:
        """Apply the configuration settings."""
        # Configuration application would happen here
        self.logger.info("Configuration applied")
    
    def _complete_setup(self) -> None:
        """Complete the setup process."""
        self.setup_completed.emit()
        self.logger.info("Setup completed")
    
    def _skip_setup(self) -> None:
        """Skip the setup process."""
        self.setup_completed.emit()
        self.logger.info("Setup skipped")
    
    def _apply_holographic_styling(self) -> None:
        """Apply holographic styling to the welcome screen."""
        style = \"\"\"
        WelcomeScreen {
            background: qlineargradient(
                x1: 0, y1: 0, x2: 1, y2: 1,
                stop: 0 #000a0a,
                stop: 0.5 #001020,
                stop: 1 #000a0a
            );
        }
        
        QLabel {
            color: #00d4ff;
            background-color: transparent;
        }
        
        QFrame {
            background-color: rgba(0, 212, 255, 0.1);
            border: 1px solid #00d4ff;
            border-radius: 10px;
        }
        
        QPushButton {
            background-color: rgba(0, 100, 150, 0.3);
            border: 2px solid #00d4ff;
            border-radius: 8px;
            color: #00d4ff;
            font-weight: bold;
            padding: 10px 20px;
        }
        
        QPushButton:hover {
            background-color: rgba(0, 150, 200, 0.5);
            border: 2px solid #00ff80;
            color: #00ff80;
        }
        
        QPushButton:pressed {
            background-color: rgba(0, 212, 255, 0.7);
        }
        
        QPushButton[default="true"] {
            border: 3px solid #00d4ff;
            background-color: rgba(0, 150, 200, 0.4);
        }
        
        QProgressBar {
            border: 1px solid #00d4ff;
            border-radius: 5px;
            background-color: rgba(0, 50, 100, 0.3);
            text-align: center;
            color: #00d4ff;
            font-weight: bold;
        }
        
        QProgressBar::chunk {
            background-color: qlineargradient(
                x1: 0, y1: 0, x2: 1, y2: 0,
                stop: 0 #00d4ff,
                stop: 1 #00ff80
            );
            border-radius: 3px;
        }
        \"\"\"
        
        self.setStyleSheet(style)