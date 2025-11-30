#!/bin/bash

# First-time server setup for agent.housler.ru
# Run this on the VPS after cloning the repository
# Usage: ./scripts/setup-server.sh

set -e

echo "🔧 Setting up agent.housler.ru on server..."

# 1. Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs/backend
mkdir -p feeds

# 2. Copy nginx config to system
echo "🌐 Setting up Nginx..."
sudo cp nginx/agent.housler.ru.conf /etc/nginx/sites-available/agent.housler.ru
sudo ln -sf /etc/nginx/sites-available/agent.housler.ru /etc/nginx/sites-enabled/

# 3. Test nginx config
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# 4. Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d agent.housler.ru --non-interactive --agree-tos --email admin@housler.ru

# 5. Reload nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# 6. Create .env file if not exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and set the actual values!"
fi

# 7. Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 8. Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 15

# 9. Show status
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with actual values"
echo "   2. Import XML feed: docker-compose -f docker-compose.prod.yml exec backend node dist/cli/import-feed.js --file=/app/feeds/spb_.xml --migrate"
echo "   3. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🌐 Site will be available at: https://agent.housler.ru"
