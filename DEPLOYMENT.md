# Deployment Guide

This guide covers deploying the PeakNorth Blog Automation System to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin UI      │    │   Server API     │    │   n8n Instance  │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Automation)  │
│                 │    │                  │    │                 │
│ React + Vite    │    │ Node.js + Express│    │ Self-hosted     │
│ Static Deploy   │    │ Serverless/VPS   │    │ or Cloud        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         └────────────────────────▼───────────────────────┘
                              Firebase
                              Firestore
```

## 🚀 Quick Deploy Options

### Option 1: Full Cloud (Recommended)

- **Frontend**: Vercel/Netlify
- **Backend**: Railway/Vercel Functions
- **Database**: Firebase Firestore
- **Automation**: n8n Cloud

### Option 2: Hybrid

- **Frontend**: Vercel/Netlify
- **Backend**: VPS (DigitalOcean/Linode)
- **Database**: Firebase Firestore
- **Automation**: Self-hosted n8n

### Option 3: Self-hosted

- **All components**: Your own VPS/server

## 🔥 Firebase Setup

### 1. Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init firestore
```

### 2. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection
    match /posts/{postId} {
      allow read, write: if request.auth != null;
    }

    // Ideas collection
    match /ideas/{ideaId} {
      allow read, write: if request.auth != null;
    }

    // Settings collection
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Initial Data Setup

```javascript
// Create settings/cadence document
{
  "intervalDays": 2,
  "publishHour": 10,
  "timezone": "America/Toronto",
  "draftLeadHours": 24,
  "reminderHours": 4
}
```

## 🖥️ Frontend Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Netlify Deployment

```bash
# Build locally
npm run build

# Deploy dist folder to Netlify
# Or connect GitHub repository for auto-deploy
```

### Manual Static Hosting

```bash
npm run build
# Upload dist/ folder to any static hosting service
```

## 🖧 Backend Deployment

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables in Railway dashboard
```

### Vercel Functions

Create `api/` directory structure:

```
api/
  posts/
    index.ts
    [id].ts
  ideas/
    index.ts
  publish/
    ready.ts
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: peaknorth-blog-api
services:
  - name: api
    source_dir: /server
    github:
      repo: your-username/peaknorth-admin
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: FIREBASE_PROJECT_ID
        value: your-project-id
```

### Traditional VPS Deployment

```bash
# On your server
git clone https://github.com/your-username/peaknorth-admin.git
cd peaknorth-admin/server

# Install dependencies
npm install

# Build
npm run build

# Setup PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name peaknorth-api

# Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/peaknorth-api

# SSL with Let's Encrypt
sudo certbot --nginx -d api.peaknorth.com
```

## 🤖 n8n Setup

### n8n Cloud (Easiest)

1. Sign up at [n8n.cloud](https://n8n.cloud)
2. Import workflow JSON files
3. Configure credentials
4. Set environment variables
5. Activate workflows

### Using n8n Cloud (Recommended)

Since you're using n8n Cloud, no additional deployment is needed for n8n itself. Just ensure your workflows are:

1. Imported correctly
2. Credentials configured  
3. Environment variables set
4. Workflows activated

### n8n Configuration

1. **Import Workflows**: Upload JSON files from `n8n-workflows/`
2. **Set Credentials**:
   - HTTP Header Auth (N8N API Key)
   - HTTP Header Auth (OpenAI API Key)
   - SMTP (for notifications)
3. **Environment Variables**:
   - `SERVER_URL`: Your API server URL
   - `FRONTEND_URL`: Your admin dashboard URL
4. **Activate Workflows**: Turn on both workflows

## 🔒 Security Checklist

### Firebase Security

- [ ] Enable App Check
- [ ] Configure proper Firestore rules
- [ ] Enable audit logging
- [ ] Set up backup schedules

### API Security

- [ ] Use HTTPS only
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use secure API keys
- [ ] Enable CORS properly
- [ ] Set up monitoring/alerting

### n8n Security

- [ ] Enable authentication
- [ ] Use secure webhooks
- [ ] Protect credential access
- [ ] Regular security updates
- [ ] Monitor execution logs

## 📊 Monitoring & Observability

### Application Monitoring

```javascript
// Add to your server
const express = require("express");
const app = express();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  // Return Prometheus metrics or custom metrics
});
```

### Log Aggregation

- Use structured logging (JSON)
- Centralize logs (ELK stack, DataDog, etc.)
- Set up alerts for errors
- Monitor API response times
- Track workflow execution success rates

### Key Metrics to Monitor

- Post creation success rate
- Publishing success rate
- API response times
- OpenAI API usage and costs
- User engagement with admin dashboard

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy PeakNorth Blog System

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: cd server && npm ci
      - run: cd server && npm run build
      # Deploy to your chosen platform
```

## 🧪 Testing in Production

### Smoke Tests

```bash
# Test API endpoints
curl https://your-api-domain.com/health
curl -H "x-api-key: your-key" https://your-api-domain.com/api/posts

# Test n8n workflows
# Manually trigger workflows in n8n interface

# Test admin dashboard
# Visit your frontend URL and test key features
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load test config
# artillery.yml
config:
  target: 'https://your-api-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "API Health Check"
    requests:
      - get:
          url: "/health"

# Run load test
artillery run artillery.yml
```

## 📋 Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Firebase project configured and accessible
- [ ] API endpoints responding correctly
- [ ] Admin dashboard loads and functions
- [ ] n8n workflows imported and active
- [ ] Email notifications working
- [ ] SSL certificates installed and valid
- [ ] Monitoring and alerting configured
- [ ] Backup procedures in place
- [ ] Documentation updated with production URLs

## 🆘 Troubleshooting

### Common Issues

1. **CORS errors**: Check FRONTEND_URL environment variable
2. **Firebase permission errors**: Verify service account key
3. **n8n workflow failures**: Check API keys and endpoints
4. **Email not sending**: Verify SMTP configuration

### Debug Commands

```bash
# Check server logs
pm2 logs peaknorth-api

# Test API connectivity
curl -v https://your-api-domain.com/health

# Check n8n workflow status
# Use n8n interface to view execution history
```

---

**Deployment Complete! 🎉**

Your PeakNorth Blog Automation System should now be running in production. Monitor the system closely for the first few days and adjust configurations as needed.
