# Fayrouza Ad AI Detector — VPS Deployment Guide (Docker)

## Overview

This guide deploys **only the backend** using Docker. The frontend is not hosted (it is for local testing only).

What runs on the VPS:
- **backend** — Node.js API on port `3001`
- **redis** — Job queue (managed by Docker Compose, no manual install needed)
- **Nginx** — Reverse proxy with SSL in front of port `3001`

Assumed OS: **Ubuntu 22.04 LTS**

> **Note:** This guide assumes you SSH in as `ubuntu`. All system commands use `sudo`. If you log in as `root`, drop the `sudo`.

---

## Part 0 — Fresh VPS Prerequisites

```bash
ssh ubuntu@54.38.240.143

# Update everything first
sudo apt update && sudo apt upgrade -y

# Install basic tools that may be missing on a fresh VPS
sudo apt install -y git curl nano ufw

# Make sure SSH stays open when we enable the firewall later
sudo ufw allow OpenSSH
```

---

## Part 1 — Install Docker on the VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version

# Allow the ubuntu user to run docker without sudo (log out and back in after)
sudo usermod -aG docker $USER
```

> **Important:** After `usermod`, run `exit` and SSH back in so the group change takes effect. Verify with `groups` — you should see `docker` in the list.

---

## Part 2 — Install Nginx and Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo ufw allow 'Nginx Full'
sudo ufw enable   # confirm with "y" when prompted
```

---

## Part 3 — Clone the Project

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/mgsay41/fayrouza-ad-ai-detector.git
cd fayrouza-ad-ai-detector/backend
```

---

## Part 4 — Configure the Backend `.env`

```bash
cp .env.example .env
nano .env
```

Fill in every value. Do **not** change `REDIS_HOST` — Docker Compose overrides it automatically to `redis` (the container name).

```dotenv
PORT=3001
NODE_ENV=production

# Generate strong keys with: openssl rand -hex 32
WEBHOOK_API_KEY=fyr_wh_your_strong_key_here
INTERNAL_API_KEY=fyr_int_your_strong_key_here
ADMIN_API_KEY=fyr_adm_your_strong_key_here

# Get your key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# The Fayrouza Laravel app base URL
FAYROUZA_API_URL=https://fayrouza.sdevelopment.tech/api

# A valid Bearer token from the Fayrouza Laravel app (see Part 8 below)
FAYROUZA_SERVICE_TOKEN=your_fayrouza_service_token_here

# Redis — leave as-is, Docker Compose overrides REDIS_HOST to "redis"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Thresholds
SCORE_AUTO_APPROVE=80
SCORE_NEEDS_REVIEW=40

# How many ads the queue processes in parallel (1–6). Use 1 for free Gemini tier, up to 6 for paid.
QUEUE_CONCURRENCY=1

# Currency shown to Gemini in price context. Examples: EGP, SAR, USD, AED
MARKETPLACE_CURRENCY=EGP

# Lock CORS down to the Laravel app domain after testing
CORS_ALLOWED_ORIGINS=*
```

---

## Part 5 — Start the Backend with Docker Compose

```bash
cd /var/www/fayrouza-ad-ai-detector/backend

# Build and start in background
docker compose up -d --build

# Watch logs
docker compose logs -f backend

# Verify health
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","uptime":12.3,"timestamp":"...","queue":{"waiting":0,"active":0,"completed":0,"failed":0,"delayed":0}}
```

---

## Part 6 — Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/ad-detector
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ad-detector /etc/nginx/sites-enabled/
sudo nginx -t          # must say "syntax is ok"
sudo systemctl reload nginx
```

---

## Part 7 — SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot patches the Nginx config automatically. Auto-renewal is configured automatically.

Test the live backend:

```bash
curl https://yourdomain.com/health
```

---

## Part 8 — Updating the App (after code changes)

```bash
cd /var/www/fayrouza-ad-ai-detector/backend
git pull
docker compose up -d --build   # rebuilds image and restarts container
docker compose logs -f backend  # watch for errors
```

---

## Deployment Checklist

| Step | Command / Check |
|------|----------------|
| Docker running | `docker compose ps` — both `redis` and `backend` should be `Up` |
| Backend health | `curl https://yourdomain.com/health` |
| SSL valid | Browser shows padlock |
| Test sync endpoint | `curl -X POST https://yourdomain.com/webhook/moderate -H "X-API-Key: ..." -H "Content-Type: application/json" -d '{"title":"test","description":"test ad","price":100,"category":"General"}'` |
