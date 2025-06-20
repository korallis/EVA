"""
3D Scene Management

Manages 3D objects, transformations, and spatial hierarchy for the holographic interface.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import logging

try:
    import moderngl as mgl
    MODERNGL_AVAILABLE = True
except ImportError:
    MODERNGL_AVAILABLE = False
    mgl = None

from ..core.models import Vector3D


logger = logging.getLogger(__name__)


@dataclass
class SceneObject:
    """
    Represents a 3D object in the holographic scene.
    """
    # Rendering data
    vao: Any = None  # Vertex Array Object
    index_buffer: Any = None  # Index buffer for indexed rendering
    vertex_count: int = 0
    
    # Transform
    position: Vector3D = field(default_factory=Vector3D)
    rotation: Vector3D = field(default_factory=Vector3D)
    scale: Vector3D = field(default_factory=lambda: Vector3D(1.0, 1.0, 1.0))
    
    # Material properties
    material_params: Dict[str, Any] = field(default_factory=dict)
    
    # Visibility and interaction
    visible: bool = True
    selectable: bool = True
    interactive: bool = True
    
    # Metadata
    object_type: str = "generic"
    tags: List[str] = field(default_factory=list)
    user_data: Dict[str, Any] = field(default_factory=dict)


class SceneNode:
    """
    Hierarchical scene node for organizing objects.
    """
    
    def __init__(self, name: str, parent: Optional['SceneNode'] = None):
        """Initialize scene node."""
        self.name = name
        self.parent = parent
        self.children: List[SceneNode] = []
        self.objects: Dict[str, SceneObject] = {}
        
        # Local transform
        self.position = Vector3D()
        self.rotation = Vector3D()
        self.scale = Vector3D(1.0, 1.0, 1.0)
        
        # Visibility
        self.visible = True
        
        if parent:
            parent.add_child(self)
    
    def add_child(self, child: 'SceneNode') -> None:
        """Add a child node."""
        if child not in self.children:
            self.children.append(child)
            child.parent = self
    
    def remove_child(self, child: 'SceneNode') -> bool:
        """Remove a child node."""
        if child in self.children:
            self.children.remove(child)
            child.parent = None
            return True
        return False
    
    def add_object(self, object_id: str, obj: SceneObject) -> None:
        """Add an object to this node."""
        self.objects[object_id] = obj
    
    def remove_object(self, object_id: str) -> bool:
        """Remove an object from this node."""
        if object_id in self.objects:
            del self.objects[object_id]
            return True
        return False
    
    def get_object(self, object_id: str) -> Optional[SceneObject]:
        """Get an object by ID."""
        return self.objects.get(object_id)
    
    def get_all_objects(self, include_children: bool = True) -> List[SceneObject]:
        """Get all objects in this node and optionally children."""
        objects = list(self.objects.values())
        
        if include_children:
            for child in self.children:
                objects.extend(child.get_all_objects(include_children=True))
        
        return objects
    
    def set_visible(self, visible: bool, recursive: bool = False) -> None:
        """Set visibility of this node."""
        self.visible = visible
        
        if recursive:
            for child in self.children:
                child.set_visible(visible, recursive=True)


class Scene3D:
    """
    3D scene manager for the holographic interface.
    
    Manages hierarchical scene graph, object transforms,
    and spatial queries for the 3D holographic environment.
    """
    
    def __init__(self):
        """Initialize the 3D scene."""
        self.logger = logging.getLogger(__name__)
        
        # Scene graph
        self.root_node = SceneNode("root")
        self.nodes: Dict[str, SceneNode] = {"root": self.root_node}
        
        # Direct object access (for performance)
        self.objects: Dict[str, SceneObject] = {}
        
        # Scene properties
        self.ambient_color = (0.1, 0.1, 0.2, 1.0)  # Dim blue ambient
        self.background_color = (0.02, 0.02, 0.02, 1.0)  # Deep space
        
        # Spatial indexing (for performance)
        self._spatial_grid: Dict[tuple, List[str]] = {}
        self._grid_size = 10.0
        
        self.logger.debug("3D scene initialized")
    
    def create_node(self, name: str, parent_name: str = "root") -> Optional[SceneNode]:
        """
        Create a new scene node.
        
        Args:
            name: Name of the new node
            parent_name: Name of parent node
            
        Returns:
            Created scene node or None if failed
        """
        if name in self.nodes:
            self.logger.warning(f"Node '{name}' already exists")
            return self.nodes[name]
        
        parent = self.nodes.get(parent_name)
        if not parent:
            self.logger.error(f"Parent node '{parent_name}' not found")
            return None
        
        node = SceneNode(name, parent)
        self.nodes[name] = node
        
        self.logger.debug(f"Created scene node: {name}")
        return node
    
    def remove_node(self, name: str) -> bool:
        """
        Remove a scene node and all its children.
        
        Args:
            name: Name of node to remove
            
        Returns:
            True if node was removed
        """
        if name == "root":
            self.logger.error("Cannot remove root node")
            return False
        
        node = self.nodes.get(name)
        if not node:
            return False
        
        # Remove all objects in this node and children
        all_objects = node.get_all_objects(include_children=True)
        for obj in all_objects:
            # Find and remove object ID
            for obj_id, scene_obj in list(self.objects.items()):
                if scene_obj is obj:
                    del self.objects[obj_id]
                    break
        
        # Remove from parent
        if node.parent:
            node.parent.remove_child(node)
        
        # Remove node and all children from nodes dict
        self._remove_node_recursive(node)
        
        self.logger.debug(f"Removed scene node: {name}")
        return True
    
    def _remove_node_recursive(self, node: SceneNode) -> None:
        """Recursively remove node and children from nodes dict."""
        for child in node.children[:]:  # Copy list to avoid modification during iteration
            self._remove_node_recursive(child)
        
        if node.name in self.nodes:
            del self.nodes[node.name]
    
    def add_object(self, object_id: str, obj: SceneObject, node_name: str = "root") -> bool:
        """
        Add an object to the scene.
        
        Args:
            object_id: Unique identifier for the object
            obj: Scene object to add
            node_name: Name of scene node to add to
            
        Returns:
            True if object was added successfully
        """
        if object_id in self.objects:
            self.logger.warning(f"Object '{object_id}' already exists, replacing")
        
        node = self.nodes.get(node_name)
        if not node:
            self.logger.error(f"Scene node '{node_name}' not found")
            return False
        
        # Add to node and global object dict
        node.add_object(object_id, obj)
        self.objects[object_id] = obj
        
        # Update spatial index
        self._update_spatial_index(object_id, obj)
        
        self.logger.debug(f"Added object '{object_id}' to node '{node_name}'")
        return True
    
    def remove_object(self, object_id: str) -> bool:
        """
        Remove an object from the scene.
        
        Args:
            object_id: ID of object to remove
            
        Returns:
            True if object was removed
        """
        if object_id not in self.objects:
            return False
        
        obj = self.objects[object_id]
        
        # Remove from spatial index
        self._remove_from_spatial_index(object_id, obj)
        
        # Find and remove from node
        for node in self.nodes.values():
            if node.remove_object(object_id):
                break
        
        # Remove from global dict
        del self.objects[object_id]
        
        # Cleanup OpenGL resources
        if hasattr(obj.vao, 'release'):
            try:
                obj.vao.release()
            except:
                pass  # Ignore cleanup errors
        
        self.logger.debug(f"Removed object: {object_id}")
        return True
    
    def get_object(self, object_id: str) -> Optional[SceneObject]:
        """Get an object by ID."""
        return self.objects.get(object_id)
    
    def get_objects(self, object_type: Optional[str] = None, 
                   node_name: Optional[str] = None,
                   visible_only: bool = True) -> List[SceneObject]:
        """
        Get objects with optional filtering.
        
        Args:
            object_type: Filter by object type
            node_name: Filter by scene node
            visible_only: Only return visible objects
            
        Returns:
            List of matching objects
        """
        if node_name:
            # Get objects from specific node
            node = self.nodes.get(node_name)
            if not node:
                return []
            objects = node.get_all_objects(include_children=False)
        else:
            # Get all objects
            objects = list(self.objects.values())
        
        # Apply filters
        filtered_objects = []
        for obj in objects:
            # Visibility filter
            if visible_only and not obj.visible:
                continue
            
            # Type filter
            if object_type and obj.object_type != object_type:
                continue
            
            filtered_objects.append(obj)
        
        return filtered_objects
    
    def update_object_transform(self, object_id: str, 
                              position: Optional[Vector3D] = None,
                              rotation: Optional[Vector3D] = None,
                              scale: Optional[Vector3D] = None) -> bool:
        """
        Update an object's transform.
        
        Args:
            object_id: ID of object to update
            position: New position (optional)
            rotation: New rotation (optional)
            scale: New scale (optional)
            
        Returns:
            True if object was updated
        """
        obj = self.objects.get(object_id)
        if not obj:
            return False
        
        # Remove from old spatial position
        self._remove_from_spatial_index(object_id, obj)
        
        # Update transform
        if position:
            obj.position = position
        if rotation:
            obj.rotation = rotation
        if scale:
            obj.scale = scale
        
        # Update spatial index with new position
        self._update_spatial_index(object_id, obj)
        
        return True
    
    def find_objects_near(self, position: Vector3D, radius: float) -> List[str]:
        """
        Find objects within a radius of a position.
        
        Args:
            position: Center position
            radius: Search radius
            
        Returns:
            List of object IDs within radius
        """
        nearby_objects = []
        radius_squared = radius * radius
        
        for object_id, obj in self.objects.items():
            # Calculate distance squared (avoid sqrt for performance)
            dx = obj.position.x - position.x
            dy = obj.position.y - position.y
            dz = obj.position.z - position.z
            distance_squared = dx*dx + dy*dy + dz*dz
            
            if distance_squared <= radius_squared:
                nearby_objects.append(object_id)
        
        return nearby_objects
    
    def raycast(self, ray_origin: Vector3D, ray_direction: Vector3D, 
                max_distance: float = 1000.0) -> Optional[str]:
        """
        Perform raycast to find the first object hit.
        
        Args:
            ray_origin: Ray starting point
            ray_direction: Ray direction (normalized)
            max_distance: Maximum ray distance
            
        Returns:
            ID of first object hit, or None
        """
        # This is a simplified raycast - in practice you'd use proper
        # geometric intersection tests based on object geometry
        
        closest_object = None
        closest_distance = max_distance
        
        for object_id, obj in self.objects.items():
            if not obj.selectable:
                continue
            
            # Simple sphere intersection test
            # In practice, you'd use the actual object geometry
            sphere_radius = 1.0  # Default object radius
            
            # Vector from ray origin to object center
            to_object = Vector3D(
                obj.position.x - ray_origin.x,
                obj.position.y - ray_origin.y,
                obj.position.z - ray_origin.z
            )
            
            # Project onto ray direction
            projection_length = (
                to_object.x * ray_direction.x +
                to_object.y * ray_direction.y +
                to_object.z * ray_direction.z
            )
            
            if projection_length < 0:
                continue  # Object is behind ray origin
            
            # Find closest point on ray to object center
            closest_point = Vector3D(
                ray_origin.x + ray_direction.x * projection_length,
                ray_origin.y + ray_direction.y * projection_length,
                ray_origin.z + ray_direction.z * projection_length
            )
            
            # Distance from object center to closest point on ray
            dx = obj.position.x - closest_point.x
            dy = obj.position.y - closest_point.y
            dz = obj.position.z - closest_point.z
            distance_to_ray = (dx*dx + dy*dy + dz*dz) ** 0.5
            
            # Check if ray intersects object
            if distance_to_ray <= sphere_radius and projection_length < closest_distance:
                closest_object = object_id
                closest_distance = projection_length
        
        return closest_object
    
    def _update_spatial_index(self, object_id: str, obj: SceneObject) -> None:
        """Update spatial grid index for an object."""
        # Calculate grid cell
        grid_x = int(obj.position.x // self._grid_size)
        grid_y = int(obj.position.y // self._grid_size)
        grid_z = int(obj.position.z // self._grid_size)
        grid_key = (grid_x, grid_y, grid_z)
        
        # Add to grid cell
        if grid_key not in self._spatial_grid:
            self._spatial_grid[grid_key] = []
        
        if object_id not in self._spatial_grid[grid_key]:
            self._spatial_grid[grid_key].append(object_id)
    
    def _remove_from_spatial_index(self, object_id: str, obj: SceneObject) -> None:
        """Remove object from spatial grid index."""
        # Calculate old grid cell
        grid_x = int(obj.position.x // self._grid_size)
        grid_y = int(obj.position.y // self._grid_size)
        grid_z = int(obj.position.z // self._grid_size)
        grid_key = (grid_x, grid_y, grid_z)
        
        # Remove from grid cell
        if grid_key in self._spatial_grid:
            if object_id in self._spatial_grid[grid_key]:
                self._spatial_grid[grid_key].remove(object_id)
            
            # Clean up empty cells
            if not self._spatial_grid[grid_key]:
                del self._spatial_grid[grid_key]
    
    def set_ambient_color(self, r: float, g: float, b: float, a: float = 1.0) -> None:
        """Set scene ambient lighting color."""
        self.ambient_color = (r, g, b, a)
    
    def set_background_color(self, r: float, g: float, b: float, a: float = 1.0) -> None:
        """Set scene background color."""
        self.background_color = (r, g, b, a)
    
    def clear(self) -> None:
        """Clear all objects from the scene."""
        # Cleanup OpenGL resources
        for obj in self.objects.values():
            if hasattr(obj.vao, 'release'):
                try:
                    obj.vao.release()
                except:
                    pass
        
        # Clear all data structures
        self.objects.clear()
        self._spatial_grid.clear()
        
        # Reset root node
        self.root_node = SceneNode("root")
        self.nodes = {"root": self.root_node}
        
        self.logger.debug("Scene cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scene statistics."""
        return {
            "total_objects": len(self.objects),
            "total_nodes": len(self.nodes),
            "visible_objects": len([obj for obj in self.objects.values() if obj.visible]),
            "interactive_objects": len([obj for obj in self.objects.values() if obj.interactive]),
            "spatial_grid_cells": len(self._spatial_grid)
        }