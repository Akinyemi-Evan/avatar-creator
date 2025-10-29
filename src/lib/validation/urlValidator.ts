import { VALIDATION_CONFIG } from '@/lib/constants/avatar3d';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a URL for security and format requirements
 */
export function validateImageUrl(urlString: string): UrlValidationResult {
  // Check if URL is provided
  if (!urlString || urlString.trim() === '') {
    return {
      isValid: false,
      error: 'URL cannot be empty',
    };
  }

  let url: URL;
  
  // Parse URL
  try {
    url = new URL(urlString);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Check protocol
  const allowedProtocols = VALIDATION_CONFIG.allowedProtocols as readonly string[];
  if (!allowedProtocols.includes(url.protocol)) {
    return {
      isValid: false,
      error: `Only ${VALIDATION_CONFIG.allowedProtocols.join(' and ')} protocols are allowed`,
    };
  }

  // Check file extension
  const pathname = url.pathname.toLowerCase();
  const hasValidExtension = VALIDATION_CONFIG.allowedImageExtensions.some(
    ext => pathname.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid image format. Supported: ${VALIDATION_CONFIG.allowedImageExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Loads an image with timeout and CORS handling
 */
export async function loadImageWithTimeout(
  url: string,
  timeoutMs: number = 10000
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image. Check CORS settings or URL accessibility.'));
    };

    img.src = url;
  });
}
