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
      "sczhou/codeformer",
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
      "nightmareai/real-esrgan",
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
      "tokaito14/fullbody",
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
      // Fallback to just the enhanced texture if 3D generation fails
      return new Response(
        JSON.stringify({ 
          enhancedTextureUrl: upscaledTexture,
          message: '3D mesh generation failed, returning enhanced texture'
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
