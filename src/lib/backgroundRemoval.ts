import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  
  return { width, height };
}

export const removeBackground = async (
  imageElement: HTMLImageElement,
  onProgress?: (status: string) => void
): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> => {
  try {
    onProgress?.('Loading AI model...');
    
    // Load model and processor
    const model = await AutoModel.from_pretrained('Xenova/modnet', {
      device: 'webgpu',
      dtype: 'fp32'
    });
    
    const processor = await AutoProcessor.from_pretrained('Xenova/modnet');
    
    onProgress?.('Processing image...');
    
    // Convert HTMLImageElement to RawImage
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
    
    // Create RawImage from canvas
    const imageData = ctx.getImageData(0, 0, width, height);
    const rawImage = new RawImage(new Uint8Array(imageData.data.buffer), width, height, 4);
    
    // Pre-process image
    onProgress?.('Detecting person...');
    const { pixel_values } = await processor(rawImage);
    
    // Predict alpha matte
    onProgress?.('Removing background...');
    const { output } = await model({ input: pixel_values });
    
    // Create mask from output
    const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(width, height);
    
    // Create output canvas with transparency
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply mask as alpha channel
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    const outputData = outputImageData.data;
    const maskData = mask.data;
    
    for (let i = 0; i < maskData.length; i++) {
      outputData[i * 4 + 3] = maskData[i]; // Set alpha channel
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    // Convert to blob
    onProgress?.('Finalizing...');
    const blob = await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
    
    return { blob, canvas: outputCanvas };
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
