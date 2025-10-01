# Direct Nginx Deployment Guide

## 🚀 Deploying Veloce Marketplace with Direct Nginx (No Docker)

### Prerequisites
- Ubuntu/Debian VPS
- Node.js 18+ installed
- Nginx installed
- PM2 for process management
- Git configured

### Step 1: Initial Setup

```bash
# Clone your repository
git clone <your-repo-url> /var/www/veloce
cd /var/www/veloce

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build frontend
npm run build
```

### Step 2: Configure Nginx

Create `/etc/nginx/sites-available/veloce`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend (React app)
    location / {
        root /var/www/veloce/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Document uploads
    location /uploads/ {
        alias /var/www/veloce/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/veloce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Setup PM2 for Backend

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'veloce-backend',
    script: './backend/dist/src/main.js',
    cwd: '/var/www/veloce',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'your-prisma-accelerate-url'
    }
  }]
}
EOF

# Start the backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Deployment Process (Safe for Data)

```bash
# 1. Pull latest changes (documents are safe - in .gitignore)
git pull origin main

# 2. Install/update dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Build frontend
npm run build

# 4. Build backend
npm run build

# 5. Restart backend (documents persist)
pm2 restart veloce-backend

# 6. Reload nginx (no impact on data)
sudo systemctl reload nginx
```

### Step 5: Data Persistence Verification

#### Database (Prisma Accelerate)
- ✅ **Location**: Cloud-hosted PostgreSQL
- ✅ **Git Pull Impact**: ZERO
- ✅ **Server Restart Impact**: ZERO

#### Documents
- ✅ **Location**: `/var/www/veloce/backend/uploads/`
- ✅ **Git Pull Impact**: ZERO (in .gitignore)
- ✅ **Server Restart Impact**: ZERO (files on disk)

### Step 6: Backup Strategy

```bash
# Create backup script
cat > backup-veloce.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/veloce-$DATE"

mkdir -p "$BACKUP_DIR"
cp -r /var/www/veloce/backend/uploads "$BACKUP_DIR/"
tar -czf "/var/backups/veloce-$DATE.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup created: /var/backups/veloce-$DATE.tar.gz"
EOF

chmod +x backup-veloce.sh

# Schedule daily backups
echo "0 2 * * * /var/www/veloce/backup-veloce.sh" | crontab -
```

## ✅ **Data Safety Guarantee**

With this setup:
- **Database**: Cloud-hosted (Prisma Accelerate) - Always safe
- **Documents**: Local filesystem + .gitignore - Always safe
- **Git Pull**: Only updates code, never touches data
- **Server Restart**: Only restarts services, data persists

Your data is **100% safe** during deployments! 🎉
