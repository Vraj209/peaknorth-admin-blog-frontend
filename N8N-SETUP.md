# n8n Setup Guide for PeakNorth Blog Automation

This guide will help you set up n8n Cloud to automate your blog post creation and publishing.

## 🎯 **What n8n Will Do**

- **Workflow A (Cadence Planner)**: Every 2 days, picks a blog idea and creates a draft
- **Workflow B (Publisher Runner)**: Every 15 minutes, publishes approved posts

## 🚀 **n8n Cloud Setup**

1. Go to [n8n.cloud](https://n8n.cloud)
2. Create account and choose plan
3. Access your n8n Cloud instance

## 📥 **Import Workflows**

### Step 1: Import Workflow A (Cadence Planner)

1. In n8n interface, click **"Add Workflow"**
2. Click the **"⋮" menu** → **"Import from JSON"**
3. Copy content from `n8n-workflows/workflow-a-cadence-planner.json`
4. Paste and click **"Import"**
5. Save the workflow

### Step 2: Import Workflow B (Publisher Runner)

1. Create another new workflow
2. Import `n8n-workflows/workflow-b-publisher-runner.json`
3. Save the workflow

## 🔑 **Configure Credentials**

You need to set up 3 types of credentials:

### 1. Server API Key (for your blog server)

1. Go to **Settings** → **Credentials**
2. Click **"Add Credential"**
3. Search for **"HTTP Header Auth"**
4. Configure:
   - **Name**: "N8N API Key"
   - **Header Name**: `x-api-key`
   - **Header Value**: `your-random-secure-key-123` (same as N8N_SERVER_KEY)

### 2. OpenAI API Key

1. Add another **"HTTP Header Auth"** credential
2. Configure:
   - **Name**: "OpenAI API Key"
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer sk-your-openai-key-here`

### 3. SMTP for Email Notifications

1. Add **"SMTP"** credential
2. Configure:
   - **Name**: "SMTP"
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Security**: `STARTTLS`
   - **Username**: `your-email@gmail.com`
   - **Password**: `your-gmail-app-password`

## 🌍 **Set Environment Variables**

In n8n Cloud Settings → Environment Variables, add your production URLs:

```
SERVER_URL=https://your-api-domain.com
FRONTEND_URL=https://your-admin-domain.com
```

Replace with your actual deployed backend and frontend URLs.

## ⚙️ **Configure Workflow Nodes**

### In Workflow A (Cadence Planner):

1. **Every 2 Days at 10:00** node:

   - Set timezone to your preference
   - Adjust time as needed

2. **Pick Blog Idea** node:

   - Select "N8N API Key" credential
   - URL should be: `{{$env.SERVER_URL}}/api/ideas/pick`

3. **Create Post** node:

   - Select "N8N API Key" credential
   - URL: `{{$env.SERVER_URL}}/api/posts`

4. **OpenAI nodes**:

   - Select "OpenAI API Key" credential

5. **Email nodes**:
   - Select "SMTP" credential
   - Update email addresses to your actual email

### In Workflow B (Publisher Runner):

1. **Every 15 Minutes** node:

   - Timezone should match Workflow A

2. **Get Ready Posts** node:

   - Select "N8N API Key" credential
   - URL: `{{$env.SERVER_URL}}/api/publish/ready`

3. **OpenAI and Email nodes**:
   - Same configuration as Workflow A

## 🧪 **Test the Setup**

### 1. Test Your Server API

Make sure your backend server is deployed and running. Test the API endpoints:

```bash
# Test health endpoint
curl https://your-api-domain.com/health

# Test with API key
curl -H "x-api-key: your-random-secure-key-123" \
     https://your-api-domain.com/api/ideas
```

### 2. Test Workflow A

1. Go to Workflow A in n8n
2. Click **"Execute Workflow"** (manual trigger)
3. Check if it:
   - Picks a blog idea
   - Creates a post
   - Generates content
   - Sends email notification

### 3. Test Workflow B

1. First, approve a post in your admin dashboard
2. Go to Workflow B in n8n
3. Click **"Execute Workflow"**
4. Check if it publishes the approved post

## 🔄 **Activate Workflows**

Once testing is successful:

1. In each workflow, toggle the **"Active"** switch to ON
2. Workflows will now run automatically on schedule

## 📧 **Gmail App Password Setup**

For email notifications to work with Gmail:

1. Go to [Google Account settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Generate password for "n8n"
4. Use this password in your SMTP credential

## 🐛 **Troubleshooting**

### Common Issues:

**"Connection refused" errors:**

- Make sure your backend server is deployed and accessible
- Check SERVER_URL environment variable in n8n Cloud

**"Unauthorized" errors:**

- Verify N8N_API_KEY matches between your backend .env and n8n credential
- Check API key header name is exactly `x-api-key`

**OpenAI errors:**

- Verify your OpenAI API key is valid and has credits
- Check the Authorization header format: `Bearer sk-...`

**Email not sending:**

- Use Gmail app password, not regular password
- Enable 2-factor authentication on Gmail first

### Debug Steps:

1. **Check n8n execution logs:**

   - Click on any node in a workflow
   - View the execution data and errors

2. **Check backend server logs:**

   Check your deployed backend server logs through your hosting platform dashboard.

3. **Test individual components:**
   - Test backend endpoints with curl using your deployed URLs
   - Test OpenAI API directly
   - Test SMTP with a simple email client

## 📊 **Monitor Your Automation**

### In n8n Cloud Interface:

- **Executions**: View all workflow runs
- **Logs**: Check for errors and success messages

### In Your Admin Dashboard:

- Check new posts appear with status "NEEDS_REVIEW"
- Verify scheduled times are correct
- Monitor email notifications

### Expected Behavior:

- **Every 2 days at 10:00 AM**: New draft created
- **Every 15 minutes**: Approved posts get published
- **Email notifications**: Sent for new drafts and published posts

## 🎉 **Success!**

Once everything is working:

- New blog ideas will automatically become drafts
- You review and approve via admin dashboard
- Approved posts automatically publish at scheduled times
- You get email notifications throughout the process

Your blog automation is now fully operational! 🚀
