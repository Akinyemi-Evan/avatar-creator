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
  minImageDimension: 512, // Minimum width/height in pixels
  maxImageDimension: 4096, // Maximum width/height in pixels
  allowedProtocols: ['http:', 'https:'],
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Storage bucket names
export const STORAGE_CONFIG = {
  avatarsBucket: 'avatars',
  avatarImagesBucket: 'avatar-images',
} as const;

// Processing stages for progress tracking
export const PROCESSING_STAGES = {
  validating: 'Validating your image...',
  removingBackground: 'Removing background (30-45s)...',
  extractingMeasurements: 'Analyzing body proportions...',
  generating3DFace: 'Creating 3D face model (20s)...',
  generating3DBody: 'Building 3D body mesh (40-60s)...',
  savingAvatar: 'Saving your avatar...',
} as const;

export type ProcessingStage = keyof typeof PROCESSING_STAGES | null;
