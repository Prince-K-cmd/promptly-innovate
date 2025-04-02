#!/bin/bash
echo "Testing password changed notification function..."

# Start the Supabase Edge Function locally
cd supabase/functions
npx supabase functions serve send-password-changed-notification

# In a separate terminal, you can test with:
# curl -i --location --request POST 'http://localhost:54321/functions/v1/send-password-changed-notification' --header 'Authorization: Bearer YOUR_JWT_TOKEN' --header 'Content-Type: application/json'
