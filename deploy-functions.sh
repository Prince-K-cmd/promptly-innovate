
#!/bin/bash
echo "Deploying Supabase Edge Functions..."

# Check if project reference is provided as argument
if [ -z "$1" ]; then
    echo "ERROR: Please provide your Supabase project reference ID as an argument."
    echo "Example: ./deploy-functions.sh abcdefghijklmnopqrst"
    echo ""
    echo "You can find your project reference ID in the Supabase dashboard:"
    echo "1. Go to https://app.supabase.io/"
    echo "2. Select your project"
    echo "3. Go to Project Settings"
    echo "4. Look for \"Reference ID\" or \"Project ID\""
    exit 1
fi

# Deploy the send-custom-email function first
echo "Deploying send-custom-email function..."
cd supabase/functions/send-custom-email
npx supabase functions deploy send-custom-email --project-ref $1

# Deploy the send-password-changed-notification function
echo "Deploying send-password-changed-notification function..."
cd ../send-password-changed-notification
npx supabase functions deploy send-password-changed-notification --project-ref $1

echo "All functions deployed successfully!"
