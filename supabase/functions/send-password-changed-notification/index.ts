
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get the user's email
    const userEmail = user.email;
    const userId = user.id;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Sending password changed notification to ${userEmail}`);

    // Get user profile to include username in the email if available
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profile?.username || '';

    // Initialize Resend with API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const resend = new Resend(resendApiKey);

    // Get site URL from environment
    const siteUrl = Deno.env.get('SITE_URL') || 'https://promptiverse.app';

    // Read the email template
    const templatePath = './supabase/templates/password-changed.html';
    let templateContent;
    try {
      templateContent = await Deno.readTextFile(templatePath);
    } catch (error) {
      console.error('Error reading template file:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to read email template' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Replace template variables
    templateContent = templateContent
      .replace(/{{ \.SiteURL }}/g, siteUrl)
      .replace(/{{ if \.Data\.username }} {{ \.Data\.username }}{{ end }}/g, username ? ` ${username}` : '');

    // Send the email with Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Promptiverse <no-reply@promptiverse.app>',
      to: [userEmail],
      subject: 'Your Promptiverse Password Has Been Changed',
      html: templateContent,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: emailError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('Password change notification sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
