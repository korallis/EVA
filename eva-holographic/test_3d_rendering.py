#!/usr/bin/env python3
"""
Test script for 3D holographic rendering.

Quick test to verify that the 3D rendering system works correctly
and can display holographic panels in 3D space.
"""

import sys
import os
import logging
from pathlib import Path

# Add the src directory to the Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import QTimer

from eva.core.config import EVAConfig
from eva.ui.main_window import HolographicMainWindow


def setup_logging():
    """Setup logging for the test."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def main():
    """Main test function."""
    setup_logging()
    logger = logging.getLogger(__name__)
    
    # Create Qt application
    app = QApplication(sys.argv)
    app.setApplicationName("EVA Holographic 3D Test")
    app.setApplicationVersion("0.1.0")
    
    try:
        # Load configuration
        config = EVAConfig()
        
        # Create main window
        logger.info("Creating holographic main window...")
        window = HolographicMainWindow(config)
        
        # Show the window
        window.show()
        
        # Log startup completion
        logger.info("3D Holographic test application started successfully!")
        logger.info("You should see floating 3D holographic panels in the viewport")
        logger.info("Use right mouse button to rotate the camera")
        logger.info("Use middle mouse button to pan")
        logger.info("Use mouse wheel to zoom")
        
        # Setup graceful shutdown
        def shutdown():
            logger.info("Shutting down...")
            QTimer.singleShot(100, app.quit)
        
        app.aboutToQuit.connect(shutdown)
        
        # Run the application
        exit_code = app.exec()
        logger.info(f"Application exited with code: {exit_code}")
        return exit_code
        
    except Exception as e:
        logger.error(f"Failed to start 3D holographic test: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())