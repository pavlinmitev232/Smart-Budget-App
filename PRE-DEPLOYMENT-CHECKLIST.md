# Pre-Deployment Checklist ✅

## Before You Start (Do This Locally)

### 1. Test Everything Works Locally
```powershell
# Terminal 1 - Start database
docker compose up

# Terminal 2 - Start backend
cd backend
npm run dev

# Terminal 3 - Start frontend
cd frontend
npm run dev
```
- [ ] Can register a new user
- [ ] Can login
- [ ] Can create transactions
- [ ] Dashboard shows data

### 2. Commit and Push Latest Changes
```powershell
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 3. Prepare Information
Write down these before starting:
- [ ] Your Hostinger VPS IP address: `________________`
- [ ] Your domain name: `________________`
- [ ] Your SSH username (usually `root`): `________________`

---

## Hostinger Requirements

### Hosting Plan
You need **VPS Hosting** (not shared hosting). Recommended:
- **VPS 1** (minimum): 1 vCPU, 4GB RAM, 50GB SSD - $4.99/month
- **VPS 2** (recommended): 2 vCPU, 8GB RAM, 100GB SSD - $8.99/month

### Access SSH
1. Go to Hostinger panel
2. Navigate to VPS → SSH Access
3. Note down:
   - IP Address
   - SSH Port (usually 22)
   - Root Password

---

## Quick Deployment Methods

### Method 1: Automated Script (Fastest - 15 minutes)
```bash
# On your VPS
wget https://raw.githubusercontent.com/pavlinmitev232/Smart-Budget-App/main/deploy-hostinger.sh
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
```

### Method 2: Manual Step-by-Step (1 hour)
Follow: `DEPLOY-HOSTINGER.md`

---

## What You'll Need to Provide During Setup

1. **Domain Name**
   - Example: `budget.yourdomain.com`
   - Make sure it points to your VPS IP (A record in DNS)

2. **Database Password**
   - Generate strong password: https://passwordsgenerator.net/
   - Or use: `openssl rand -base64 24`

3. **JWT Secret**
   - The script will generate this for you
   - Or generate: `openssl rand -base64 32`

---

## DNS Setup (Do This First!)

Before deploying, point your domain to your VPS:

1. Go to your domain provider (Namecheap, GoDaddy, etc.)
2. Add/Edit DNS records:
   ```
   Type: A
   Host: @ (or subdomain like "budget")
   Value: YOUR_VPS_IP
   TTL: 3600
   ```
3. Wait 5-10 minutes for DNS to propagate

### Verify DNS is Working
```powershell
nslookup yourdomain.com
```
Should show your VPS IP address.

---

## During Deployment - Quick Reference

### Connect to VPS
```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

### If Script Fails - Manual Commands

**Check what's running:**
```bash
pm2 status                    # Backend status
systemctl status nginx        # Web server
systemctl status postgresql   # Database
```

**View logs:**
```bash
pm2 logs smart-budget-api     # Backend logs
tail -f /var/log/nginx/error.log  # Nginx errors
```

**Restart services:**
```bash
pm2 restart smart-budget-api
systemctl restart nginx
systemctl restart postgresql
```

---

## After Deployment - Verification

### 1. Check Backend API
```bash
curl https://yourdomain.com/api/health
```
Should return: `{"status":"ok"}`

### 2. Check Frontend
Visit: `https://yourdomain.com`
- Should see login page
- No console errors

### 3. Test Full Flow
1. Register new user
2. Login
3. Create transaction
4. View dashboard

---

## Common Issues & Quick Fixes

### "Connection Refused"
```bash
# Check if backend is running
pm2 status
pm2 restart smart-budget-api
```

### "502 Bad Gateway"
```bash
# Backend probably crashed
pm2 logs smart-budget-api
# Fix the error, then:
pm2 restart smart-budget-api
```

### "Database connection failed"
```bash
# Check PostgreSQL
systemctl status postgresql
# If stopped:
systemctl start postgresql
```

### "Certificate not working"
```bash
# Rerun certbot
certbot --nginx -d yourdomain.com --force-renew
```

---

## Time Estimates

| Task | Time |
|------|------|
| DNS Setup | 5-15 min |
| VPS Initial Setup | 10-15 min |
| Run Deployment Script | 5-10 min |
| SSL Certificate | 2-5 min |
| Testing & Verification | 5-10 min |
| **Total (Script Method)** | **30-55 min** |
| **Total (Manual Method)** | **60-90 min** |

---

## Emergency Rollback

If something goes wrong:
```bash
# Stop everything
pm2 stop all
systemctl stop nginx

# View what went wrong
pm2 logs
journalctl -xe

# Start fresh
rm -rf /var/www/smart-budget
# Then re-run deployment script
```

---

## Support Resources

- **Hostinger Support**: https://www.hostinger.com/contact
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

## Post-Deployment

### Monitor Your App
```bash
# Watch real-time logs
pm2 logs smart-budget-api --lines 50

# Monitor system resources
pm2 monit

# Check disk space
df -h
```

### Setup Automatic Backups
```bash
# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * pg_dump -U smartbudget smart_budget > /root/backups/db-$(date +\%Y\%m\%d).sql
```

---

**Ready to deploy? Start with DNS setup, then run the automated script!** 🚀
