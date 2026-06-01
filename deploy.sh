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
  # Fix permissions initially to ensure the site user can work
  chown -R $SITE_USER:$SITE_USER $REMOTE_DIR
  chmod -R 755 $REMOTE_DIR

  # Run everything as the site user
  sudo -u $SITE_USER -i << 'SUDO_EOF'
    cd $REMOTE_DIR
    
    # Export env vars for the site user's session
    export NEXT_TELEMETRY_DISABLED=1
    export CI=true # Avoid pnpm TTY abort when removing modules dir
    export PATH=\$PATH:/usr/local/bin:/usr/bin:/bin # Ensure pnpm/node are in path

    # Install dependencies
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile

    # Build application
    echo "Building application..."
    pnpm build

    # Fix for standalone mode: copy static assets
    echo "Copying static assets for standalone mode..."
    mkdir -p .next/standalone/.next/
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/

    # Start/Restart with PM2
    echo "Starting with PM2..."
    pm2 delete $SITE_USER || true
    
    # Next.js standalone server needs PORT env var
    REDIS_URL="redis://127.0.0.1:6379" PORT=3001 pm2 start .next/standalone/server.js --name $SITE_USER
    
    # Restart Umami
    echo "Starting Umami..."
    pm2 delete umami || true
    cd $REMOTE_DIR/umami
    mkdir -p .next/standalone/umami/public
    cp -r public/* .next/standalone/umami/public/ 2>/dev/null || true
    cp -r .next/static .next/standalone/umami/.next/ 2>/dev/null || true
    
    DATABASE_URL="mysql://umami:umami_password_secure_123@127.0.0.1:3306/umami" PORT=3002 BASE_PATH="/umami" pm2 start .next/standalone/umami/server.js --name umami
    
    pm2 save
SUDO_EOF

  # Final permission check as root
  chown -R $SITE_USER:$SITE_USER $REMOTE_DIR
  chmod -R 755 $REMOTE_DIR
EOF

echo "Deployment complete! App should be running on http://$SERVER_IP:3001"
