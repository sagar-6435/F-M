# Vercel Deployment Guide

This project is configured for deployment on Vercel. Follow these steps to deploy:

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally

## Deployment Steps

### 1. Push to Git Repository

First, ensure your code is pushed to a Git repository:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Connect to Vercel

#### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to:
- Log in to your Vercel account
- Select your project
- Confirm the build settings

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will auto-detect the settings
5. Click "Deploy"

### 3. Environment Variables (if needed)

If your app uses environment variables:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add your variables (e.g., `VITE_API_URL`)
4. Redeploy

## Build Configuration

The project uses the following configuration (in `vercel.json`):

- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Framework**: Vite
- **Rewrites**: All routes redirect to `/index.html` for SPA routing

## Project Structure

```
.
├── frontend/              # React + Vite application
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/             # Build output (deployed)
├── vercel.json           # Vercel configuration
└── .vercelignore         # Files to ignore during deployment
```

## Local Testing

To test the production build locally:

```bash
cd frontend
npm run build
npm run preview
```

This will serve the built application at `http://localhost:4173`

## Troubleshooting

### Build Fails

- Check that all dependencies are installed: `cd frontend && npm install`
- Verify Node.js version: `node --version` (should be 18+)
- Check build logs in Vercel dashboard

### Routes Not Working

- Ensure `vercel.json` has the rewrites configuration
- Clear browser cache and redeploy

### Environment Variables Not Loading

- Verify variables are set in Vercel project settings
- Ensure variable names match in your code (e.g., `VITE_API_URL`)
- Redeploy after adding variables

## Continuous Deployment

Once connected, Vercel will automatically:
- Deploy on every push to your main branch
- Create preview deployments for pull requests
- Run build checks before deployment

## Custom Domain

To add a custom domain:

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your domain
4. Follow DNS configuration instructions

## Performance Optimization

The build is already optimized with:
- Vite's fast build system
- Code splitting
- Tree shaking
- Minification

## Support

For more information, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
