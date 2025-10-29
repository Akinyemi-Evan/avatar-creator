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

    console.log('Generating face mesh with DECA and body mesh with PIFuHD...');
    
    // Run both models in parallel for faster processing
    const [decaResult, pifuhdResult] = await Promise.all([
      // DECA for face mesh + texture
      replicate.run("akinyemi-evan/deca-face", {
        input: { image: personImageBase64 }
      }),
      // PIFuHD for full body mesh
      replicate.run("akinyemi-evan/pifuhd-body", {
        input: { 
          image: personImageBase64,
          resolution: 256
        }
      })
    ]);

    console.log('DECA result:', decaResult);
    console.log('PIFuHD result:', pifuhdResult);

    // Extract URLs from results
    const faceMeshUrl = (decaResult as any)?.mesh || null;
    const faceTextureUrl = (decaResult as any)?.texture || null;
    const bodyMeshUrl = pifuhdResult as string || null;

    if (!faceMeshUrl || !bodyMeshUrl) {
      throw new Error('Failed to generate 3D meshes');
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
    console.error('Error in generate-avatar-features:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
