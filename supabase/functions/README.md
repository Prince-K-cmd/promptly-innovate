# Supabase Edge Functions

This directory contains Edge Functions for the Promptiverse application.

## Available Functions

### 1. send-password-changed-notification

Sends a notification email when a user changes their password.

## Deployment Instructions

### Prerequisites

1. Make sure you have Node.js installed (v16 or later recommended).

2. Log in to Supabase:
   ```bash
   npx supabase login
   ```

### Deploy Functions

You can deploy functions individually or use the deployment script.

#### Option 1: Deploy Individual Functions

```bash
# Navigate to the function directory
cd supabase/functions/send-password-changed-notification

# Deploy the function
npx supabase functions deploy send-password-changed-notification --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID (found in Project Settings).

#### Option 2: Use the Deployment Script

1. Run the script with your Supabase project reference ID as an argument:
   ```bash
   # Windows
   deploy-functions.bat YOUR_PROJECT_REF

   # Mac/Linux
   chmod +x deploy-functions.sh
   ./deploy-functions.sh YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID (found in Project Settings).

## Testing Functions

You can test the functions locally before deploying:

```bash
# Start the local Supabase stack
npx supabase start

# Serve the function locally
npx supabase functions serve send-password-changed-notification --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-password-changed-notification' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json'
```

## Environment Variables

The functions require the following environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

These are automatically available in the Supabase Edge Functions environment.
