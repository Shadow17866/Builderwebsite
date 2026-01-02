# Netlify Deployment Guide

## Overview
This guide will help you deploy the FloorPlan to 3D converter to Netlify. Since Netlify hosts frontend applications, you'll need to deploy the backend separately.

---

## Part 1: Deploy Backend (Python Flask API)

The Python backend with the ML model needs to be deployed to a platform that supports Python applications. Here are your options:

### Option 1: Render.com (Recommended - Free Tier Available)
1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository or upload code
4. Configure:
   - **Name**: floorplan-api
   - **Root Directory**: `FloorPlanTo3D-API-master`
   - **Environment**: Python 3.7
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python application.py`
   - **Instance Type**: Free (or Starter for better performance)
5. Add environment variable:
   - `PYTHON_VERSION` = `3.7.9`
6. Click "Create Web Service"
7. **Note the deployed URL** (e.g., `https://floorplan-api.onrender.com`)

### Option 2: Railway.app (Easy Setup)
1. Visit https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway will auto-detect Python
5. Set root directory to `FloorPlanTo3D-API-master`
6. Add variables:
   - `PORT` = `5000`
7. Deploy and note the URL

### Option 3: Heroku (Popular but Paid)
1. Install Heroku CLI
2. Create `Procfile` in backend folder:
   ```
   web: python application.py
   ```
3. Create `runtime.txt`:
   ```
   python-3.7.9
   ```
4. Deploy:
   ```bash
   heroku create floorplan-api
   heroku git:remote -a floorplan-api
   git subtree push --prefix FloorPlanTo3D-API-master heroku main
   ```

### ⚠️ Important Backend Notes:
- The model weights file (`maskrcnn_15_epochs.h5`) is 246 MB
- Make sure it's included in your deployment
- Free tiers may have memory/storage limits
- Cold starts may take 10-30 seconds on free tiers

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Prepare Your Repository
1. Ensure `.gitignore` excludes `node_modules` and `.env.local`
2. Push code to GitHub/GitLab/Bitbucket

### Step 2: Deploy to Netlify

#### Via Netlify Dashboard (Recommended):
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Base directory**: `model-converter`
   - **Build command**: `npm run build`
   - **Publish directory**: `model-converter/dist`
   - **Node version**: 18

6. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (use your actual backend URL)

7. Click "Deploy site"

#### Via Netlify CLI:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Navigate to frontend folder
cd model-converter

# Deploy
netlify deploy --prod

# When prompted:
# - Build command: npm run build
# - Publish directory: dist
```

### Step 3: Configure Environment Variables
In Netlify Dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`
3. Trigger a new deploy to apply changes

---

## Part 3: Update CORS on Backend

Your backend needs to allow requests from your Netlify domain:

1. Edit `application.py` in your backend:
```python
from flask_cors import CORS

# Replace with your actual Netlify URL
cors = CORS(application, resources={
    r"/*": {
        "origins": [
            "https://your-site-name.netlify.app",
            "http://localhost:5173"  # Keep for local development
        ]
    }
})
```

2. Redeploy your backend

---

## Testing Your Deployment

1. Visit your Netlify URL (e.g., `https://your-site-name.netlify.app`)
2. Upload a floor plan image
3. Check browser console for any errors
4. Verify the API is being called (Network tab in DevTools)

### Common Issues:

**Issue: CORS Error**
- Solution: Update CORS settings in backend to include your Netlify domain

**Issue: API Request Timeout**
- Solution: Backend cold start on free tier. Wait 30 seconds and retry

**Issue: 404 on Page Refresh**
- Solution: Already configured in `netlify.toml` (redirects to index.html)

**Issue: Build Fails**
- Solution: Check build logs, ensure all dependencies are in package.json

---

## Custom Domain (Optional)

1. In Netlify Dashboard → **Domain settings**
2. Click "Add custom domain"
3. Follow instructions to update DNS records
4. Netlify provides free SSL certificates

---

## Environment Summary

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| Local | http://localhost:5173 | http://localhost:5000 |
| Production | https://your-site.netlify.app | https://your-backend.onrender.com |

---

## Files Created for Netlify:
- ✅ `netlify.toml` - Netlify configuration
- ✅ `.env.example` - Environment variable template
- ✅ `.env.local` - Local development variables (git-ignored)
- ✅ `.gitignore` - Updated to exclude env files

---

## Next Steps:
1. ✅ Deploy backend to Render/Railway/Heroku
2. ✅ Get backend URL
3. ✅ Update CORS in backend
4. ✅ Deploy frontend to Netlify with VITE_API_URL
5. ✅ Test the deployed application

Need help? Check Netlify docs: https://docs.netlify.com
