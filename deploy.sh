#!/bin/bash

# Configuration
SERVER_USER="root"
SERVER_IP="116.203.149.70"
REMOTE_DIR="/home/darioristic/htdocs/darioristic.com"
SITE_USER="darioristic"

echo "Deploying to $SERVER_USER@$SERVER_IP..."

# Create directory on server
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Sync files (excluding node_modules, .git, .next, etc.)
echo "Syncing files..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude '.env.local' \
  --exclude '.DS_Store' \
  --exclude 'umami' \
  . $SERVER_USER@$SERVER_IP:$REMOTE_DIR

# Fix permissions
echo "Fixing permissions..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "chown -R $SITE_USER:$SITE_USER $REMOTE_DIR"

# Run build and restart on server
echo "Building and restarting application..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
  cd $REMOTE_DIR
  
  # Install dependencies
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile

  # Build application
  echo "Building application..."
  # Set environment variables for build if needed, or rely on .env file if synced (but we excluded .env.local)
  # Ideally, we should set env vars here or use a .env file on the server.
  # For now, let's assume we might need to copy .env.local manually or set them.
  # But since we are moving from Vercel, we need Redis credentials.
  
  # Export env vars for build
  export NEXT_TELEMETRY_DISABLED=1
  
  pnpm build

  # Start/Restart with PM2
  echo "Starting with PM2..."
  if pm2 list | grep -q "darioristic-web"; then
    # Update environment and arguments (port)
    pm2 delete darioristic-web
    REDIS_URL="redis://127.0.0.1:6379" pm2 start npm --name "darioristic-web" -- start -- --port 3001
  else
    REDIS_URL="redis://127.0.0.1:6379" pm2 start npm --name "darioristic-web" -- start -- --port 3001
  fi
  
  pm2 save
EOF

echo "Deployment complete! App should be running on http://$SERVER_IP:3001"
