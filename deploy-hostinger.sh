#!/bin/bash

# Smart Budget App - Quick Deploy Script for Hostinger VPS
# Run this ON YOUR VPS after initial setup

set -e

echo "🚀 Smart Budget Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/smart-budget"
DOMAIN=""
DB_PASSWORD=""
JWT_SECRET=""

# Get user inputs
read -p "Enter your domain or IP address: " DOMAIN
read -sp "Enter database password: " DB_PASSWORD
echo ""
read -sp "Enter JWT secret (or press enter to generate): " JWT_SECRET
echo ""

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated JWT secret${NC}"
fi

echo ""
echo -e "${YELLOW}Starting deployment...${NC}"
echo ""

# 1. System packages
echo "📦 Installing system packages..."
apt update
apt install -y nodejs postgresql postgresql-contrib nginx git

# Install PM2
npm install -g pm2

# 2. Setup PostgreSQL
echo "🗄️  Setting up PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE smart_budget;
CREATE USER smartbudget WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE smart_budget TO smartbudget;
ALTER DATABASE smart_budget OWNER TO smartbudget;
\q
EOF

# 3. Setup SSH key for GitHub (if not exists)
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "🔑 Setting up SSH key for GitHub..."
    ssh-keygen -t ed25519 -C "vps-deploy@smart-budget" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}SSH Public Key (Add this to GitHub):${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    cat ~/.ssh/id_ed25519.pub
    echo -e "${YELLOW}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Steps to add deploy key:"
    echo "1. Copy the key above"
    echo "2. Go to: https://github.com/pavlinmitev232/Smart-Budget-App/settings/keys"
    echo "3. Click 'Add deploy key'"
    echo "4. Paste the key and save"
    echo ""
    read -p "Press ENTER after adding the key to GitHub..."
    
    # Add GitHub to known hosts
    ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null
fi

# 3. Clone repository
echo "📥 Cloning repository..."
mkdir -p $APP_DIR
cd $APP_DIR
git clone -b deploy-branch git@github.com:pavlinmitev232/Smart-Budget-App.git .

# 4. Backend setup
echo "⚙️  Setting up backend..."
cd $APP_DIR/backend

cat > .env <<EOF
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://smartbudget:$DB_PASSWORD@localhost:5432/smart_budget
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_budget
DB_USER=smartbudget
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
FRONTEND_URL=http://$DOMAIN
EOF

npm install
npm run build
npm run migrate:up

# Start with PM2
pm2 start dist/index.js --name smart-budget-api
pm2 save
pm2 startup

# 5. Frontend setup
echo "🎨 Building frontend..."
cd $APP_DIR/frontend

# Create production env file (uses /api path, proxied by Nginx)
cat > .env.production <<EOF
VITE_API_URL=/api
EOF

npm install
npm run build

# 6. Nginx configuration
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/smart-budget <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    root $APP_DIR/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend routes (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/smart-budget /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 7. SSL Certificate (skip if using IP address)
if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "⚠️  Skipping SSL setup (using IP address)"
    echo "   You can add a domain and SSL later"
else
    echo "🔒 Setting up SSL..."
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL setup failed, but app is still accessible via http"
fi

# 8. Firewall
echo "🔥 Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# 9. Final checks
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "🌐 Your app is available at: http://$DOMAIN"
    echo "   (Using IP address - no HTTPS)"
else
    echo "🌐 Your app is available at: https://$DOMAIN"
fi
echo ""
echo "📝 Important commands:"
echo "  - View logs: pm2 logs smart-budget-api"
echo "  - Restart backend: pm2 restart smart-budget-api"
echo "  - Check Nginx: nginx -t"
echo ""
echo "🔐 Save these credentials:"
echo "  Database Password: $DB_PASSWORD"
echo "  JWT Secret: $JWT_SECRET"
echo ""
