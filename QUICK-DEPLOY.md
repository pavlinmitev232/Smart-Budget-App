# 🚀 ULTRA-QUICK DEPLOYMENT (Copy-Paste Edition)

## 1️⃣ Setup DNS (5 min)
Go to your domain provider → Add DNS record:
```
Type: A
Host: @
Value: YOUR_VPS_IP
```

## 2️⃣ Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

## 3️⃣ Run This ONE Command (20 min)
```bash
curl -sL https://raw.githubusercontent.com/pavlinmitev232/Smart-Budget-App/main/deploy-hostinger.sh | bash
```

## 4️⃣ Answer Questions
- Domain: `budget.yourdomain.com`
- Database password: (generate strong password)
- JWT secret: (press enter to auto-generate)

## 5️⃣ Done! ✅
Visit: `https://yourdomain.com`

---

## If Script Doesn't Work - Manual Speed Run

### Step 1: Install Everything (5 min)
```bash
apt update && apt install -y nodejs postgresql nginx git npm
npm install -g pm2
```

### Step 2: Setup Database (2 min)
```bash
sudo -u postgres psql -c "CREATE DATABASE smart_budget;"
sudo -u postgres psql -c "CREATE USER smartbudget WITH PASSWORD 'YOUR_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smart_budget TO smartbudget;"
```

### Step 3: Clone & Deploy Backend (5 min)
```bash
cd /var/www
git clone https://github.com/pavlinmitev232/Smart-Budget-App.git smart-budget
cd smart-budget/backend

# Create .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://smartbudget:YOUR_PASSWORD@localhost:5432/smart_budget
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_budget
DB_USER=smartbudget
DB_PASSWORD=YOUR_PASSWORD
JWT_SECRET=GENERATE_WITH_OPENSSL_RAND_BASE64_32
FRONTEND_URL=https://yourdomain.com
EOF

npm install && npm run build && npm run migrate:up
pm2 start dist/index.js --name smart-budget-api
pm2 save && pm2 startup
```

### Step 4: Build Frontend (3 min)
```bash
cd /var/www/smart-budget/frontend
echo "VITE_API_URL=/api" > .env.production
npm install && npm run build
```

### Step 5: Configure Nginx (3 min)
```bash
cat > /etc/nginx/sites-available/smart-budget << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/smart-budget/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/smart-budget /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### Step 6: SSL (2 min)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## Quick Checks

**Is backend running?**
```bash
pm2 status
curl http://localhost:5000/api/health
```

**Are there errors?**
```bash
pm2 logs smart-budget-api --lines 20
```

**Is Nginx working?**
```bash
nginx -t
systemctl status nginx
```

**Can I access the site?**
```bash
curl https://yourdomain.com
```

---

## One-Liner Health Check
```bash
echo "Backend:" && pm2 status | grep smart-budget && echo "Nginx:" && systemctl status nginx | grep Active && echo "Database:" && systemctl status postgresql | grep Active
```

---

## Update App Later
```bash
cd /var/www/smart-budget
git pull
cd backend && npm install && npm run build && pm2 restart smart-budget-api
cd ../frontend && npm install && npm run build
```

---

## Troubleshooting (Copy-Paste Fixes)

**Backend won't start:**
```bash
cd /var/www/smart-budget/backend
pm2 logs smart-budget-api
# Read the error, usually it's .env variables
```

**502 Bad Gateway:**
```bash
pm2 restart smart-budget-api
systemctl restart nginx
```

**Database connection failed:**
```bash
systemctl start postgresql
sudo -u postgres psql -c "\l" # list databases
```

**Frontend shows blank page:**
```bash
# Check console for errors
# Usually CORS or API URL issue
ls -la /var/www/smart-budget/frontend/dist
```

---

## Emergency Reset
```bash
pm2 delete smart-budget-api
rm -rf /var/www/smart-budget
# Start from Step 3 above
```

---

**Total Time: 30-45 minutes** ⏱️
