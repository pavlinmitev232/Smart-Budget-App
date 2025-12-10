# Installing pg_cron on Ubuntu VPS

**Simple step-by-step guide to install and configure pg_cron for automatic quota cleanup.**

---

## Prerequisites

- Ubuntu server (18.04, 20.04, 22.04, or 24.04)
- PostgreSQL 14+ already installed
- Smart Budget App backend deployed
- Root or sudo access

---

## Step 1: Install pg_cron Extension

```bash
# Install pg_cron package
sudo apt-get update
sudo apt-get install -y postgresql-14-cron
```

**For PostgreSQL 15 or 16:**
```bash
# Replace 14 with your PostgreSQL version
sudo apt-get install -y postgresql-15-cron
# OR
sudo apt-get install -y postgresql-16-cron
```

---

## Step 2: Find PostgreSQL Config File

```bash
# Find the config file location
sudo -u postgres psql -c "SHOW config_file;"
```

**Common location:**
```
/etc/postgresql/14/main/postgresql.conf
```

---

## Step 3: Edit PostgreSQL Configuration

```bash
# Open config file in nano editor
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Scroll to the bottom and add these two lines:**

```ini
shared_preload_libraries = 'pg_cron'
cron.database_name = 'smart_budget'
```

**If you already have `shared_preload_libraries` configured:**
```ini
# Add pg_cron to existing value with comma separator
shared_preload_libraries = 'existing_value,pg_cron'
```

**Save and exit:**
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

---

## Step 4: Restart PostgreSQL

```bash
# Restart PostgreSQL service
sudo systemctl restart postgresql

# Verify it's running
sudo systemctl status postgresql
```

**Expected output:**
```
● postgresql.service - PostgreSQL RDBMS
   Active: active (running)
```

Press `q` to exit status view.

---

## Step 5: Verify pg_cron is Loaded

```bash
# Connect to database and check
sudo -u postgres psql -d smart_budget -c "SHOW shared_preload_libraries;"
```

**Expected output:**
```
 shared_preload_libraries
--------------------------
 pg_cron
(1 row)
```

---

## Step 6: Run Database Migration

```bash
# Navigate to backend directory
cd /path/to/Smart-Budget-App/backend

# Run migration to set up pg_cron
npm run migrate:up
```

**Expected output:**
```
### MIGRATION 1764523579014_setup-pg-cron-cleanup (UP) ###
...
Migrations complete!
```

---

## Step 7: Verify Scheduled Job

```bash
# Check that the cleanup job is scheduled
sudo -u postgres psql -d smart_budget -c "SELECT jobid, schedule, command, active FROM cron.job;"
```

**Expected output:**
```
 jobid | schedule  |               command               | active
-------+-----------+-------------------------------------+--------
     1 | 0 2 * * * | SELECT cleanup_old_user_requests(); | t
(1 row)
```

**This means:**
- Job runs **every day at 2:00 AM**
- Deletes user_requests older than **30 days**
- Status: **active (t = true)**

---

## Step 8: Test Cleanup Function (Optional)

```bash
# Test the cleanup function manually
sudo -u postgres psql -d smart_budget -c "SELECT cleanup_old_user_requests();"
```

**Expected output:**
```
NOTICE: Quota cleanup completed: 0 old user_requests deleted
```

---

## ✅ Installation Complete!

Your pg_cron is now:
- ✅ Installed and configured
- ✅ Running the cleanup job daily at 2:00 AM
- ✅ Automatically deleting old quota records
- ✅ Persistent across server reboots

---

## Monitoring & Maintenance

### View Job Run History

```bash
# See last 5 cleanup job executions
sudo -u postgres psql -d smart_budget -c "SELECT jobid, runid, job_pid, status, return_message, start_time, end_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;"
```

### Check PostgreSQL Logs

```bash
# View recent PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Manually Trigger Cleanup

```bash
# Run cleanup immediately (for testing)
sudo -u postgres psql -d smart_budget -c "SELECT cleanup_old_user_requests();"
```

---

## Troubleshooting

### Problem: "command not found: postgresql-14-cron"

**Solution:** Check your PostgreSQL version:
```bash
psql --version
# Then install matching version:
sudo apt-get install postgresql-15-cron  # If you have PG 15
```

---

### Problem: "unrecognized configuration parameter cron.database_name"

**Solution:** pg_cron not loaded. Verify:
```bash
# 1. Check config file has the correct settings
sudo nano /etc/postgresql/14/main/postgresql.conf

# 2. Restart PostgreSQL
sudo systemctl restart postgresql

# 3. Check logs
sudo tail -50 /var/log/postgresql/postgresql-14-main.log
```

---

### Problem: Migration fails with "extension does not exist"

**Solution:** Install the package first:
```bash
sudo apt-get install postgresql-14-cron
sudo systemctl restart postgresql
```

---

### Problem: Permission denied

**Solution:** Grant permissions:
```bash
sudo -u postgres psql -d smart_budget -c "GRANT USAGE ON SCHEMA cron TO smartbudget;"
```

---

## Uninstall (If Needed)

```bash
# 1. Remove scheduled jobs
sudo -u postgres psql -d smart_budget -c "SELECT cron.unschedule('cleanup-old-user-requests');"

# 2. Drop extension
sudo -u postgres psql -d smart_budget -c "DROP EXTENSION pg_cron CASCADE;"

# 3. Remove from config
sudo nano /etc/postgresql/14/main/postgresql.conf
# Remove: shared_preload_libraries = 'pg_cron'
# Remove: cron.database_name = 'smart_budget'

# 4. Restart PostgreSQL
sudo systemctl restart postgresql

# 5. Uninstall package
sudo apt-get remove postgresql-14-cron
```

---

## Quick Reference

```bash
# Check if pg_cron is running
sudo -u postgres psql -d smart_budget -c "SELECT * FROM cron.job;"

# Check job execution history
sudo -u postgres psql -d smart_budget -c "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;"

# Manually run cleanup
sudo -u postgres psql -d smart_budget -c "SELECT cleanup_old_user_requests();"

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# View logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Need Help?

- **pg_cron GitHub:** https://github.com/citusdata/pg_cron
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Smart Budget App Issues:** Create issue in project repository

---

**Last Updated:** 2025-11-30
**Tested On:** Ubuntu 20.04, 22.04, PostgreSQL 14
