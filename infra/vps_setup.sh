#!/usr/bin/env bash
set -euo pipefail

# Ubuntu basic hardening for Coolify host
sudo apt update
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "UFW enabled. Verify with: sudo ufw status"
