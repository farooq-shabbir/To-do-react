# Direct SSH Deployment Setup Guide (No Docker Hub)

This guide will help you deploy your React app directly to your local server via SSH without using Docker Hub as an intermediary.

## 📋 What's Different?

This approach **skips Docker Hub entirely**:
- ✅ Build happens on GitHub Actions
- ✅ Docker image is saved as a `.tar.gz` file
- ✅ Image is transferred directly to your server via SCP
- ✅ Server loads and runs the image locally

**Perfect for:** Private deployments, no Docker Hub account needed, complete control

## Prerequisites

- ✅ Terminus installed with SSH access to your local server
- ✅ Docker installed on your local server
- ✅ GitHub repository with push access
- ❌ **No Docker Hub account needed!**

---

## Step 1: Prepare Your Local Server

### 1.1 Install Docker (if not already installed)

```bash
# Connect to your server via Terminus SSH
# Then run these commands:

# Update package list
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
# $USER automatically uses your current username - no need to replace anything
sudo usermod -aG docker $USER

# Apply group changes (or log out and back in)
newgrp docker

# Verify Docker installation
docker --version
docker ps
```

### 1.2 Configure Docker to Start on Boot

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.3 Test Docker

```bash
docker run hello-world
```

### 1.4 Check Available Disk Space

```bash
# Docker images can be large, ensure you have enough space
df -h /var/lib/docker

# Recommended: At least 5GB free space
```

---

## Step 2: Generate SSH Key Pair for GitHub Actions

### 2.1 On Your Local Server

```bash
# Generate a new SSH key pair (no passphrase for automation)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# View the public key
cat ~/.ssh/github_actions_deploy.pub

# View the private key (needed for GitHub secrets)
cat ~/.ssh/github_actions_deploy
```

### 2.2 Add Public Key to Authorized Keys

```bash
# Add the public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Verify permissions
ls -la ~/.ssh/
```

### 2.3 Get Your Server Information

```bash
# Get your server IP address
hostname -I
# OR if hostname -I doesn't work:
ip addr show

# Get your username
whoami

# Note these values - you'll need them for GitHub secrets
```

### 2.4 Test SSH Connection (Optional but Recommended)

```bash
# From another terminal, test SSH connection
ssh -i ~/.ssh/github_actions_deploy your-username@your-server-ip

# If successful, you should connect without a password
```

---

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add the following:

### Required Secrets (Only 4 needed!):

| Secret Name | Description | Example | How to Get |
|------------|-------------|---------|------------|
| `SSH_PRIVATE_KEY` | Private key from `~/.ssh/github_actions_deploy` | Paste entire key including BEGIN/END lines | `cat ~/.ssh/github_actions_deploy` |
| `SERVER_HOST` | Your local server IP or hostname | `192.168.1.100` or `server.local` | `hostname -I` on server |
| `SERVER_USER` | Your server username | `ubuntu`, `user`, etc. | `whoami` on server |
| `APP_PORT` | Port to expose the app (optional, default: 80) | `8080`, `3000`, `80` | Choose based on preference |

### How to Add Secrets:

#### SSH_PRIVATE_KEY
```bash
# On your server, copy the entire private key
cat ~/.ssh/github_actions_deploy

# Output will look like:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
...many lines...
-----END OPENSSH PRIVATE KEY-----

# Copy EVERYTHING including the BEGIN and END lines
# Paste into GitHub Secret value
```

1. In GitHub: **New repository secret**
2. Name: `SSH_PRIVATE_KEY`
3. Value: Paste the entire key
4. Click **Add secret**

#### SERVER_HOST
1. Name: `SERVER_HOST`
2. Value: Your IP address (e.g., `192.168.1.100`)
3. Click **Add secret**

#### SERVER_USER
1. Name: `SERVER_USER`
2. Value: Your username (e.g., `ubuntu`)
3. Click **Add secret**

#### APP_PORT (Optional)
1. Name: `APP_PORT`
2. Value: Port number (e.g., `80` or `8080`)
3. Click **Add secret**

---

## Step 4: Verify Workflow File

Ensure you have the workflow file:
- **File**: `.github/workflows/deploy-direct-ssh.yml`
- **Location**: `d:\ArgonTeq\App-project\To-do-react\.github\workflows\deploy-direct-ssh.yml`

If you need to use this as your main workflow, you can:

**Option A: Use alongside other workflows** (Keep all files)
- GitHub will run all workflows in `.github/workflows/`

**Option B: Disable other workflows** (Rename them)
```bash
# Rename to disable without deleting
mv .github/workflows/actions.yml .github/workflows/actions.yml.disabled
mv .github/workflows/deploy-to-local-server.yml .github/workflows/deploy-to-local-server.yml.disabled
```

---

## Step 5: Test the Deployment

### 5.1 Make a Test Commit

```bash
# In your local project directory
git add .
git commit -m "Test direct SSH deployment"
git push origin main
```

### 5.2 Monitor the Workflow

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see: "Build and Deploy Directly to Local Server (No Docker Hub)"
4. Click on the running workflow
5. Watch the progress:
   - ✅ Build
   - ✅ Test
   - ✅ Deploy (saves image, transfers via SSH, loads on server)

### 5.3 Understand the Process

Watch these key steps in the Actions log:
```
Build Docker image
  → Building image locally on GitHub Actions

Save Docker image to tar file
  → Converting image to compressed tar.gz (typically 50-200MB)

Transfer Docker image to server with retry
  → Uploading via SCP (may take 1-5 minutes depending on size/speed)

Deploy to Local Server with retry
  → Loading image on server
  → Stopping old container
  → Starting new container

Verify deployment
  → Checking container status
  → Showing logs
```

### 5.4 Verify Deployment on Server

```bash
# SSH to your server
ssh your-user@your-server-ip

# Check if container is running
docker ps | grep todo-react-app

# Should see output like:
# todo-react-app   Up X minutes   0.0.0.0:80->80/tcp

# Check container logs
docker logs todo-react-app

# View last 20 lines of logs
docker logs --tail 20 todo-react-app

# Test the application locally on server
curl http://localhost:80
# OR
curl http://localhost:8080  # if you set APP_PORT to 8080
```

### 5.5 Access Your Application

Open your browser and navigate to:
- `http://your-server-ip:80` (or the port you configured)
- `http://your-server-ip:8080`
- `http://192.168.1.100:80`

You should see your To-Do React application! 🎉

---

## Step 6: Troubleshooting

### Issue: SSH Connection Failed

**Check SSH service:**
```bash
# On your server
sudo systemctl status ssh

# If not running, start it
sudo systemctl start ssh
sudo systemctl enable ssh
```

**Check SSH key permissions:**
```bash
# On your server
ls -la ~/.ssh/
# authorized_keys should be 600
# .ssh directory should be 700

chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Test SSH manually:**
```bash
# From your local machine or another server
ssh -i /path/to/private/key your-user@your-server-ip -v
# The -v flag shows verbose output for debugging
```

**Check firewall:**
```bash
# On your server
sudo ufw status

# If SSH port (22) is blocked, allow it
sudo ufw allow 22/tcp
```

### Issue: SCP Transfer Failed or Too Slow

**Check transfer speed:**
```bash
# The workflow shows transfer progress in logs
# Look for: "Transfer Attempt X of 3"
# Large images (>500MB) may take several minutes
```

**Optimize Docker image size:**
```dockerfile
# In your Dockerfile, use multi-stage builds
# Use smaller base images (alpine variants)
# Example:
FROM node:18-alpine AS builder
# ... build steps ...

FROM nginx:alpine
# ... final image
```

**Check available bandwidth:**
```bash
# On your server, monitor network
sudo iftop
# OR
sudo nethogs
```

### Issue: Docker Load Failed

**Check disk space:**
```bash
# On your server
df -h /var/lib/docker

# If low on space, clean up
docker system prune -a
```

**Check Docker daemon:**
```bash
# On your server
sudo systemctl status docker

# Restart if needed
sudo systemctl restart docker
```

**Check tar file integrity:**
```bash
# On your server, manually test
gunzip -t /tmp/todo-react-app.tar.gz
# Should return nothing if file is valid
```

### Issue: Container Won't Start

**Check logs:**
```bash
docker logs todo-react-app

# Or follow logs in real-time
docker logs -f todo-react-app
```

**Check port conflicts:**
```bash
# See what's using the port
sudo netstat -tlnp | grep :80
# OR
sudo lsof -i :80

# If port is in use, either:
# 1. Stop the conflicting service
# 2. Use a different APP_PORT in GitHub secrets
```

**Inspect container:**
```bash
docker inspect todo-react-app

# Check container configuration
docker ps -a | grep todo-react-app
```

**Try running manually:**
```bash
# Stop the automated container
docker stop todo-react-app
docker rm todo-react-app

# Run manually to see errors
docker run -p 80:80 --name todo-react-app todo-react-app:latest

# If it works, the workflow should work too
```

### Issue: Build Artifacts Missing

**Check GitHub Actions logs:**
- Look for "Build React application" step
- Verify "dist" folder was created
- Check "Upload build artifacts" succeeded

**Common causes:**
- npm install failed → Check package.json
- Build script failed → Run `npm run build` locally
- Missing dependencies → Check node version

### Issue: Rollback Failed

**Manual rollback:**
```bash
# On your server
# List available images
docker images | grep todo-react-app

# If you have a previous image, run it
docker stop todo-react-app
docker rm todo-react-app
docker run -d --name todo-react-app -p 80:80 --restart unless-stopped todo-react-app:previous-tag

# Or pull from a backup
```

---

## Step 7: Performance & Optimization

### Reduce Image Size

**Current workflow uses compression (`gzip`), but you can optimize further:**

1. **Use multi-stage builds in Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Check current image size:**
```bash
# On GitHub Actions logs, look for:
# "Save Docker image to tar file"
# Shows: "todo-react-app.tar.gz" size

# On your server:
docker images | grep todo-react-app
```

3. **Optimize build artifacts:**
```bash
# In your React project
# Use production build (already done with npm run build)
# Enable minification
# Remove source maps for production (in vite.config.js)
```

### Speed Up Transfers

**If transfers are slow:**
- Use wired connection instead of WiFi (if possible)
- Schedule deployments during off-peak hours
- Consider using Docker Hub for large images (faster CDN)
- Use rsync instead of scp for incremental updates (advanced)

### Clean Up Old Images

**Automatically clean old images:**
The workflow includes `docker image prune -f` but you can add:

```bash
# SSH to your server and add a cron job
crontab -e

# Add this line to clean up weekly:
0 2 * * 0 docker image prune -a -f

# This removes all unused images every Sunday at 2 AM
```

**Manual cleanup:**
```bash
# On your server
docker images  # List all images
docker image prune -a  # Remove unused images
docker system df  # Check disk usage
docker system prune -a  # Remove everything unused
```

---

## Step 8: Security Best Practices

### 1. SSH Key Security

```bash
# On your server, review who has SSH access
cat ~/.ssh/authorized_keys

# Remove old/unused keys regularly
nano ~/.ssh/authorized_keys

# Monitor SSH login attempts
sudo tail -f /var/log/auth.log
```

### 2. Firewall Configuration

```bash
# On your server, enable firewall
sudo ufw enable

# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (if using SSL)

# Check status
sudo ufw status verbose
```

### 3. Docker Security

```bash
# Run containers as non-root user (advanced)
# Limit container resources
docker run -d \
  --name todo-react-app \
  --restart unless-stopped \
  --memory="256m" \
  --cpus="0.5" \
  -p 80:80 \
  todo-react-app:latest
```

### 4. Regular Updates

```bash
# Keep server updated
sudo apt update && sudo apt upgrade -y

# Keep Docker updated
sudo apt upgrade docker-ce docker-ce-cli containerd.io
```

### 5. Monitor Logs

```bash
# Watch for suspicious activity
sudo tail -f /var/log/auth.log  # SSH attempts
docker logs -f todo-react-app   # Application logs
```

---

## Step 9: Advanced Configurations

### A. Multiple Environment Deployment

Create separate workflows for different environments:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop

# Use different secrets:
# STAGING_SERVER_HOST
# STAGING_SERVER_USER
# STAGING_SSH_PRIVATE_KEY
```

### B. Health Check Endpoint

Add health check before marking deployment successful:

```bash
# In the workflow, after container starts:
- name: Health check
  run: |
    ssh ... << 'ENDSSH'
      # Wait for app to be ready
      for i in {1..30}; do
        if curl -f http://localhost:80 > /dev/null 2>&1; then
          echo "✓ App is responding"
          exit 0
        fi
        sleep 2
      done
      echo "ERROR: App not responding"
      exit 1
    ENDSSH
```

### C. Backup Before Deployment

```bash
# Add this before deployment in workflow:
- name: Backup current deployment
  run: |
    ssh ... << 'ENDSSH'
      if docker ps | grep -q todo-react-app; then
        docker commit todo-react-app todo-react-app:backup-$(date +%Y%m%d-%H%M%S)
        echo "✓ Created backup"
      fi
    ENDSSH
```

### D. Slack/Email Notifications

Add notification steps at the end:

```yaml
- name: Send success notification
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Deployment successful!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Step 10: Comparison with Docker Hub Approach

| Feature | Direct SSH | Docker Hub |
|---------|-----------|------------|
| **Setup Complexity** | ⭐⭐⭐ Simple | ⭐⭐⭐⭐ Medium |
| **Deployment Speed** | ⭐⭐ Depends on connection | ⭐⭐⭐⭐ Fast (CDN) |
| **Privacy** | ⭐⭐⭐⭐⭐ Fully private | ⭐⭐⭐ Public/Private repos |
| **External Dependencies** | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐ Docker Hub required |
| **Cost** | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐ Free tier available |
| **Multi-server Deploy** | ⭐⭐ Must transfer to each | ⭐⭐⭐⭐⭐ Pull from anywhere |
| **Image Size Limit** | ⭐⭐ Limited by transfer | ⭐⭐⭐⭐ No practical limit |

**Choose Direct SSH if:**
- ✅ You want complete privacy
- ✅ You don't want to manage Docker Hub account
- ✅ You have good network connection to server
- ✅ Deploying to single or few servers

**Choose Docker Hub if:**
- ✅ You need to deploy to many servers
- ✅ You want faster deployments (CDN)
- ✅ You want to keep image history/versions
- ✅ You already have Docker Hub account

---

## Summary Checklist

Before your first deployment, ensure:

- [ ] Docker installed on server (`docker --version`)
- [ ] SSH key pair generated (`~/.ssh/github_actions_deploy`)
- [ ] Public key added to `~/.ssh/authorized_keys`
- [ ] All 4 GitHub secrets configured
- [ ] Workflow file exists (`.github/workflows/deploy-direct-ssh.yml`)
- [ ] Port is available on server (`sudo netstat -tlnp | grep :80`)
- [ ] Firewall allows application port (`sudo ufw status`)
- [ ] Sufficient disk space (`df -h /var/lib/docker`)

Once deployed:
- [ ] Application accessible at `http://server-ip:port`
- [ ] Container is running (`docker ps | grep todo-react-app`)
- [ ] Logs show no errors (`docker logs todo-react-app`)

---

## Support & Resources

**Workflow File:** `.github/workflows/deploy-direct-ssh.yml`

**Key Features:**
- ✅ No Docker Hub needed
- ✅ Direct SSH/SCP transfer
- ✅ 3-retry logic for transfer and deployment
- ✅ Automatic rollback on failure
- ✅ Disk space monitoring
- ✅ Container health verification

**Common Commands Reference:**

```bash
# On Server:
docker ps                                    # List running containers
docker logs todo-react-app                   # View logs
docker restart todo-react-app                # Restart container
docker system df                             # Check disk usage
docker images                                # List images

# Testing:
curl http://localhost:80                     # Test locally
curl http://your-server-ip:80                # Test remotely (from another machine)

# Cleanup:
docker stop todo-react-app                   # Stop container
docker rm todo-react-app                     # Remove container
docker image prune -a                        # Clean unused images
```

**Need Help?**
1. Check GitHub Actions logs first
2. Check server Docker logs: `docker logs todo-react-app`
3. Verify SSH connection: `ssh user@server-ip`
4. Check this guide's troubleshooting section

---

🎉 **You're all set!** Push to GitHub and watch your app deploy directly to your server!
