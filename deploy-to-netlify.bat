@echo off
echo Building and deploying to Netlify...

REM Clean up any previous builds
if exist dist rmdir /s /q dist

REM Build the project
call npm run build

REM Check if build was successful
if %ERRORLEVEL% neq 0 (
  echo Build failed. Aborting deployment.
  exit /b %ERRORLEVEL%
)

REM Deploy to Netlify (if you have Netlify CLI installed)
REM Uncomment the line below if you have Netlify CLI installed
REM call netlify deploy --prod

echo.
echo Build completed successfully!
echo.
echo IMPORTANT: Remember to configure your Netlify site settings:
echo 1. Set the build command to: npm run build
echo 2. Set the publish directory to: dist
echo 3. Ensure the _redirects file is in the public directory
echo 4. Verify the netlify.toml file is in the root directory
echo.
echo If you're deploying manually, upload the 'dist' folder to Netlify.
echo.
