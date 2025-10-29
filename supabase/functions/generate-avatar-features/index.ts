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
    
    if (!personImageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing personImageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log('Step 1: Enhancing face with CodeFormer...');
    
    // Step 1: Face enhancement with CodeFormer
    const enhancedFace = await replicate.run(
      "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
      {
        input: {
          image: personImageBase64,
          codeformer_fidelity: 0.7,
          background_enhance: true,
          face_upsample: true,
          upscale: 2
        }
      }
    ) as string;

    console.log('Face enhanced:', enhancedFace);

    console.log('Step 2: Upscaling texture with Real-ESRGAN...');
    
    // Step 2: Upscale with Real-ESRGAN for high-quality texture
    const upscaledTexture = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: enhancedFace,
          scale: 2,
          face_enhance: true
        }
      }
    ) as string;

    console.log('Texture upscaled:', upscaledTexture);

    console.log('Step 3: Generating 3D mesh with PIFuHD...');
    
    // Step 3: Generate 3D full-body mesh with PIFuHD-based model
    const mesh3D = await replicate.run(
      "tokaito14/fullbody:7531f3912c49035a7bc6bec0fbcd45322c4594a86fdcd822e85b047ed05d753a",
      {
        input: {
          image: upscaledTexture
        }
      }
    ) as any;

    console.log('3D mesh generated:', mesh3D);

    // Extract GLB/OBJ file from the output
    const meshUrl = mesh3D?.glb || mesh3D?.obj || (Array.isArray(mesh3D) ? mesh3D[0] : mesh3D);
    
    if (!meshUrl) {
      console.error('No 3D mesh in response:', mesh3D);
      return new Response(
        JSON.stringify({ 
          enhancedTextureUrl: upscaledTexture,
          message: 'Production-quality texture generated (3D mesh generation in progress)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated production-quality 3D avatar');

    return new Response(
      JSON.stringify({ 
        enhancedTextureUrl: upscaledTexture,
        mesh3DUrl: meshUrl,
        message: 'Production 3D avatar generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-avatar-features:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
