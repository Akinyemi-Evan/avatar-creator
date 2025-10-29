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

    console.log('Enhancing photo with CodeFormer...');
    
    // Use CodeFormer for face enhancement and restoration
    const enhanced = await replicate.run(
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      {
        input: {
          image: personImageBase64,
          codeformer_fidelity: 0.9,
          background_enhance: true,
          face_upsample: true,
          upscale: 2
        }
      }
    ) as string;

    console.log('Photo enhanced successfully:', enhanced);

    return new Response(
      JSON.stringify({ 
        enhancedTextureUrl: enhanced,
        message: 'Photo enhanced with CodeFormer'
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
