#!/bin/bash

echo "Building and deploying to Netlify..."

# Clean up any previous builds
if [ -d "dist" ]; then
  rm -rf dist
fi

# Build the project
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

# Deploy to Netlify (if you have Netlify CLI installed)
# Uncomment the line below if you have Netlify CLI installed
# netlify deploy --prod

echo ""
echo "Build completed successfully!"
echo ""
echo "IMPORTANT: Remember to configure your Netlify site settings:"
echo "1. Set the build command to: npm run build"
echo "2. Set the publish directory to: dist"
echo "3. Ensure the _redirects file is in the public directory"
echo "4. Verify the netlify.toml file is in the root directory"
echo ""
echo "If you're deploying manually, upload the 'dist' folder to Netlify."
echo ""
