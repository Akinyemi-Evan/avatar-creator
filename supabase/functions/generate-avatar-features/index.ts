import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personImageBase64 } = await req.json();
    
    console.log('Received avatar generation request');
    
    // Validate presence
    if (!personImageBase64) {
      console.error('Missing personImageBase64 in request');
      throw new Error('Missing personImageBase64 in request body');
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
    if (!base64Regex.test(personImageBase64)) {
      console.error('Invalid base64 format');
      throw new Error('Invalid base64 image format. Must be data:image/[type];base64,[data]');
    }

    // Validate base64 data exists
    const base64Data = personImageBase64.split(',')[1];
    if (!base64Data) {
      console.error('Missing base64 data');
      throw new Error('Missing base64 data after header');
    }

    // Validate base64 characters
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      console.error('Invalid base64 characters');
      throw new Error('Invalid base64 characters detected');
    }

    // Check size (max 10MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      console.error(`Image too large: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);
      throw new Error(`Image size exceeds maximum allowed size of 10MB`);
    }

    console.log(`Image validated: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log('Running Replicate models...');
    const startTime = Date.now();
    
    // Run both models in parallel with timeout
    const TIMEOUT_MS = 60000; // 60 seconds
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 60 seconds')), TIMEOUT_MS)
    );

    interface ReplicateOutput {
      face_obj?: string;
      face_texture?: string;
      body_obj?: string;
    }

    const [faceResult, bodyResult] = await Promise.race([
      Promise.all([
        replicate.run("akinyemi-evan/deca-face", {
          input: { image: personImageBase64 }
        }) as Promise<ReplicateOutput>,
        replicate.run("akinyemi-evan/pifuhd-body", {
          input: { image: personImageBase64 }
        }) as Promise<ReplicateOutput>
      ]),
      timeoutPromise
    ]) as [ReplicateOutput, ReplicateOutput];

    const duration = Date.now() - startTime;
    console.log(`Replicate models completed in ${(duration / 1000).toFixed(2)}s`);

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

    console.log('Successfully generated avatar features:', {
      faceMeshUrl: faceMeshUrl.substring(0, 50) + '...',
      faceTextureUrl: faceTextureUrl.substring(0, 50) + '...',
      bodyMeshUrl: bodyMeshUrl.substring(0, 50) + '...'
    });

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
    let userMessage = 'Failed to generate 3D avatar. ';
    if (errorMessage.includes('timeout')) {
      userMessage += 'The request took too long. Please try again with a smaller image.';
    } else if (errorMessage.includes('Invalid base64')) {
      userMessage += 'Invalid image format. Please upload a valid image file.';
    } else if (errorMessage.includes('size exceeds')) {
      userMessage += 'Image is too large. Please use an image smaller than 10MB.';
    } else {
      userMessage += 'Please try again or use a different photo.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        technicalError: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
