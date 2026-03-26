# Deploying Backend to Render

This guide will help you deploy the Friends & Memories backend to Render.

## Prerequisites

- GitHub account with the repository pushed
- Render account (https://render.com)
- MongoDB Atlas account (for database)

## Step 1: Create MongoDB Databases (Optional)

If you want to use MongoDB for persistent storage:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create two databases: `branch1` and `branch2`
4. Get connection strings for both databases

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Push the `render.yaml` file to your GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Select "Build and deploy from a Git repository"
5. Connect your GitHub repository
6. Render will automatically detect `render.yaml` and configure the service

### Option B: Manual Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `friends-memories-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid for better performance)

## Step 3: Set Environment Variables

1. In Render dashboard, go to your service
2. Click "Environment" tab
3. Add the following environment variables:

```
NODE_ENV=production
JWT_SECRET=your_secure_random_string_here
ADMIN_PASSWORD=your_admin_password_here
MONGODB_URI_BRANCH1=mongodb+srv://username:password@cluster.mongodb.net/branch1
MONGODB_URI_BRANCH2=mongodb+srv://username:password@cluster.mongodb.net/branch2
```

**Important**: 
- Generate a strong `JWT_SECRET` (use a random string generator)
- Use a secure `ADMIN_PASSWORD`
- If not using MongoDB, leave the MongoDB URIs empty (backend will use in-memory storage)

## Step 4: Deploy

1. Click "Deploy" button
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://friends-memories-backend.onrender.com`

## Step 5: Update Frontend API URL

Update your frontend API configuration to use the Render URL:

In `frontend/src/lib/api.ts`:
```typescript
const API_BASE = "https://friends-memories-backend.onrender.com/api";
```

## Monitoring

- View logs: Click "Logs" tab in your service
- Check health: Visit `https://your-service-url/api/health`
- Monitor performance: Use Render's built-in monitoring

## Troubleshooting

### Service won't start
- Check logs for errors
- Verify all environment variables are set
- Ensure MongoDB URIs are correct (if using MongoDB)

### 502 Bad Gateway
- Check if service is running (view logs)
- Verify PORT is set to 10000 (Render's default)
- Check for runtime errors in logs

### Database connection errors
- Verify MongoDB connection strings
- Check MongoDB Atlas IP whitelist (allow all IPs: 0.0.0.0/0)
- Ensure database names match in connection strings

## Free Tier Limitations

- Service spins down after 15 minutes of inactivity
- Limited to 0.5 GB RAM
- Shared CPU
- 100 GB bandwidth/month

For production, consider upgrading to a paid plan.

## Updating the Backend

1. Make changes locally
2. Commit and push to GitHub
3. Render will automatically redeploy on push (if auto-deploy is enabled)

To manually trigger a deploy:
1. Go to your service in Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

## Custom Domain

To use a custom domain:
1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed by Render

## Support

For issues with Render deployment, visit:
- [Render Documentation](https://render.com/docs)
- [Render Support](https://support.render.com)
