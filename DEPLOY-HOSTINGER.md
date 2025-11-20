# Hostinger Deployment Guide - 1 Hour Sprint 🚀

## Prerequisites (5 min)
- [ ] Hostinger VPS plan (Business or higher recommended)
- [ ] Domain pointed to your VPS
- [ ] SSH access credentials from Hostinger panel

---

## Phase 1: Initial Server Setup (15 min)

### 1. Connect to your VPS
```bash
ssh root@your-vps-ip
```

### 2. Quick server setup
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

### 3. Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE smart_budget;
CREATE USER smartbudget WITH PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE smart_budget TO smartbudget;
\q
```

---

## Phase 2: Deploy Backend (15 min)

### 1. Clone and setup
```bash
# Create app directory
mkdir -p /var/www/smart-budget
cd /var/www/smart-budget

# Clone your repo
git clone https://github.com/pavlinmitev232/Smart-Budget-App.git .

# Setup backend
cd backend
npm install
```

### 2. Create production .env
```bash
nano .env
```

Paste this (update values):
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://smartbudget:CHANGE_THIS_PASSWORD@localhost:5432/smart_budget
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_budget
DB_USER=smartbudget
DB_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_RANDOM_SECRET_HERE
```

### 3. Build and run migrations
```bash
npm run build
npm run migrate:up
```

### 4. Start with PM2
```bash
pm2 start dist/index.js --name smart-budget-api
pm2 save
pm2 startup
```

---

## Phase 3: Deploy Frontend (15 min)

### 1. Update API endpoint
```bash
cd /var/www/smart-budget/frontend
nano src/services/api.ts
```

Change `baseURL` to your domain:
```typescript
baseURL: 'https://yourdomain.com/api'
```

### 2. Build frontend
```bash
npm install
npm run build
```

---

## Phase 4: Configure Nginx (10 min)

### 1. Create Nginx config
```bash
nano /etc/nginx/sites-available/smart-budget
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    root /var/www/smart-budget/frontend/dist;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable site and restart Nginx
```bash
ln -s /etc/nginx/sites-available/smart-budget /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Phase 5: SSL Certificate (5 min)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Phase 6: Final Checks (5 min)

### 1. Check services
```bash
# Check PM2
pm2 status

# Check Nginx
systemctl status nginx

# Check PostgreSQL
systemctl status postgresql

# View backend logs
pm2 logs smart-budget-api
```

### 2. Test your app
- Visit: `https://yourdomain.com`
- Try registering a user
- Test creating transactions

---

## Quick Commands Reference

### Backend Management
```bash
# View logs
pm2 logs smart-budget-api

# Restart backend
pm2 restart smart-budget-api

# Stop backend
pm2 stop smart-budget-api
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql -d smart_budget

# Backup database
pg_dump -U smartbudget smart_budget > backup.sql

# Restore database
psql -U smartbudget smart_budget < backup.sql
```

### Deploy Updates
```bash
cd /var/www/smart-budget

# Pull latest changes
git pull

# Update backend
cd backend
npm install
npm run build
pm2 restart smart-budget-api

# Update frontend
cd ../frontend
npm install
npm run build
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs smart-budget-api

# Check if port 5000 is in use
netstat -tlnp | grep 5000

# Restart
pm2 restart smart-budget-api
```

### Database connection issues
```bash
# Test connection
psql -U smartbudget -d smart_budget -h localhost

# Check PostgreSQL is running
systemctl status postgresql
```

### Frontend shows 404
```bash
# Check Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Check file permissions
ls -la /var/www/smart-budget/frontend/dist
```

### API calls failing (CORS)
Make sure your backend's CORS is configured for your domain. Check `backend/src/index.ts`.

---

## Security Checklist
- [ ] Changed default PostgreSQL password
- [ ] Generated strong JWT_SECRET
- [ ] SSL certificate installed
- [ ] Firewall configured (only allow 80, 443, 22)
- [ ] Regular backups scheduled

---

## Performance Tips
1. Enable Nginx caching for static files
2. Use PM2 cluster mode: `pm2 start dist/index.js -i max`
3. Setup database indexes for frequently queried fields
4. Monitor with: `pm2 monit`

---

## Need Help?
- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Check system resources: `htop`
