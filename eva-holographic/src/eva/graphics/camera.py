"""
3D Camera System

Provides perspective projection and view transformation for the holographic interface.
"""

import numpy as np
import math
from typing import Tuple

from ..core.models import Vector3D


class Camera3D:
    """
    3D camera for holographic scene rendering.
    
    Provides perspective projection and smooth camera controls
    for navigating the 3D holographic interface.
    """
    
    def __init__(self):
        """Initialize the 3D camera."""
        # Camera position and orientation
        self.position = Vector3D(0.0, 0.0, 5.0)
        self.target = Vector3D(0.0, 0.0, 0.0)
        self.up = Vector3D(0.0, 1.0, 0.0)
        
        # Projection parameters
        self.fov = 45.0  # Field of view in degrees
        self.aspect_ratio = 16.0 / 9.0
        self.near_plane = 0.1
        self.far_plane = 1000.0
        
        # Camera orientation (Euler angles)
        self.yaw = 0.0    # Rotation around Y axis
        self.pitch = 0.0  # Rotation around X axis
        self.roll = 0.0   # Rotation around Z axis
        
        # Movement sensitivity
        self.move_speed = 1.0
        self.rotation_speed = 0.5
        self.zoom_speed = 0.1
        
        # Cache matrices
        self._view_matrix_cache: np.ndarray = None
        self._projection_matrix_cache: np.ndarray = None
        self._view_dirty = True
        self._projection_dirty = True
    
    def set_position(self, x: float, y: float, z: float) -> None:
        """Set camera position."""
        self.position = Vector3D(x, y, z)
        self._view_dirty = True
    
    def set_target(self, x: float, y: float, z: float) -> None:
        """Set camera target (look-at point)."""
        self.target = Vector3D(x, y, z)
        self._view_dirty = True
    
    def set_perspective(self, fov: float, aspect: float, near: float, far: float) -> None:
        """Set perspective projection parameters."""
        self.fov = fov
        self.aspect_ratio = aspect
        self.near_plane = near
        self.far_plane = far
        self._projection_dirty = True
    
    def set_aspect_ratio(self, aspect: float) -> None:
        """Set aspect ratio and update projection."""
        self.aspect_ratio = aspect
        self._projection_dirty = True
    
    def move_forward(self, distance: float) -> None:
        """Move camera forward along look direction."""
        forward = self._get_forward_vector()
        self.position.x += forward.x * distance * self.move_speed
        self.position.y += forward.y * distance * self.move_speed
        self.position.z += forward.z * distance * self.move_speed
        self._view_dirty = True
    
    def move_right(self, distance: float) -> None:
        """Move camera right."""
        right = self._get_right_vector()
        self.position.x += right.x * distance * self.move_speed
        self.position.y += right.y * distance * self.move_speed
        self.position.z += right.z * distance * self.move_speed
        self._view_dirty = True
    
    def move_up(self, distance: float) -> None:
        """Move camera up."""
        self.position.y += distance * self.move_speed
        self._view_dirty = True
    
    def rotate(self, delta_yaw: float, delta_pitch: float) -> None:
        """Rotate camera by delta angles."""
        self.yaw += delta_yaw * self.rotation_speed
        self.pitch += delta_pitch * self.rotation_speed
        
        # Clamp pitch to avoid gimbal lock
        self.pitch = max(-89.0, min(89.0, self.pitch))
        
        # Wrap yaw
        self.yaw = self.yaw % 360.0
        
        self._update_target_from_angles()
        self._view_dirty = True
    
    def zoom(self, factor: float) -> None:
        """Zoom camera (adjust distance to target)."""
        # Calculate direction from target to position
        direction = Vector3D(
            self.position.x - self.target.x,
            self.position.y - self.target.y,
            self.position.z - self.target.z
        )
        
        # Normalize and scale
        length = math.sqrt(direction.x**2 + direction.y**2 + direction.z**2)
        if length > 0.1:  # Avoid getting too close
            new_length = max(0.1, length * factor)
            scale = new_length / length
            
            self.position.x = self.target.x + direction.x * scale
            self.position.y = self.target.y + direction.y * scale
            self.position.z = self.target.z + direction.z * scale
            
            self._view_dirty = True
    
    def orbit_around_target(self, delta_yaw: float, delta_pitch: float) -> None:
        """Orbit camera around the target point."""
        # Convert to spherical coordinates
        dx = self.position.x - self.target.x
        dy = self.position.y - self.target.y
        dz = self.position.z - self.target.z
        
        radius = math.sqrt(dx*dx + dy*dy + dz*dz)
        theta = math.atan2(dz, dx)  # Azimuth
        phi = math.acos(dy / radius) if radius > 0 else 0  # Inclination
        
        # Apply rotation
        theta += math.radians(delta_yaw * self.rotation_speed)
        phi += math.radians(delta_pitch * self.rotation_speed)
        
        # Clamp phi to avoid flipping
        phi = max(0.1, min(math.pi - 0.1, phi))
        
        # Convert back to Cartesian
        self.position.x = self.target.x + radius * math.sin(phi) * math.cos(theta)
        self.position.y = self.target.y + radius * math.cos(phi)
        self.position.z = self.target.z + radius * math.sin(phi) * math.sin(theta)
        
        self._view_dirty = True
    
    def look_at(self, target_x: float, target_y: float, target_z: float) -> None:
        """Point camera at specific coordinates."""
        self.target = Vector3D(target_x, target_y, target_z)
        self._view_dirty = True
    
    def _get_forward_vector(self) -> Vector3D:
        """Get the forward direction vector."""
        direction = Vector3D(
            self.target.x - self.position.x,
            self.target.y - self.position.y,
            self.target.z - self.position.z
        )
        
        # Normalize
        length = math.sqrt(direction.x**2 + direction.y**2 + direction.z**2)
        if length > 0:
            direction.x /= length
            direction.y /= length
            direction.z /= length
        
        return direction
    
    def _get_right_vector(self) -> Vector3D:
        """Get the right direction vector."""
        forward = self._get_forward_vector()
        
        # Cross product: forward × up
        right = Vector3D(
            forward.y * self.up.z - forward.z * self.up.y,
            forward.z * self.up.x - forward.x * self.up.z,
            forward.x * self.up.y - forward.y * self.up.x
        )
        
        # Normalize
        length = math.sqrt(right.x**2 + right.y**2 + right.z**2)
        if length > 0:
            right.x /= length
            right.y /= length
            right.z /= length
        
        return right
    
    def _update_target_from_angles(self) -> None:
        """Update target position from yaw/pitch angles."""
        # Convert angles to radians
        yaw_rad = math.radians(self.yaw)
        pitch_rad = math.radians(self.pitch)
        
        # Calculate forward direction
        forward_x = math.cos(pitch_rad) * math.cos(yaw_rad)
        forward_y = math.sin(pitch_rad)
        forward_z = math.cos(pitch_rad) * math.sin(yaw_rad)
        
        # Set target relative to position
        self.target.x = self.position.x + forward_x
        self.target.y = self.position.y + forward_y
        self.target.z = self.position.z + forward_z
    
    def get_view_matrix(self) -> np.ndarray:
        """Get the view transformation matrix."""
        if self._view_dirty or self._view_matrix_cache is None:
            self._view_matrix_cache = self._calculate_view_matrix()
            self._view_dirty = False
        
        return self._view_matrix_cache
    
    def _calculate_view_matrix(self) -> np.ndarray:
        """Calculate the view matrix using look-at transformation."""
        # Forward vector (from position to target)
        forward = np.array([
            self.target.x - self.position.x,
            self.target.y - self.position.y,
            self.target.z - self.position.z
        ], dtype=np.float32)
        forward = forward / np.linalg.norm(forward)
        
        # Right vector (forward × up)
        up = np.array([self.up.x, self.up.y, self.up.z], dtype=np.float32)
        right = np.cross(forward, up)
        right = right / np.linalg.norm(right)
        
        # Recalculate up vector (right × forward)
        up = np.cross(right, forward)
        
        # Create rotation matrix
        rotation = np.array([
            [right[0], up[0], -forward[0], 0],
            [right[1], up[1], -forward[1], 0],
            [right[2], up[2], -forward[2], 0],
            [0, 0, 0, 1]
        ], dtype=np.float32)
        
        # Create translation matrix
        translation = np.array([
            [1, 0, 0, -self.position.x],
            [0, 1, 0, -self.position.y],
            [0, 0, 1, -self.position.z],
            [0, 0, 0, 1]
        ], dtype=np.float32)
        
        # Combine: view = rotation * translation
        return rotation @ translation
    
    def get_projection_matrix(self) -> np.ndarray:
        """Get the perspective projection matrix."""
        if self._projection_dirty or self._projection_matrix_cache is None:
            self._projection_matrix_cache = self._calculate_projection_matrix()
            self._projection_dirty = False
        
        return self._projection_matrix_cache
    
    def _calculate_projection_matrix(self) -> np.ndarray:
        """Calculate the perspective projection matrix."""
        fov_rad = math.radians(self.fov)
        f = 1.0 / math.tan(fov_rad / 2.0)
        
        return np.array([
            [f / self.aspect_ratio, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (self.far_plane + self.near_plane) / (self.near_plane - self.far_plane),
             (2 * self.far_plane * self.near_plane) / (self.near_plane - self.far_plane)],
            [0, 0, -1, 0]
        ], dtype=np.float32)
    
    def screen_to_world_ray(self, screen_x: float, screen_y: float, 
                           screen_width: int, screen_height: int) -> Tuple[Vector3D, Vector3D]:
        """
        Convert screen coordinates to a world-space ray.
        
        Args:
            screen_x, screen_y: Screen coordinates (pixels)
            screen_width, screen_height: Screen dimensions
            
        Returns:
            Tuple of (ray_origin, ray_direction)
        """
        # Convert screen coordinates to normalized device coordinates (-1 to 1)
        ndc_x = (2.0 * screen_x) / screen_width - 1.0
        ndc_y = 1.0 - (2.0 * screen_y) / screen_height
        
        # Convert to view space
        view_matrix = self.get_view_matrix()
        proj_matrix = self.get_projection_matrix()
        
        # Inverse projection
        inv_proj = np.linalg.inv(proj_matrix)
        view_coords = inv_proj @ np.array([ndc_x, ndc_y, -1.0, 1.0])
        view_coords = view_coords / view_coords[3]  # Perspective divide
        
        # Inverse view transform to get world coordinates
        inv_view = np.linalg.inv(view_matrix)
        world_coords = inv_view @ np.array([view_coords[0], view_coords[1], view_coords[2], 1.0])
        
        # Ray origin is camera position
        ray_origin = self.position
        
        # Ray direction from camera to world point
        ray_direction = Vector3D(
            world_coords[0] - self.position.x,
            world_coords[1] - self.position.y,
            world_coords[2] - self.position.z
        )
        
        # Normalize ray direction
        length = math.sqrt(ray_direction.x**2 + ray_direction.y**2 + ray_direction.z**2)
        if length > 0:
            ray_direction.x /= length
            ray_direction.y /= length
            ray_direction.z /= length
        
        return ray_origin, ray_direction
    
    def get_distance_to_target(self) -> float:
        """Get distance from camera to target."""
        dx = self.position.x - self.target.x
        dy = self.position.y - self.target.y
        dz = self.position.z - self.target.z
        return math.sqrt(dx*dx + dy*dy + dz*dz)
    
    def reset_to_default(self) -> None:
        """Reset camera to default position and orientation."""
        self.position = Vector3D(0.0, 0.0, 5.0)
        self.target = Vector3D(0.0, 0.0, 0.0)
        self.up = Vector3D(0.0, 1.0, 0.0)
        self.yaw = 0.0
        self.pitch = 0.0
        self.roll = 0.0
        self._view_dirty = True