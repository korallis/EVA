"""
EVA package main entry point.

Allows running EVA with `python -m eva`
"""

from .main import main

if __name__ == "__main__":
    exit(main())