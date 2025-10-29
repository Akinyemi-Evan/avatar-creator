// 3D Avatar Configuration Constants

// Camera settings
export const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5] as [number, number, number],
} as const;

// Avatar scaling and positioning
export const AVATAR_CONFIG = {
  face: {
    scale: 0.15,
    position: [0, 0.6, 0] as [number, number, number],
  },
  body: {
    scale: 1.5,
    position: [0, -1, 0] as [number, number, number],
  },
  legacy: {
    scale: 2,
    position: [0, -0.5, 0] as [number, number, number],
  },
} as const;

// Animation settings
export const ANIMATION_CONFIG = {
  idleRotation: {
    speed: 0.001,
    amplitude: 0.02,
  },
} as const;

// Lighting
export const LIGHTING_CONFIG = {
  ambient: {
    intensity: 0.5,
  },
  directional: {
    intensity: 1,
    position: [5, 5, 5] as [number, number, number],
  },
} as const;

// Request timeouts (in milliseconds)
export const TIMEOUT_CONFIG = {
  replicateApiCall: 60000, // 60 seconds
  textureLoading: 10000,   // 10 seconds
  meshLoading: 30000,      // 30 seconds
} as const;

// Validation limits
export const VALIDATION_CONFIG = {
  maxImageSize: 10 * 1024 * 1024, // 10MB in bytes
  allowedProtocols: ['http:', 'https:'],
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
} as const;
