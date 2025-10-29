import { VALIDATION_CONFIG } from '@/lib/constants/avatar3d';

export interface Base64ValidationResult {
  isValid: boolean;
  error?: string;
  sizeInBytes?: number;
}

/**
 * Validates a base64 encoded image string
 */
export function validateBase64Image(base64String: string): Base64ValidationResult {
  // Check if string is provided
  if (!base64String || base64String.trim() === '') {
    return {
      isValid: false,
      error: 'Base64 string cannot be empty',
    };
  }

  // Check format: data:image/[type];base64,[data]
  const base64Regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
  if (!base64Regex.test(base64String)) {
    return {
      isValid: false,
      error: 'Invalid base64 image format. Must be data:image/[type];base64,[data]',
    };
  }

  // Extract base64 data (after the comma)
  const base64Data = base64String.split(',')[1];
  if (!base64Data) {
    return {
      isValid: false,
      error: 'Missing base64 data after header',
    };
  }

  // Validate base64 characters
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(base64Data)) {
    return {
      isValid: false,
      error: 'Invalid base64 characters detected',
    };
  }

  // Calculate size (base64 encoding increases size by ~33%)
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  if (sizeInBytes > VALIDATION_CONFIG.maxImageSize) {
    return {
      isValid: false,
      error: `Image size exceeds maximum allowed size of ${VALIDATION_CONFIG.maxImageSize / (1024 * 1024)}MB`,
      sizeInBytes,
    };
  }

  return {
    isValid: true,
    sizeInBytes,
  };
}

/**
 * Sanitizes base64 string by removing any potential XSS vectors
 */
export function sanitizeBase64(base64String: string): string {
  // Remove any script tags or event handlers that might be embedded
  return base64String.replace(/<script[^>]*>.*?<\/script>/gi, '')
                      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
