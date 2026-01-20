# Local Server Deployment Setup Guide

This guide will help you integrate your local server with GitHub Actions for automated deployment.

## Prerequisites

- ✅ Terminus installed and SSH connection to local server working
- ✅ Docker installed on your local server
- ✅ GitHub repository with push access
- ✅ Docker Hub account

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

# Add your user to docker group (replace 'username' with your actual username)
sudo usermod -aG docker $USER

# Verify Docker installation
docker --version
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

## Step 2: Generate SSH Key Pair for GitHub Actions

### 2.1 On Your Local Server

```bash
# Generate a new SSH key pair (don't use a passphrase)
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# Display the public key (you'll need this for Step 2.2)
cat ~/.ssh/github_actions_key.pub

# Display the private key (you'll need this for Step 3)
cat ~/.ssh/github_actions_key
```

### 2.2 Add Public Key to Authorized Keys

```bash
# Add the public key to authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2.3 Get Your Server Information

```bash
# Get your server IP or hostname
hostname -I
# OR
ifconfig
# OR
ip addr show

# Get your username
whoami
```

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add the following secrets:

### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `myusername` |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token | `dckr_pat_xxxxx` |
| `SSH_PRIVATE_KEY` | Private key content from `~/.ssh/github_actions_key` | Paste entire key including `-----BEGIN` and `-----END` lines |
| `SERVER_HOST` | Your local server IP or hostname | `192.168.1.100` or `server.local` |
| `SERVER_USER` | Your server username | `ubuntu` or your username |
| `APP_PORT` | Port to expose the application (optional, default: 80) | `8080` |

### How to Add Each Secret:

1. Click **"New repository secret"**
2. Enter the **Name** (e.g., `DOCKER_USERNAME`)
3. Paste the **Value**
4. Click **"Add secret"**
5. Repeat for all secrets

## Step 4: Configure GitHub Actions Runner (Self-Hosted - Optional)

If GitHub Actions can't reach your local server directly (behind firewall/NAT), you have two options:

### Option A: Use GitHub's Hosted Runners with SSH (Recommended)

This is already configured in the workflow. Just ensure:
- Your server has a public IP or is accessible via VPN/tunnel
- SSH port (22) is open in your firewall
- Or use ngrok/cloudflare tunnel to expose SSH

### Option B: Set Up Self-Hosted Runner

```bash
# On your local server, follow GitHub's instructions:
# Settings → Actions → Runners → New self-hosted runner

# Example for Linux:
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (use the token from GitHub)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN

# Install and start as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

## Step 5: Test the Deployment

### 5.1 Make a Test Commit

```bash
# In your local project directory
git add .
git commit -m "Test deployment to local server"
git push origin main
```

### 5.2 Monitor the Workflow

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Watch the workflow run
4. Check each job: Build → Test → Deploy → Deploy to Local Server

### 5.3 Verify Deployment on Server

```bash
# SSH to your server
ssh your-user@your-server

# Check if container is running
docker ps | grep todo-react-app

# Check container logs
docker logs todo-react-app

# Test the application
curl http://localhost:80
# OR
curl http://localhost:8080  # if you set APP_PORT to 8080
```

### 5.4 Access Your Application

Open your browser and go to:
- `http://your-server-ip:80` (or the port you configured)
- `http://your-server-ip:8080`

## Step 6: Troubleshooting

### Issue: SSH Connection Failed

```bash
# On your local server, check SSH service
sudo systemctl status ssh

# Check SSH logs
sudo tail -f /var/log/auth.log

# Verify SSH key permissions
ls -la ~/.ssh/
```

### Issue: Docker Pull Failed

```bash
# Login to Docker Hub manually
docker login

# Try pulling manually
docker pull your-username/todo-react-app:latest
```

### Issue: Container Won't Start

```bash
# Check Docker logs
docker logs todo-react-app

# Check if port is already in use
sudo netstat -tlnp | grep :80

# Check Docker daemon
sudo systemctl status docker
```

### Issue: Firewall Blocking

```bash
# Check firewall status
sudo ufw status

# Allow port if needed
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
```

## Step 7: Workflow Features

Your deployment includes:

### ✅ Automated Build & Test
- Builds React app
- Runs unit tests
- Runs ESLint checks

### ✅ Docker Hub Push with Retry
- Pushes to Docker Hub with 3 retry attempts
- Tags: `latest`, commit SHA, and dated version

### ✅ Local Server Deployment with Retry
- Deploys to your local server with 3 retry attempts
- Automatic rollback on failure

### ✅ Rollback Strategy
- Automatically rolls back to previous commit if deployment fails
- Rebuilds and redeploys previous working version

### ✅ Health Checks
- Verifies container is running
- Checks application files
- Logs container status

## Step 8: Optional Enhancements

### Use ngrok for External Access (if server is behind NAT)

```bash
# Install ngrok
snap install ngrok

# Authenticate
ngrok authtoken YOUR_TOKEN

# Expose SSH port
ngrok tcp 22

# Use the forwarded address in GitHub secrets:
# SERVER_HOST: 0.tcp.ngrok.io
# Add port to SSH command in workflow if different from 22
```

### Set Up Domain Name

```bash
# Install nginx as reverse proxy
sudo apt install nginx

# Configure nginx to proxy to your Docker container
# Edit /etc/nginx/sites-available/todo-app
```

### Enable HTTPS

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## Step 9: Security Best Practices

1. **SSH Key Security**
   - Never commit private keys to repository
   - Use separate keys for different purposes
   - Rotate keys periodically

2. **Docker Security**
   - Keep Docker updated
   - Don't run containers as root unnecessarily
   - Scan images for vulnerabilities

3. **Firewall Configuration**
   - Only open necessary ports
   - Use fail2ban to prevent brute force attacks
   - Regularly review access logs

4. **GitHub Secrets**
   - Use access tokens instead of passwords where possible
   - Regularly rotate secrets
   - Limit repository access

## Support

If you encounter any issues:

1. Check GitHub Actions logs in the "Actions" tab
2. Check server logs: `docker logs todo-react-app`
3. Verify all secrets are correctly set
4. Test SSH connection manually: `ssh -i ~/.ssh/github_actions_key user@server`

## Workflow Files

- **Main Workflow**: `.github/workflows/deploy-to-local-server.yml`
- **Original Workflow** (Docker Hub only): `.github/workflows/actions.yml`

Both workflows include:
- Build and test automation
- Retry logic for network operations
- Rollback strategies
- Comprehensive error handling
