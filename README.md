# PeakNorth Blog Automation System

A comprehensive blog automation system that creates, schedules, and publishes blog posts automatically using n8n workflows, Firebase, and OpenAI.

## 🚀 Features

- **Automated Content Creation**: AI-powered blog post generation from ideas
- **Smart Scheduling**: Configurable publishing cadence (e.g., every 2 days)
- **Review Workflow**: Admin approval system before publishing
- **SEO Optimization**: Automatic meta tags, descriptions, and keyword generation
- **Real-time Dashboard**: Track posts, ideas, and publishing statistics
- **n8n Integration**: Two automated workflows for content creation and publishing

## 📋 System Overview

The system consists of three main components:

1. **Admin Dashboard** (React + TypeScript)
2. **Server API** (Node.js + Express + Firebase)
3. **n8n Workflows** (Automation)

### Workflow Architecture

```
WF-A (Cadence Planner)  →  Creates drafts every 2 days
                        →  Generates outline & content
                        →  Sets NEEDS_REVIEW status

Admin Review           →  You approve/reject drafts
                        →  Status becomes APPROVED

WF-B (Publisher Runner) →  Runs every 15 minutes
                        →  Publishes APPROVED posts when scheduled
                        →  Updates status to PUBLISHED
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- Firebase project with Firestore
- n8n instance
- OpenAI API key
- SMTP server for notifications

### 1. Clone and Install

```bash
git clone <repository-url>
cd peaknorth-admin

# Install admin dashboard dependencies
npm install

# Install server dependencies
cd server
npm install
```

### 2. Environment Configuration

#### Admin Dashboard (.env)

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Server (.env)

```env
# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# API Security
N8N_SERVER_KEY=your_secure_api_key_for_n8n

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-admin-domain.com

# OpenAI (used by n8n workflows)
OPENAI_API_KEY=sk-...
```

### 3. Firebase Setup

1. Create a new Firebase project
2. Enable Firestore Database
3. Create the following collections:

   - `posts` - Blog posts
   - `ideas` - Blog ideas
   - `settings` - Configuration

4. Add initial cadence configuration:

```javascript
// In Firestore console, create document: settings/cadence
{
  "intervalDays": 2,
  "publishHour": 10,
  "timezone": "America/Toronto",
  "draftLeadHours": 24,
  "reminderHours": 4
}
```

### 4. Deploy Server

```bash
cd server
npm run build
npm start

# Or deploy to your preferred platform (Vercel, Railway, etc.)
```

### 5. Deploy Admin Dashboard

```bash
npm run build
# Deploy dist/ folder to your hosting platform
```

### 6. Setup n8n Workflows

1. Import the workflow JSON files from `n8n-workflows/`
2. Configure credentials:

   - **N8N API Key**: For server authentication
   - **OpenAI API Key**: For content generation
   - **SMTP**: For email notifications

3. Set environment variables in n8n:

   - `SERVER_URL`: Your server API URL
   - `FRONTEND_URL`: Your admin dashboard URL

4. Activate both workflows

## 📊 Data Schema

### BlogPost Document

```typescript
{
  id: string;
  status: 'BRIEF' | 'OUTLINE' | 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: number | null; // epoch ms
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;

  brief: {
    topic: string;
    persona: string;
    goal: string;
    targetAudience?: string;
    keyPoints?: string[];
  };

  outline: {
    title: string;
    introduction: string;
    sections: Array<{
      heading: string;
      subPoints: string[];
    }>;
    conclusion: string;
    callToAction?: string;
  };

  draft_mdx: string | null;
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    keywords: string[];
    slug: string;
  };

  wordCount?: number;
  estimatedReadTime?: number;
  publicUrl?: string;
  errorMessage?: string;
}
```

### BlogIdea Document

```typescript
{
  id: string;
  topic: string;
  persona: string;
  goal: string;
  targetAudience?: string;
  priority: 'low' | 'medium' | 'high';
  used: boolean;
  createdAt: number;
  tags?: string[];
}
```

## 🔄 API Endpoints

### Posts

- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/status` - Update post status
- `POST /api/posts/:id/publish` - Publish post immediately

### Ideas

- `POST /api/ideas` - Create new idea
- `GET /api/ideas` - Get all ideas
- `GET /api/ideas/pick` - Pick next unused idea (for n8n)
- `DELETE /api/ideas/:id` - Delete idea

### Publishing

- `GET /api/publish/ready` - Get posts ready to publish (for n8n)
- `GET /api/publish/stats` - Get publishing statistics

## ⚙️ n8n Workflows

### Workflow A: Cadence Planner

**Trigger**: Cron (every 2 days at 10:00 AM)

**Process**:

1. Pick unused blog idea
2. Create post with BRIEF status
3. Generate outline using OpenAI
4. Generate draft content using OpenAI
5. Set status to NEEDS_REVIEW
6. Send email notification

### Workflow B: Publisher Runner

**Trigger**: Cron (every 15 minutes)

**Process**:

1. Get approved posts where scheduledAt ≤ now
2. Generate SEO metadata using OpenAI
3. Render MDX to HTML
4. Publish post (update status to PUBLISHED)
5. Send success notification

## 🎯 Usage Guide

### Adding Blog Ideas

1. Go to `/ideas` in admin dashboard
2. Click "Add Idea"
3. Fill in topic, target persona, and goal
4. Set priority (high priority ideas are used first)

### Reviewing Posts

1. Check `/posts` for posts with "NEEDS_REVIEW" status
2. Click on a post to review content
3. Click "Approve & Schedule" to approve
4. Click "Request Changes" to send back to draft

### Managing Schedule

1. Go to `/settings`
2. Configure publishing interval, time, and timezone
3. Set how far in advance to create drafts
4. Save settings

## 🔧 Customization

### Content Generation Prompts

Edit the OpenAI prompts in the n8n workflows to customize:

- Writing style and tone
- Content structure
- SEO optimization approach

### Publishing Platform

Modify the "Publish Post" node in Workflow B to integrate with your specific platform:

- WordPress API
- Ghost CMS
- Static site generator
- Custom CMS

### Notification Channels

Replace email notifications with:

- Slack webhooks
- Discord notifications
- SMS alerts
- Push notifications

## 🚨 Troubleshooting

### Common Issues

**Posts not being created**

- Check if you have unused ideas in the system
- Verify n8n workflow is active and running
- Check OpenAI API key and credits

**Posts not publishing**

- Ensure posts are in APPROVED status
- Check scheduledAt timestamp is in the past
- Verify Publisher Runner workflow is active

**Admin dashboard not loading**

- Check Firebase configuration
- Verify environment variables
- Check browser console for errors

### Monitoring

Monitor the system through:

- n8n execution logs
- Server API logs
- Firebase Firestore activity
- Email notifications

## 📈 Scaling Considerations

- **Rate Limits**: OpenAI has rate limits; adjust workflow timing accordingly
- **Firestore Costs**: Monitor document reads/writes
- **Content Quality**: Regularly review and refine AI prompts
- **Backup**: Export your ideas and posts regularly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review n8n workflow logs
3. Check server API logs
4. Open an issue on GitHub

---

**Happy Blogging! 🎉**
