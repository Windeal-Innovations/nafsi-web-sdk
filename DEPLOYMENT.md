# Nafsi Web SDK - Deployment Guide

This guide covers deployment methods for the Nafsi Web SDK:
1. CDN Deployment (Express Server)
2. Docker Deployment (Recommended for Production)
3. GitHub Actions CI/CD
4. NPM Package Publishing

---

## Method 1: CDN Deployment (Express Server)

### Prerequisites
- Node.js 14+ installed
- Domain configured with SSL (HTTPS required for camera access)
- Port 4413 accessible (or configure different port)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the SDK**
   ```bash
   npm run build
   ```
   This creates `dist/nafsi.js` (32KB minified)

3. **Start the CDN Server**
   ```bash
   npm start
   ```
   Or build and start in one command:
   ```bash
   npm run cdn
   ```

### Server Configuration

The Express server (`server.js`) provides:
- **SDK Endpoint**: `https://sdk.nafsi.ai/v1/nafsi.js`
- **Source Map**: `https://sdk.nafsi.ai/v1/nafsi.js.map`
- **Version Info**: `https://sdk.nafsi.ai/v1/version`
- **Health Check**: `https://sdk.nafsi.ai/health`

Default port: 4413 (configure via `PORT` environment variable)

### Production Deployment

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start server.js --name nafsi-sdk-cdn

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitor logs
pm2 logs nafsi-sdk-cdn

# Restart after updates
pm2 restart nafsi-sdk-cdn
```

#### Using systemd
Create `/etc/systemd/system/nafsi-sdk-cdn.service`:
```ini
[Unit]
Description=Nafsi SDK CDN Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/nafsi-web-sdk
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=4413

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable nafsi-sdk-cdn
sudo systemctl start nafsi-sdk-cdn
sudo systemctl status nafsi-sdk-cdn
```

#### Using Docker (Basic)
Build and run locally:
```bash
docker build -t nafsi-sdk-cdn .
docker run -d -p 4413:4413 --name nafsi-sdk nafsi-sdk-cdn
```

Or use docker-compose:
```bash
docker-compose up -d
```

See **Method 2: Docker Deployment** below for production setup.

### Nginx Reverse Proxy (Optional)

Configure Nginx to proxy requests to the Express server:

```nginx
server {
    listen 443 ssl http2;
    server_name sdk.nafsi.ai;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:4413;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (handled by Express, but can add here too)
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

### Environment Variables

```bash
PORT=4413                    # Server port (default: 4413)
NODE_ENV=production          # Environment mode
```

### Testing the Deployment

After deployment, test with:

```bash
# Check health
curl https://sdk.nafsi.ai/health

# Check version
curl https://sdk.nafsi.ai/v1/version

# Download SDK
curl https://sdk.nafsi.ai/v1/nafsi.js

# Test in browser
<script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
<script>
  console.log('Nafsi SDK loaded:', typeof Nafsi !== 'undefined');
  console.log('Version:', Nafsi.getVersion());
</script>
```

### Monitoring

Monitor server health:
```bash
# Check process
pm2 status
pm2 logs nafsi-sdk-cdn

# Check uptime
curl https://sdk.nafsi.ai/health

# Monitor access logs
tail -f /var/log/nginx/access.log
```

---

## Method 2: Docker Deployment (Production)

### Prerequisites
- Docker installed on server
- Docker Compose installed
- GitHub Container Registry access (for CI/CD)

### Local Docker Build

The included `Dockerfile` builds a production-ready image:

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Install build dependencies temporarily
RUN npm install --only=dev

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 4413
CMD ["npm", "run", "start"]
```

Build and run:
```bash
# Build image
docker build -t nafsi-web-sdk .

# Run container
docker run -d \
  -p 4413:4413 \
  -e NODE_ENV=production \
  -e PORT=4413 \
  --name nafsi-web-sdk \
  --restart unless-stopped \
  nafsi-web-sdk

# Check logs
docker logs -f nafsi-web-sdk

# Check health
curl http://localhost:4413/health
```

### Using Docker Compose

The included `docker-compose.yml` provides:
- Automatic restarts
- Health checks
- Log rotation
- Production environment variables

```yaml
version: '3.8'

services:
  nafsi-web-sdk:
    image: ghcr.io/windeal-innovations/nafsi-web-sdk:latest
    container_name: nafsi-web-sdk
    restart: unless-stopped
    ports:
      - "4413:4413"
    environment:
      - NODE_ENV=production
      - PORT=4413
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4413/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Start services:
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Production Server Setup

On your production server (e.g., `/opt/stack`):

1. **Create directory structure:**
   ```bash
   sudo mkdir -p /opt/stack
   cd /opt/stack
   ```

2. **Copy docker-compose.yml to server:**
   ```bash
   # On your local machine
   scp docker-compose.yml user@server:/opt/stack/
   ```

3. **Login to GitHub Container Registry:**
   ```bash
   # On the server
   echo $GHCR_PAT | docker login ghcr.io -u USERNAME --password-stdin
   ```

4. **Pull and start:**
   ```bash
   cd /opt/stack
   docker-compose pull nafsi-web-sdk
   docker-compose up -d nafsi-web-sdk
   ```

5. **Verify deployment:**
   ```bash
   docker-compose ps
   docker-compose logs nafsi-web-sdk
   curl http://localhost:4413/health
   ```

### Docker Commands Reference

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Stop container
docker stop nafsi-web-sdk

# Start container
docker start nafsi-web-sdk

# Restart container
docker restart nafsi-web-sdk

# Remove container
docker rm nafsi-web-sdk

# View logs (last 100 lines)
docker logs --tail 100 nafsi-web-sdk

# Follow logs in real-time
docker logs -f nafsi-web-sdk

# Execute command in container
docker exec -it nafsi-web-sdk sh

# Inspect container
docker inspect nafsi-web-sdk

# View resource usage
docker stats nafsi-web-sdk

# Clean up unused images
docker image prune -f

# Clean up everything unused
docker system prune -af
```

---

## Method 3: GitHub Actions CI/CD

### Overview

Automated deployment pipeline that:
1. Builds Docker image on every push to `main`
2. Pushes to GitHub Container Registry (GHCR)
3. Deploys to production server via SSH

### Setup GitHub Secrets

Add these secrets in your GitHub repo (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `GHCR_PAT` | GitHub Personal Access Token with `write:packages` permission | `ghp_xxxxxxxxxxxx` |
| `SERVER_IP` | Production server IP address or domain | `123.45.67.89` or `server.nafsi.ai` |
| `SERVER_USER` | SSH username for server | `ubuntu` or `deploy` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----` |

### Creating GitHub Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `write:packages` - Upload packages to GitHub Package Registry
   - `read:packages` - Download packages from GitHub Package Registry
4. Click "Generate token"
5. Copy the token and add it as `GHCR_PAT` secret

### Generating SSH Key for Server

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@server

# Copy private key content to GitHub secret
cat ~/.ssh/github_actions_deploy
# Copy the entire output including BEGIN and END lines
```

### Workflow File

The workflow is defined in `.github/workflows/deploy.yaml`:

```yaml
name: Build & Deploy Nafsi Web SDK

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: windeal-innovations/nafsi-web-sdk

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Login to GHCR
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GHCR_PAT }}

    - name: Build & Push Image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

    - name: Deploy on Server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.SERVER_IP }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          docker login ${{ env.REGISTRY }} -u ${{ github.actor }} -p ${{ secrets.GHCR_PAT }}
          cd /opt/stack
          docker compose pull nafsi-web-sdk
          docker compose up -d nafsi-web-sdk
          docker image prune -f
```

### Deployment Workflow

1. **Make changes to code:**
   ```bash
   git add .
   git commit -m "Update SDK"
   git push origin main
   ```

2. **GitHub Actions automatically:**
   - Checks out code
   - Logs into GitHub Container Registry
   - Builds Docker image
   - Tags with `latest` and commit SHA
   - Pushes to GHCR
   - SSHs into production server
   - Pulls latest image
   - Restarts container with new image
   - Cleans up old images

3. **Monitor deployment:**
   - Go to GitHub repo → Actions tab
   - Click on the running workflow
   - View real-time logs

### Testing the Workflow

```bash
# Make a test change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main

# Watch in GitHub Actions tab
# Or monitor from command line:
gh run watch
```

### Rollback to Previous Version

If deployment fails, rollback to a specific commit:

```bash
# On the server
cd /opt/stack

# Find the commit SHA you want to rollback to
# (check GitHub Actions runs or git log)

# Pull specific version
docker pull ghcr.io/windeal-innovations/nafsi-web-sdk:COMMIT_SHA

# Update docker-compose.yml to use specific tag
# Then restart
docker-compose up -d
```

Or rollback via GitHub Actions:

```bash
# Revert the commit locally
git revert HEAD
git push origin main

# GitHub Actions will deploy the reverted version
```

### Troubleshooting CI/CD

**Build fails:**
- Check GitHub Actions logs
- Verify Dockerfile syntax
- Ensure all files are committed

**Push to GHCR fails:**
- Verify `GHCR_PAT` secret is set correctly
- Check PAT has `write:packages` permission
- Ensure PAT hasn't expired

**SSH deployment fails:**
- Verify `SERVER_IP`, `SERVER_USER`, `SERVER_SSH_KEY` secrets
- Test SSH manually: `ssh -i ~/.ssh/key user@server`
- Check server firewall allows SSH (port 22)

**Container won't start on server:**
- Check logs: `docker-compose logs nafsi-web-sdk`
- Verify port 4413 is available: `lsof -i :4413`
- Check disk space: `df -h`

---

## Method 4: NPM Package Publishing

### Prerequisites
- NPM account (create at https://www.npmjs.com)
- Logged in to npm CLI: `npm login`

### Publishing Steps

1. **Prepare for Publishing**

   Ensure package.json is configured:
   - ✅ `name`: "nafsi-web-sdk"
   - ✅ `version`: "1.0.0"
   - ✅ `main`: "dist/nafsi.js"
   - ✅ `files`: ["dist/", "README.md", "LICENSE"]
   - ✅ `prepublishOnly`: Builds automatically before publishing

2. **Build the SDK**
   ```bash
   npm run build
   ```

3. **Test the Package Locally**
   ```bash
   # Create tarball
   npm pack

   # Test installation in another project
   cd /path/to/test-project
   npm install /path/to/nafsi-web-sdk/nafsi-web-sdk-1.0.0.tgz
   ```

4. **Publish to NPM**

   First time (public package):
   ```bash
   npm publish --access public
   ```

   Updates:
   ```bash
   # Patch version (1.0.0 -> 1.0.1)
   npm version patch
   npm publish

   # Minor version (1.0.0 -> 1.1.0)
   npm version minor
   npm publish

   # Major version (1.0.0 -> 2.0.0)
   npm version major
   npm publish
   ```

5. **Verify Publication**
   ```bash
   # Check on NPM
   npm view nafsi-web-sdk

   # View package page
   https://www.npmjs.com/package/nafsi-web-sdk
   ```

### Using the NPM Package

After publishing, users can install via npm:

```bash
npm install nafsi-web-sdk
```

#### ES Modules / Import
```javascript
import Nafsi from 'nafsi-web-sdk';

Nafsi.init({
  workflowId: 'your-workflow-id',
  clientId: 'your-client-id',
  onSuccess: (result) => console.log('Success:', result),
  onFailure: (error) => console.error('Error:', error)
});

Nafsi.start();
```

#### CommonJS / Require
```javascript
const Nafsi = require('nafsi-web-sdk');

Nafsi.init({
  workflowId: 'your-workflow-id',
  clientId: 'your-client-id',
  onSuccess: (result) => console.log('Success:', result),
  onFailure: (error) => console.error('Error:', error)
});

Nafsi.start();
```

#### Script Tag (from node_modules)
```html
<script src="node_modules/nafsi-web-sdk/dist/nafsi.js"></script>
<script>
  Nafsi.init({
    workflowId: 'your-workflow-id',
    clientId: 'your-client-id',
    onSuccess: (result) => console.log('Success:', result),
    onFailure: (error) => console.error('Error:', error)
  });
</script>
```

### Package Update Workflow

When making updates:

1. Make code changes in `src/`
2. Update version: `npm version patch|minor|major`
3. Build: `npm run build`
4. Publish: `npm publish`
5. Tag release: `git tag v1.0.1 && git push --tags`

---

## Comparison: CDN vs NPM

| Feature | CDN Deployment | NPM Package |
|---------|----------------|-------------|
| **Installation** | `<script>` tag | `npm install` |
| **Updates** | Instant (refresh) | Manual update |
| **Versioning** | URL-based (/v1/) | package.json |
| **Bundling** | No bundler needed | Bundled with app |
| **Caching** | CDN edge caching | Local caching |
| **Best For** | Quick integration | Build pipelines |
| **Control** | Your server | NPM registry |

### Recommended Approach

**Use Both:**
- **CDN** for simple integrations and quick demos
- **NPM** for production apps with build pipelines

---

## Security Considerations

1. **HTTPS Required**: Camera API requires secure context
2. **CORS Configuration**: Server allows all origins (adjust if needed)
3. **Content Security Policy**: Add CSP headers if needed
4. **Rate Limiting**: Consider adding rate limiting in production
5. **Version Pinning**: Users should pin SDK versions in production

---

## Troubleshooting

### CDN Server Won't Start
- Check port availability: `lsof -i :4413`
- Verify dist/nafsi.js exists: `ls -lh dist/nafsi.js`
- Check logs: `pm2 logs nafsi-sdk-cdn`

### NPM Publish Fails
- Verify npm login: `npm whoami`
- Check package name availability: `npm view nafsi-web-sdk`
- Ensure version is updated: `npm version patch`
- Check .npmignore isn't excluding dist/

### SDK Not Loading
- Verify HTTPS (required for camera)
- Check CORS headers in browser console
- Verify Content-Type: `application/javascript`
- Check file size: Should be ~32KB

---

## Support

- Issues: https://github.com/nafsi-ai/nafsi-web-sdk/issues
- Documentation: https://nafsi.ai/docs
- Email: support@nafsi.ai
