import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set to true to use mock mode (for development when Replicate models aren't deployed)
const USE_MOCK_MODE = false;

// Retry helper with exponential backoff
async function replicateWithRetry(
  replicate: Replicate,
  model: string,
  input: any,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for model: ${model}`);
      return await replicate.run(model, { input });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Attempt ${attempt} failed:`, errorMessage);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

  try {
    const { personImageBase64 } = await req.json();
    
    if (isDev) console.log('Received avatar generation request');
    
    // Validate presence
    if (!personImageBase64) {
      throw new Error('Missing personImageBase64 in request body');
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
    if (!base64Regex.test(personImageBase64)) {
      throw new Error('Invalid base64 image format. Must be data:image/[type];base64,[data]');
    }

    // Validate base64 data exists
    const base64Data = personImageBase64.split(',')[1];
    if (!base64Data) {
      throw new Error('Missing base64 data after header');
    }

    // Validate base64 characters
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      throw new Error('Invalid base64 characters detected');
    }

    // Check size (max 10MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      throw new Error(`Image size exceeds maximum allowed size of 10MB`);
    }

    if (isDev) console.log(`Image validated: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);

    // MOCK MODE: Return placeholder URLs without calling Replicate API
    if (USE_MOCK_MODE) {
      console.log('🔧 MOCK MODE: Returning placeholder 3D model URLs');
      console.log('⚠️  To use real 3D generation:');
      console.log('   1. Deploy the Replicate models using Cog (see replicate-models/DEPLOYMENT_INSTRUCTIONS.md)');
      console.log('   2. Update the model paths in this file');
      console.log('   3. Set USE_MOCK_MODE = false');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return new Response(
        JSON.stringify({ 
          faceMeshUrl: 'https://example.com/mock-face-mesh.obj',
          faceTextureUrl: 'https://example.com/mock-face-texture.png',
          bodyMeshUrl: 'https://example.com/mock-body-mesh.obj',
          message: '3D avatar generated (mock mode)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PRODUCTION MODE: Use Replicate API with retry logic
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    if (isDev) console.log('Running Replicate models with retry logic...');
    const startTime = Date.now();
    
    // Run both models in parallel with timeout and retry
    const TIMEOUT_MS = 90000; // 90 seconds (increased for retry attempts)
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 90 seconds')), TIMEOUT_MS)
    );

    interface ReplicateOutput {
      face_obj?: string;
      face_texture?: string;
      body_obj?: string;
    }

    // NOTE: Update these model paths to your deployed models
    // Example: "your-username/deca-face" and "your-username/pifuhd-body"
    const [faceResult, bodyResult] = await Promise.race([
      Promise.all([
        replicateWithRetry(replicate, "akinyemi-evan/deca-face", {
          image: personImageBase64
        }, 3) as Promise<ReplicateOutput>,
        replicateWithRetry(replicate, "akinyemi-evan/pifuhd-body", {
          image: personImageBase64
        }, 3) as Promise<ReplicateOutput>
      ]),
      timeoutPromise
    ]) as [ReplicateOutput, ReplicateOutput];

    const duration = Date.now() - startTime;
    if (isDev) console.log(`Replicate models completed in ${(duration / 1000).toFixed(2)}s`);

    // Extract and validate URLs from results
    const faceMeshUrl = faceResult?.face_obj;
    const faceTextureUrl = faceResult?.face_texture;
    const bodyMeshUrl = bodyResult?.body_obj;

    if (!faceMeshUrl || !faceTextureUrl || !bodyMeshUrl) {
      console.error('Missing URLs in Replicate response:', { 
        faceMeshUrl: !!faceMeshUrl, 
        faceTextureUrl: !!faceTextureUrl, 
        bodyMeshUrl: !!bodyMeshUrl 
      });
      throw new Error('Replicate API returned incomplete results');
    }

    if (isDev) {
      console.log('Successfully generated avatar features:', {
        faceMeshUrl: faceMeshUrl.substring(0, 50) + '...',
        faceTextureUrl: faceTextureUrl.substring(0, 50) + '...',
        bodyMeshUrl: bodyMeshUrl.substring(0, 50) + '...'
      });
    }

    return new Response(
      JSON.stringify({ 
        faceMeshUrl,
        faceTextureUrl,
        bodyMeshUrl,
        message: '3D avatar generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating avatar:', errorMessage);
    
    // Provide user-friendly error messages
    let userMessage = '';
    
    if (errorMessage.includes('timeout')) {
      userMessage = 'This is taking longer than expected. Try using a smaller image or simpler background.';
    } else if (errorMessage.includes('Invalid base64') || errorMessage.includes('Invalid image format')) {
      userMessage = 'There was a problem processing your photo. Please try uploading a different image.';
    } else if (errorMessage.includes('size exceeds')) {
      userMessage = 'Your image is too large. Please use an image smaller than 10MB.';
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      userMessage = 'Our 3D generation service is temporarily unavailable. Please contact support.';
    } else if (errorMessage.includes('rate limit')) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else {
      userMessage = 'We couldn\'t generate your 3D avatar. Please try again with a different photo or contact support if the problem persists.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        technicalError: isDev ? errorMessage : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
