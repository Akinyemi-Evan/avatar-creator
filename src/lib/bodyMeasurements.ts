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

      // Calculate measurements based on proportions
      // These are estimates based on typical human proportions
      const heightFactor = personHeight / canvas.height;
      const widthFactor = personWidth / canvas.width;

      const measurements: BodyMeasurements = {
        height: 0.9 + heightFactor * 0.3, // 0.9 - 1.2
        shoulderWidth: 0.9 + widthFactor * 0.3, // 0.9 - 1.2
        torsoLength: 0.95 + (aspectRatio > 1 ? 0.1 : 0), // Adjust for portrait vs landscape
        armLength: 1.0, // Default
        legLength: 0.95 + heightFactor * 0.15, // Based on height
      };

      resolve(measurements);
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
