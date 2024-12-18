import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import { Vector3 } from 'three';

interface CameraControllerProps {
  selectedLayer: number | null;
  distance?: number;
  sidebarExpanded?: boolean;
  gridSize?: number;
}

export const CameraController = ({
  selectedLayer, 
  distance = 135,
  sidebarExpanded = false,
  gridSize = 25
}: CameraControllerProps) => {
  const { camera, size } = useThree();
  const lastY = useRef(camera.position.y);
  const targetY = useRef(camera.position.y);
  const keysPressed = useRef<Set<string>>(new Set());
  const moveSpeed = 1;
  const currentOffsetX = useRef(0);
  const currentOffsetY = useRef(0);

  // Store original viewport dimensions
  useEffect(() => {
    camera.clearViewOffset();
    if (size.width && size.height) {
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        0,
        size.width,
        size.height
      );
    }
  }, [camera, size]);

  // Layer height spring for camera rotation
  useSpring({
    to: {
      y: selectedLayer === null 
        ? targetY.current 
        : selectedLayer + distance + ((selectedLayer - gridSize/8)),
    },
    onChange: ({ value: { y } }) => {
      const delta = y - lastY.current;
      camera.position.y += delta;
      lastY.current = y;
      targetY.current = y;
    },
    config: { tension: 170, friction: 26 }
  });

  // Helper function to apply both offsets
  const updateViewOffset = () => {
    if (size.width && size.height) {
      camera.setViewOffset(
        size.width,
        size.height,
        -currentOffsetX.current,
        -currentOffsetY.current,
        size.width,
        size.height
      );
    }
  };

  // Horizontal view offset spring for sidebar
  useSpring({
    to: {
      offsetX: sidebarExpanded ? 150 : 0,
    },
    from: {
      offsetX: currentOffsetX.current,
    },
    onChange: ({ value: { offsetX } }) => {
      currentOffsetX.current = offsetX;
      updateViewOffset();
    },
    config: { tension: 180, friction: 26 }
  });

  // Vertical view offset spring for layer selection
  useSpring({
    to: {
      offsetY: selectedLayer === null ? 0 : (selectedLayer - gridSize/4) * 1.2,
    },
    from: {
      offsetY: currentOffsetY.current,
    },
    onChange: ({ value: { offsetY } }) => {
      currentOffsetY.current = offsetY;
      updateViewOffset();
    },
    config: { tension: 130, friction: 14 }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    const moveCamera = () => {
      const keys = keysPressed.current;
      const forward = new Vector3(0, 0, -1);
      const right = new Vector3(1, 0, 0);
      
      // Rotate vectors based on camera rotation
      forward.applyQuaternion(camera.quaternion);
      right.applyQuaternion(camera.quaternion);
      
      // Zero out Y component to keep movement horizontal
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      if (keys.size > 0) {
        requestAnimationFrame(moveCamera);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        keysPressed.current.clear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      keysPressed.current.clear();
    };
  }, [camera]);

  return null;
}; 