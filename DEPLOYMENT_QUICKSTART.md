# Quick Start: Deploy to Render + Netlify

## 🚀 Complete Deployment in 3 Steps

### Step 1: Deploy Backend to Render (10 minutes)

1. **Push code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com and sign in
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     ```
     Name: floorplan-api
     Root Directory: FloorPlanTo3D-API-master
     Build Command: pip install -r requirements.txt
     Start Command: python application.py
     Instance Type: Free
     ```
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for deployment
   - **Copy your URL**: `https://floorplan-api-XXXX.onrender.com`

3. **Update CORS** (After first deployment)
   - You'll update this after getting your Netlify URL in Step 2

### Step 2: Deploy Frontend to Netlify (5 minutes)

1. **Deploy to Netlify**
   - Go to https://app.netlify.com
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect to GitHub and select your repository
   - Configure:
     ```
     Base directory: model-converter
     Build command: npm run build
     Publish directory: model-converter/dist
     ```

2. **Add Environment Variable**
   - Before deploying, click "Show advanced" → "New variable"
   - Add:
     ```
     Key: VITE_API_URL
     Value: https://floorplan-api-XXXX.onrender.com
     ```
     (Use the URL from Step 1)
   
   - Click **"Deploy site"**
   - Wait 2-3 minutes
   - **Your site is live!** `https://your-site-name.netlify.app`

### Step 3: Update Backend CORS (2 minutes)

1. **Edit application.py** (line 59)
   
   Change from:
   ```python
   cors = CORS(application, resources={r"/*": {"origins": "*"}})
   ```
   
   To:
   ```python
   cors = CORS(application, resources={
       r"/*": {
           "origins": [
               "https://your-site-name.netlify.app",  # Your Netlify URL
               "http://localhost:5173",  # Local development
           ]
       }
   })
   ```

2. **Push changes**
   ```bash
   git add application.py
   git commit -m "Update CORS for production"
   git push origin main
   ```
   
   Render will automatically redeploy (2-3 minutes)

---

## ✅ Done! Your app is live

- **Frontend**: https://your-site-name.netlify.app
- **Backend**: https://floorplan-api-XXXX.onrender.com

---

## 📝 Important Notes

### First Request May Be Slow
- Free tier services sleep after 15 minutes
- First request after sleep: 30-60 seconds
- Subsequent requests: Fast

### Testing Your Deployment
1. Visit your Netlify URL
2. Upload a floor plan image
3. Wait for conversion (first time may take longer)
4. View your 3D model!

---

## 🔧 Need Help?

### Check Logs:
- **Render**: Dashboard → Your Service → Logs tab
- **Netlify**: Dashboard → Your Site → Deploys → Build logs

### Common Issues:

**CORS Error:**
- Make sure you updated CORS with your Netlify URL
- Wait for Render to redeploy after pushing changes

**API Timeout:**
- Normal for first request (cold start)
- Wait 60 seconds and try again

**Build Failed on Netlify:**
- Check build logs
- Ensure base directory is set to `model-converter`

---

## 📊 What You've Deployed

| Component | Platform | URL Pattern | Cost |
|-----------|----------|-------------|------|
| Frontend (React) | Netlify | your-site-name.netlify.app | Free |
| Backend (Python) | Render | floorplan-api-XXXX.onrender.com | Free |

---

## 🎯 Next Steps

Want to upgrade?
- **Render Starter ($7/mo)**: No cold starts, always fast
- **Custom Domain**: Add your own domain in Netlify (free SSL included)
- **Monitoring**: Set up uptime monitoring with UptimeRobot

---

For detailed instructions, see:
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Backend deployment guide
- [model-converter/NETLIFY_DEPLOYMENT.md](../model-converter/NETLIFY_DEPLOYMENT.md) - Frontend deployment guide
