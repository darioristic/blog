#!/bin/bash

# Server Configuration
SERVER_IP="116.203.149.70"
SERVER_USER="root"

echo "Setting up server environment on $SERVER_IP..."

ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
  # Update package list
  apt-get update

  # Install curl if missing
  apt-get install -y curl git build-essential

  # Install Node.js (LTS)
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  else
    echo "Node.js is already installed"
  fi

  # Install pnpm
  if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
  else
    echo "pnpm is already installed"
  fi

  # Install PM2
  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
  else
    echo "PM2 is already installed"
  fi

  # Verify versions
  node -v
  npm -v
  pnpm -v
  pm2 -v
EOF
