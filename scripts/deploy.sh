#!/bin/bash

# Deploy script for agent.housler.ru
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment for agent.housler.ru..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Copy .env.example to .env and fill in the values"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and restart containers
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Restarting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking health..."
curl -sf http://localhost:3080/health && echo " ✅ Backend healthy" || echo " ❌ Backend unhealthy"

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
echo "   Site: https://agent.housler.ru"
