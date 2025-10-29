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

    console.log('Generating avatar with Replicate...');

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Use Replicate's easel/ai-avatars to create a realistic avatar from the photo
    const output = await replicate.run(
      "easel/ai-avatars",
      {
        input: {
          prompt: "realistic 3D game avatar, professional quality, clear features",
          face_image: personImageBase64,
        }
      }
    );

    console.log('Replicate response received:', output);

    // Output from easel/ai-avatars is typically an image URL or array of URLs
    const generatedImageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!generatedImageUrl) {
      console.error('No image URL in response:', output);
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated avatar with Replicate');

    return new Response(
      JSON.stringify({ 
        enhancedTextureUrl: generatedImageUrl,
        message: 'Avatar texture generated successfully'
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
