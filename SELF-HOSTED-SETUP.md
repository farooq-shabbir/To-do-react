# Self-Hosted Runner Deployment Setup Guide

This guide will help you deploy your React app using a **self-hosted GitHub Actions runner** on your local server - **no SSH, no port forwarding, no complicated networking needed!**

## 📋 What's Different?

This approach is **much simpler**:
- ✅ GitHub Actions runner installed **on your server**
- ✅ No SSH keys needed
- ✅ No port forwarding required
- ✅ No public IP exposure
- ✅ Runner executes commands **locally** on the server
- ✅ Direct Docker access

**Perfect for:** Local development servers, behind firewalls, VPNs, home labs

## Comparison with SSH Approach

| Feature | Self-Hosted Runner | SSH Deployment |
|---------|-------------------|----------------|
| **Setup Complexity** | ⭐⭐ Very Simple | ⭐⭐⭐⭐ Complex |
| **Network Setup** | ⭐⭐⭐⭐⭐ None needed | ⭐⭐ Port forwarding required |
| **Security** | ⭐⭐⭐⭐⭐ Most secure | ⭐⭐⭐ SSH keys, open ports |
| **Speed** | ⭐⭐⭐⭐⭐ Fastest (local) | ⭐⭐ Network dependent |
| **Maintenance** | ⭐⭐⭐ Runner updates | ⭐⭐⭐⭐ Key rotation |
| **Internet Required** | ⭐⭐⭐⭐ Only for GitHub API | ⭐⭐⭐⭐ For image transfer |

---

## Prerequisites

- ✅ Local server with Ubuntu/Linux
- ✅ Docker installed
- ✅ GitHub repository with admin access
- ✅ Server has internet access (to communicate with GitHub)
- ❌ **NO SSH keys needed**
- ❌ **NO port forwarding needed**
- ❌ **NO public IP needed**

---

## Step 1: Install Docker (If Not Already Installed)

```bash
# Connect to your server
# Run these commands:

# Update packages
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify Docker
docker --version
docker ps
```

---

## Step 2: Install GitHub Actions Runner on Your Server

### 2.1 Go to Your GitHub Repository

1. Navigate to your repository: `https://github.com/YOUR-USERNAME/To-do-react`
2. Click **Settings** → **Actions** → **Runners**
3. Click **"New self-hosted runner"**
4. Select **Linux** and **x64** architecture

### 2.2 GitHub Will Show Commands - Run Them on Your Server

GitHub will display commands like these (copy from GitHub, not here - tokens are unique):

```bash
# Create a folder for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### 2.3 Configure the Runner

Run the configuration command (GitHub provides this with your unique token):

```bash
# Configure the runner (GitHub shows you the exact command)
./config.sh --url https://github.com/YOUR-USERNAME/To-do-react --token YOUR-UNIQUE-TOKEN
```

**When prompted:**
- **Enter the name of the runner group** → Press Enter (default)
- **Enter the name of runner** → `local-server` (or any name you want)
- **Enter any additional labels** → Press Enter (default)
- **Enter name of work folder** → Press Enter (default: `_work`)

You should see:
```
✓ Runner successfully added
✓ Runner connection is good
```

### 2.4 Install Runner as a Service (Auto-start)

```bash
# Install as a system service
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
# Should show: "Active: active (running)"
```

### 2.5 Verify Runner is Online

1. Go back to GitHub: **Settings** → **Actions** → **Runners**
2. You should see your runner listed with a **green dot** (Idle)

---

## Step 3: Configure GitHub Secrets (Optional)

Only 1 secret needed:

### APP_PORT (Optional)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `APP_PORT`
4. Value: `80` (or `8080`, `3000`, etc.)
5. Click **Add secret**

**Note:** If you don't add this secret, it defaults to port 80.

---

## Step 4: Verify Workflow File

Ensure you have the workflow file:
- **File**: `.github/workflows/deploy-self-hosted.yml`
- **Location**: `d:\ArgonTeq\App-project\To-do-react\.github\workflows\deploy-self-hosted.yml`

---

## Step 5: Test the Deployment

### 5.1 Make a Test Commit

```bash
# In your local project directory
git add .
git commit -m "Test self-hosted runner deployment"
git push origin main
```

### 5.2 Monitor the Workflow

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. You should see: "Build and Deploy with Self-Hosted Runner"
4. Click on the running workflow
5. Watch the progress:
   - ✅ Build React application
   - ✅ Run tests
   - ✅ Build Docker image
   - ✅ Deploy container
   - ✅ Health check

### 5.3 Understand the Process

The workflow runs **entirely on your server**:

```
Runner pulls code from GitHub
  ↓
Builds React app locally on server
  ↓
Runs tests locally
  ↓
Builds Docker image locally
  ↓
Deploys container locally
  ↓
Verifies deployment
```

**No file transfers, no SSH, no network complexity!**

### 5.4 Verify on Server

```bash
# Check if container is running
docker ps | grep todo-react-app

# Should see:
# todo-react-app   Up X minutes   0.0.0.0:80->80/tcp

# View logs
docker logs todo-react-app

# Test application
curl http://localhost:80
```

### 5.5 Access Your Application

From any device on your local network:
- `http://10.3.1.155:80`
- `http://server-hostname:80`

From the server itself:
- `http://localhost:80`

---

## Step 6: Troubleshooting

### Issue: Runner Shows Offline

**Check runner status:**
```bash
cd ~/actions-runner
sudo ./svc.sh status
```

**If not running:**
```bash
sudo ./svc.sh start
```

**View runner logs:**
```bash
journalctl -u actions.runner.* -f
```

### Issue: Workflow Stuck on "Waiting for a runner"

**Possible causes:**

1. **Runner is offline** - Check GitHub Settings → Runners
2. **Runner is busy** - Wait for current job to finish
3. **Labels don't match** - Workflow uses `runs-on: self-hosted`

**Solution:**
```bash
# Restart runner service
cd ~/actions-runner
sudo ./svc.sh restart
```

### Issue: Docker Permission Denied

**Fix Docker permissions:**
```bash
# Add user to docker group (if not already)
sudo usermod -aG docker $USER

# Restart runner after adding to group
cd ~/actions-runner
sudo ./svc.sh restart
```

### Issue: Port Already in Use

**Check what's using the port:**
```bash
sudo netstat -tlnp | grep :80
# OR
sudo lsof -i :80
```

**Solutions:**
- Stop conflicting service
- Use different APP_PORT in GitHub secrets

### Issue: Container Won't Start

**Check logs:**
```bash
docker logs todo-react-app
```

**Check disk space:**
```bash
df -h /var/lib/docker
```

**Manual cleanup:**
```bash
docker system prune -a
```

### Issue: Build Fails

**Check Node.js version:**
```bash
node --version  # Should be 18.x
npm --version
```

**If wrong version:**
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify on server:**
```bash
cd ~/actions-runner/_work/To-do-react/To-do-react
npm install
npm run build
```

---

## Step 7: Workflow Features

### Automatic Retry Logic

- **3 retry attempts** for deployment
- **5-second delay** between retries
- Automatically retries only on failure

### Automatic Backup

Before each deployment:
- Creates backup of current container
- Backup tagged with timestamp
- Keeps last 3 backups

### Automatic Rollback

If deployment fails:
- Automatically restores most recent backup
- Ensures application stays available
- Logs rollback status

### Health Checks

After deployment:
- Verifies container is running
- Tests HTTP endpoint
- Shows container logs
- Reports disk usage

### Cleanup

After successful deployment:
- Removes unused Docker images
- Keeps latest image and backups
- Cleans up build artifacts

---

## Step 8: Managing the Runner

### Start/Stop/Restart Runner

```bash
cd ~/actions-runner

# Start
sudo ./svc.sh start

# Stop
sudo ./svc.sh stop

# Restart
sudo ./svc.sh restart

# Status
sudo ./svc.sh status
```

### View Runner Logs

```bash
# Real-time logs
journalctl -u actions.runner.* -f

# Last 50 lines
journalctl -u actions.runner.* -n 50

# Logs from today
journalctl -u actions.runner.* --since today
```

### Update Runner

```bash
cd ~/actions-runner

# Stop runner
sudo ./svc.sh stop

# Download latest version (check GitHub for latest URL)
curl -o actions-runner-linux-x64-2.XXX.X.tar.gz -L https://github.com/actions/runner/releases/download/vX.XXX.X/actions-runner-linux-x64-2.XXX.X.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.XXX.X.tar.gz

# Start runner
sudo ./svc.sh start
```

### Remove Runner

```bash
cd ~/actions-runner

# Stop and uninstall service
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remove runner from GitHub
./config.sh remove --token YOUR-REMOVAL-TOKEN

# Clean up
cd ~
rm -rf actions-runner
```

---

## Step 9: Security Best Practices

### 1. Runner User Permissions

```bash
# Runner should NOT run as root
# Use a dedicated user for the runner
sudo useradd -m -s /bin/bash github-runner
sudo usermod -aG docker github-runner

# Install runner as github-runner user
sudo su - github-runner
```

### 2. Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow only necessary ports
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS (if using SSL)

# SSH only from local network (optional)
sudo ufw allow from 10.3.1.0/24 to any port 22

# Check status
sudo ufw status verbose
```

### 3. Regular Updates

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Keep Docker updated
sudo apt upgrade docker-ce docker-ce-cli containerd.io

# Update runner regularly (check for updates)
```

### 4. Monitor Runner Activity

```bash
# Check runner status regularly
cd ~/actions-runner
sudo ./svc.sh status

# Monitor logs
journalctl -u actions.runner.* -f
```

### 5. Limit Runner Access

In GitHub repository settings:
- Limit which workflows can use the runner
- Use runner labels for specific jobs
- Review runner activity regularly

---

## Step 10: Advanced Configuration

### Multiple Runners

Run multiple runners on the same server for parallel jobs:

```bash
# Create second runner
mkdir actions-runner-2 && cd actions-runner-2
# ... follow same installation steps with different name
```

### Runner Labels

Add custom labels during configuration:

```bash
./config.sh --url ... --token ... --labels linux,docker,local
```

Use in workflow:
```yaml
runs-on: [self-hosted, linux, docker]
```

### Resource Limits

Limit Docker container resources:

```yaml
- name: Deploy container
  run: |
    docker run -d \
      --name todo-react-app \
      --memory="256m" \
      --cpus="0.5" \
      -p 80:80 \
      todo-react-app:latest
```

### Notifications

Add notification steps to workflow:

```yaml
- name: Send notification
  if: always()
  run: |
    curl -X POST https://your-webhook-url \
      -d "status=${{ job.status }}" \
      -d "commit=${{ github.sha }}"
```

---

## Summary Checklist

Before first deployment:

- [ ] Docker installed (`docker --version`)
- [ ] Runner installed and configured
- [ ] Runner service running (`sudo ./svc.sh status`)
- [ ] Runner shows online (green) in GitHub
- [ ] Workflow file exists (`.github/workflows/deploy-self-hosted.yml`)
- [ ] Port available on server (`sudo netstat -tlnp | grep :80`)

After deployment:

- [ ] Workflow completed successfully
- [ ] Container running (`docker ps | grep todo-react-app`)
- [ ] Application accessible (`curl http://localhost:80`)
- [ ] No errors in logs (`docker logs todo-react-app`)

---

## Support & Resources

**Workflow File:** `.github/workflows/deploy-self-hosted.yml`

**Key Features:**
- ✅ No SSH required
- ✅ No port forwarding needed
- ✅ 3-retry logic for deployment
- ✅ Automatic backup before deployment
- ✅ Automatic rollback on failure
- ✅ Health checks and verification
- ✅ Automatic cleanup

**Common Commands:**

```bash
# Runner Management
cd ~/actions-runner
sudo ./svc.sh status|start|stop|restart

# Container Management
docker ps                          # List running containers
docker logs todo-react-app         # View logs
docker restart todo-react-app      # Restart container
docker stop todo-react-app         # Stop container

# Cleanup
docker system prune -a             # Clean unused Docker resources
docker images                      # List images
```

**Need Help?**
1. Check GitHub Actions logs
2. Check runner logs: `journalctl -u actions.runner.* -f`
3. Check container logs: `docker logs todo-react-app`
4. Verify runner status in GitHub

---

## Why Choose Self-Hosted Runner?

### Advantages:

✅ **Simplicity** - No SSH keys, no port forwarding, no network complexity
✅ **Security** - No open ports, no public exposure, runner behind firewall
✅ **Speed** - Everything runs locally, no file transfers
✅ **Reliability** - No network dependencies for deployment
✅ **Cost** - Free, no GitHub Actions minutes consumed
✅ **Flexibility** - Full control over environment and resources

### When to Use:

- Local development servers
- Behind corporate firewalls
- VPN-only environments
- Home labs and personal projects
- When you can't expose ports
- When SSH setup is too complex

### When NOT to Use:

- Production deployments (use cloud runners)
- If server is frequently offline
- If server has no internet access
- Multiple remote servers (use SSH approach)

---

🎉 **You're all set!** Your self-hosted runner will automatically deploy your app whenever you push to GitHub - all running locally on your server with zero network complexity!
