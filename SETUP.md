# Quick Setup Guide

Get your PeakNorth Blog Automation System running in 15 minutes.

## ⚡ Prerequisites

- Node.js 18+ installed
- Firebase account
- OpenAI API key
- n8n instance (cloud or self-hosted)

## 🚀 Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd peaknorth-admin

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Firestore Database
4. Go to Project Settings > General > Your apps
5. Add web app and copy config values
6. Go to Project Settings > Service Accounts
7. Generate private key (for server)

### 3. Configure Environment Variables

**Frontend** - Copy `env.template` to `.env`:

```bash
cp env.template .env
# Edit .env with your Firebase config
```

**Server** - Copy `server/env.template` to `server/.env`:

```bash
cp server/env.template server/.env
# Edit server/.env with your Firebase and API keys
```

### 4. Initialize Firestore Data

```bash
# Start the server
cd server
npm run dev

# In another terminal, add initial cadence config
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "status": "BRIEF",
    "brief": {
      "topic": "Test post",
      "persona": "Developers",
      "goal": "Test the system"
    }
  }'
```

Or manually add this document in Firebase Console:

- Collection: `settings`
- Document ID: `cadence`
- Data:

```json
{
  "intervalDays": 2,
  "publishHour": 10,
  "timezone": "America/Toronto",
  "draftLeadHours": 24,
  "reminderHours": 4
}
```

### 5. Start Development Servers

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

Visit http://localhost:5173 to access the admin dashboard.

### 6. Add Your First Blog Ideas

1. Go to http://localhost:5173/ideas
2. Click "Add Idea"
3. Fill in:
   - **Topic**: "How to automate blog writing with AI"
   - **Persona**: "Content creators and bloggers"
   - **Goal**: "Learn to set up automated blog systems"
   - **Priority**: High

Add 3-5 ideas to get started.

### 7. Setup n8n Workflows

#### Option A: n8n Cloud (Easiest)

1. Sign up at [n8n.cloud](https://n8n.cloud)
2. Create new workflow
3. Import `n8n-workflows/workflow-a-cadence-planner.json`
4. Import `n8n-workflows/workflow-b-publisher-runner.json`

#### Option B: n8n Cloud (Recommended)

1. Go to [n8n.cloud](https://n8n.cloud)
2. Create account and choose plan
3. Access your n8n Cloud instance

### 8. Configure n8n Credentials

1. **HTTP Header Auth** (for server API):

   - Name: "N8N API Key"
   - Header Name: "x-api-key"
   - Header Value: (value from server/.env N8N_SERVER_KEY)

2. **HTTP Header Auth** (for OpenAI):

   - Name: "OpenAI API Key"
   - Header Name: "Authorization"
   - Header Value: "Bearer sk-your-openai-key"

3. **SMTP** (for email notifications):
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: your-app-password

### 9. Set n8n Environment Variables

In n8n Settings > Environment Variables:

- `SERVER_URL`: http://localhost:3001 (or your server URL)
- `FRONTEND_URL`: http://localhost:5173 (or your frontend URL)

### 10. Test the System

#### Manual Test

1. Go to admin dashboard
2. Check that ideas appear in `/ideas`
3. Manually trigger Workflow A in n8n
4. Check if a new post appears in `/posts`
5. Approve the post
6. Manually trigger Workflow B
7. Verify post is published

#### Automated Test

1. Activate both workflows in n8n
2. Wait for the cron schedules to trigger
3. Monitor workflow executions in n8n
4. Check email notifications

## 🎯 Quick Verification Checklist

- [ ] Admin dashboard loads at http://localhost:5173
- [ ] Server API responds at http://localhost:3001/health
- [ ] Firebase connection working (no console errors)
- [ ] Ideas can be added and appear in dashboard
- [ ] n8n workflows imported and credentials configured
- [ ] Email notifications configured
- [ ] Test workflow execution creates posts
- [ ] Post approval workflow works

## 🐛 Common Issues & Fixes

### "Firebase not initialized"

- Check your .env file has all VITE*FIREBASE*\* variables
- Restart the dev server after adding env variables

### "CORS error" in browser

- Make sure FRONTEND_URL in server/.env matches your frontend URL
- Restart the server after changing env variables

### "n8n workflow fails"

- Check API keys are correct in n8n credentials
- Verify SERVER_URL environment variable in n8n
- Check server logs for API errors

### "No ideas available" email

- Add blog ideas in the `/ideas` section
- Check that ideas have `used: false` in Firestore

### Posts not appearing

- Check Firestore permissions
- Verify Firebase project ID is correct
- Check browser dev tools for errors

## 🎉 You're Ready!

Your blog automation system is now set up and ready to create content automatically. The system will:

1. **Every 2 days**: Create a new blog post from your ideas
2. **Every 15 minutes**: Publish approved posts when their scheduled time arrives
3. **Send notifications**: Email you when posts need review or are published

## 📝 Next Steps

1. **Add more ideas**: Build up a backlog of 10-20 blog ideas
2. **Customize prompts**: Edit the OpenAI prompts in n8n workflows
3. **Setup publishing**: Configure the publish endpoint for your actual blog platform
4. **Monitor system**: Check n8n execution logs and email notifications
5. **Deploy to production**: Follow the DEPLOYMENT.md guide when ready

## 🆘 Need Help?

- Check the troubleshooting section above
- Review server logs: `cd server && npm run dev`
- Check n8n workflow execution logs
- Verify all environment variables are set correctly
- Open an issue on GitHub if you're stuck

Happy automated blogging! 🚀
