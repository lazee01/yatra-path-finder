#!/bin/bash

# Vercel Deployment Script for Yatra Path Finder
# Run this script to deploy your app to Vercel

echo "🚀 Deploying Yatra Path Finder to Vercel..."
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "🌐 Your app is now live on Vercel!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Visit your Vercel dashboard to see the deployment"
    echo "2. Set up environment variables in Vercel dashboard"
    echo "3. Configure custom domain (optional)"
    echo "4. Test all features of your app"
else
    echo "❌ Deployment failed! Please check the errors above."
    exit 1
fi