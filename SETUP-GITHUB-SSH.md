# GitHub SSH Setup for VPS Deployment

## What You'll Do

The deployment script will automatically:
1. Generate an SSH key on your VPS
2. Show you the public key
3. Wait for you to add it to GitHub
4. Then clone your private repo

## Step-by-Step Instructions

### When the script pauses and shows the SSH key:

1. **Copy the SSH public key** that's displayed (it starts with `ssh-ed25519`)

2. **Open GitHub in your browser:**
   - Go to: https://github.com/pavlinmitev232/Smart-Budget-App/settings/keys
   - Or navigate: Your Repo → Settings → Deploy keys

3. **Click "Add deploy key"**

4. **Fill in the form:**
   - **Title:** `VPS Deployment Key` (or whatever you want)
   - **Key:** Paste the SSH key you copied
   - **☑ Allow write access:** Leave UNCHECKED (read-only is fine)

5. **Click "Add key"**

6. **Go back to your VPS terminal** and press ENTER

7. **The script continues** and clones your repo automatically!

## Visual Guide

```
VPS Terminal                           GitHub Website
─────────────                          ──────────────

Script generates SSH key
     │
     ├──> Shows public key ────────────> Copy this key
     │                                          │
     │                                          ▼
     │                               Go to Deploy keys section
     │                                          │
     │                                          ▼
     │                               Click "Add deploy key"
     │                                          │
     │                                          ▼
     │                               Paste key, give it a name
     │                                          │
     │                                          ▼
     │                                  Click "Add key"
     │                                          │
     ├──< Wait for confirmation ◄──────────────┘
     │
     ▼
Script clones repo
```

## What If Something Goes Wrong?

### Error: "Permission denied (publickey)"

This means the SSH key wasn't added to GitHub correctly.

**Fix:**
```bash
# Show the public key again
cat ~/.ssh/id_ed25519.pub

# Copy it and add to GitHub
# Then try cloning manually:
cd /var/www/smart-budget
git clone git@github.com:pavlinmitev232/Smart-Budget-App.git .
```

### Error: "Host key verification failed"

**Fix:**
```bash
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Try again
git clone git@github.com:pavlinmitev232/Smart-Budget-App.git .
```

## Alternative: Manual Setup (Before Running Script)

If you want to set this up BEFORE running the script:

```bash
# 1. SSH to your VPS
ssh root@YOUR_VPS_IP

# 2. Generate SSH key
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/id_ed25519 -N ""

# 3. Show the public key
cat ~/.ssh/id_ed25519.pub

# 4. Copy the key and add to GitHub (steps above)

# 5. Test the connection
ssh -T git@github.com
# Should say: "Hi pavlinmitev232! You've successfully authenticated..."

# 6. Now run the deployment script
```

## Using IP Address (No Domain Required)

When the script asks for domain/IP, just enter your VPS IP:
```
Enter your domain or IP address: 123.45.67.89
```

The script will:
- ✅ Skip SSL certificate setup (IPs can't have SSL)
- ✅ Configure Nginx for HTTP only
- ✅ Set up everything else normally

You'll access your app at: `http://123.45.67.89`

Later, when you add a domain:
1. Point domain DNS to your VPS IP
2. Update Nginx config with domain name
3. Run certbot to add SSL

## Quick Reference

### Get VPS IP address from Hostinger:
- Hostinger Panel → VPS → Overview → IP Address

### SSH into VPS:
```bash
ssh root@YOUR_VPS_IP
```

### View SSH public key (if needed again):
```bash
cat ~/.ssh/id_ed25519.pub
```

### Test GitHub connection:
```bash
ssh -T git@github.com
```

### Clone repo manually (if script fails):
```bash
cd /var/www
mkdir -p smart-budget
cd smart-budget
git clone git@github.com:pavlinmitev232/Smart-Budget-App.git .
```

---

**That's it!** The script handles everything else automatically. 🚀
