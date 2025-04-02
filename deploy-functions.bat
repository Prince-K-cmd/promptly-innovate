
@echo off
echo Deploying Supabase Edge Functions...

REM Check if project reference is provided as argument
IF "%1"=="" (
    echo ERROR: Please provide your Supabase project reference ID as an argument.
    echo Example: deploy-functions.bat aqqemqcdndjvuzgivxli
    echo.
    echo You can find your project reference ID in the Supabase dashboard:
    echo 1. Go to https://app.supabase.io/
    echo 2. Select your project
    echo 3. Go to Project Settings
    echo 4. Look for "Reference ID" or "Project ID"
    exit /b 1
)

REM Deploy the send-custom-email function first
echo Deploying send-custom-email function...
cd supabase/functions/send-custom-email
npx supabase functions deploy send-custom-email --project-ref %1

REM Deploy the send-password-changed-notification function
echo Deploying send-password-changed-notification function...
cd ../send-password-changed-notification
npx supabase functions deploy send-password-changed-notification --project-ref %1

echo All functions deployed successfully!
