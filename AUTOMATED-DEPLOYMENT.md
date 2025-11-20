# Automated Deployment Setup

## GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **SSH_HOST**: Your Hostinger domain or IP address
   - Example: `yourdomain.com` or `123.456.789.0`

2. **SSH_USERNAME**: Your SSH username
   - Usually your Hostinger username or `u123456789`

3. **SSH_PRIVATE_KEY**: Your SSH private key
   - The contents of your `~/.ssh/id_rsa` or `~/.ssh/id_ed25519` file
   - Make sure this is the private key that matches the public key on Hostinger

4. **SSH_PORT** (optional): SSH port number
   - Default is 22, but Hostinger might use a different port

## How to Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value from above

## Getting Your SSH Private Key

On Windows PowerShell:
```powershell
Get-Content ~\.ssh\id_rsa
```

On Linux/Mac:
```bash
cat ~/.ssh/id_rsa
```

Copy the **entire output** including the `-----BEGIN` and `-----END` lines.

## Customizing the Deployment

Edit `.github/workflows/deploy.yml`:

- **Change the branch**: Update the `branches` section to match your production branch
- **Update the path**: Change `~/domains/your-domain.com/public_html` to your actual path
- **Modify the script**: Adjust build commands or PM2 restart commands as needed

## Testing the Workflow

1. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add automated deployment workflow"
   git push
   ```

2. Go to **Actions** tab in your GitHub repository
3. Watch the deployment run
4. Check the logs for any errors

## Troubleshooting

- **Permission denied**: Check that your SSH key is correct and added to Hostinger
- **Host key verification failed**: Add `StrictHostKeyChecking=no` in the SSH action (less secure)
- **PM2 not found**: Install PM2 globally on your Hostinger server: `npm install -g pm2`
- **Path not found**: Verify the correct path on your Hostinger server

## Alternative: Deploy on Specific Events

You can also trigger deployment on:
- Pull request merges
- Release tags
- Manual trigger

Example for tag-based deployment:
```yaml
on:
  push:
    tags:
      - 'v*'  # Deploy on version tags like v1.0.0
```
