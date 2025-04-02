// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    // Create an admin client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { email, subject, template } = await req.json()

    if (!email || !subject || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: email, subject, or template' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Sending custom email to ${email} with template ${template}`)

    // Get the template content
    const templatePath = `./supabase/templates/${template}.html`
    let templateContent
    try {
      templateContent = await Deno.readTextFile(templatePath)
    } catch (error) {
      console.error(`Error reading template file: ${error.message}`)
      return new Response(
        JSON.stringify({ error: `Template not found: ${template}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST') ?? ''
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') ?? '587')
    const smtpUser = Deno.env.get('SMTP_USER') ?? ''
    const smtpPass = Deno.env.get('SMTP_PASS') ?? ''
    const smtpFrom = Deno.env.get('SMTP_FROM') ?? ''

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      console.error('Missing SMTP configuration')
      return new Response(
        JSON.stringify({ error: 'SMTP configuration is missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Create SMTP client
    const client = new SmtpClient()

    try {
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass,
      })

      await client.send({
        from: smtpFrom,
        to: email,
        subject: subject,
        content: templateContent,
        html: templateContent,
      })

      await client.close()

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (error) {
      console.error(`Error sending email: ${error.message}`)
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${error.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
