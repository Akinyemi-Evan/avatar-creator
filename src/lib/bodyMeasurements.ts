// Extract body measurements from an image
export interface BodyMeasurements {
  height: number; // relative height (0.8 - 1.2)
  shoulderWidth: number; // relative shoulder width (0.8 - 1.2)
  torsoLength: number; // relative torso length (0.8 - 1.2)
  armLength: number; // relative arm length (0.8 - 1.2)
  legLength: number; // relative leg length (0.8 - 1.2)
}

export const extractBodyMeasurements = async (
  imageUrl: string
): Promise<BodyMeasurements> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(getDefaultMeasurements());
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Find the bounding box of the person (non-transparent pixels)
      let minY = canvas.height;
      let maxY = 0;
      let minX = canvas.width;
      let maxX = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 50) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
          }
        }
      }

      const personHeight = maxY - minY;
      const personWidth = maxX - minX;
      const aspectRatio = canvas.height / canvas.width;

      // Enhanced measurements based on typical human proportions
      // Human body is typically 7.5-8 heads tall
      const heightFactor = personHeight / canvas.height;
      const widthFactor = personWidth / canvas.width;

      // Analyze thirds for better body proportion estimation
      const upperThird = Math.floor(personHeight / 3);
      const middleThird = Math.floor(personHeight / 3);
      
      // Count pixels in upper third (head + shoulders)
      let upperThirdPixels = 0;
      for (let y = minY; y < minY + upperThird; y++) {
        for (let x = minX; x < maxX; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 50) upperThirdPixels++;
        }
      }
      
      // Count pixels in middle third (torso + arms)
      let middleThirdPixels = 0;
      for (let y = minY + upperThird; y < minY + upperThird + middleThird; y++) {
        for (let x = minX; x < maxX; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 50) middleThirdPixels++;
        }
      }

      // Estimate shoulder width from upper third
      const shoulderWidthFactor = (upperThirdPixels / (upperThird * personWidth)) * widthFactor;
      
      // Estimate torso from middle third density
      const torsoFactor = (middleThirdPixels / (middleThird * personWidth)) * heightFactor;

      const measurements: BodyMeasurements = {
        height: 0.85 + heightFactor * 0.35, // 0.85 - 1.2 range
        shoulderWidth: 0.85 + shoulderWidthFactor * 0.4, // 0.85 - 1.25 range
        torsoLength: 0.9 + torsoFactor * 0.25 + (aspectRatio > 1 ? 0.05 : 0),
        armLength: 0.95 + heightFactor * 0.15, // Arms scale with height
        legLength: 0.9 + heightFactor * 0.25, // Legs are longer portion of body
      };

      // Clamp values to reasonable ranges
      resolve({
        height: Math.max(0.8, Math.min(1.2, measurements.height)),
        shoulderWidth: Math.max(0.8, Math.min(1.2, measurements.shoulderWidth)),
        torsoLength: Math.max(0.8, Math.min(1.2, measurements.torsoLength)),
        armLength: Math.max(0.8, Math.min(1.2, measurements.armLength)),
        legLength: Math.max(0.8, Math.min(1.2, measurements.legLength)),
      });
    };

    img.onerror = () => resolve(getDefaultMeasurements());
    img.src = imageUrl;
  });
};

const getDefaultMeasurements = (): BodyMeasurements => ({
  height: 1.0,
  shoulderWidth: 1.0,
  torsoLength: 1.0,
  armLength: 1.0,
  legLength: 1.0,
});
