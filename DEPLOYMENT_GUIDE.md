# 🚀 Deployment Guide - Crypto Crash Game

This guide will help you deploy the Crypto Crash Game to Render (backend) and Netlify (frontend).

## 📋 Pre-deployment Checklist

✅ Code pushed to GitHub: https://github.com/vinayj767/Crypto-Crash-Game  
✅ MongoDB Atlas connection configured  
✅ Environment variables prepared  
✅ Dependencies installed and tested  

## 🖥️ Backend Deployment on Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### Step 2: Deploy Backend Service
1. **Click "New" → "Web Service"**
2. **Connect Repository:**
   - Connect your GitHub account
   - Select repository: `vinayj767/Crypto-Crash-Game`
   - Click "Connect"

3. **Configure Service:**
   ```
   Name: crypto-crash-game-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Environment Variables:** Click "Advanced" and add these:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://vinayjcursor1:vinayjain@cluster0.yveaukn.mongodb.net/crypto-crash-game?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=crypto-crash-game-jwt-secret-production-2024
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://crypto-crash-game-frontend.netlify.app,https://crypto-crash-game-frontend.vercel.app
   GAME_ROUND_DURATION=10000
   MULTIPLIER_UPDATE_INTERVAL=100
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Click "Create Web Service"**
6. **Wait for deployment** (usually 2-5 minutes)
7. **Copy your backend URL** (e.g., `https://crypto-crash-game-backend.onrender.com`)

## 🌐 Frontend Deployment on Netlify

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up"
3. Sign up with GitHub (recommended)

### Step 2: Deploy Frontend
1. **Click "New site from Git"**
2. **Connect Repository:**
   - Choose GitHub
   - Select repository: `vinayj767/Crypto-Crash-Game`
   - Click "Deploy site"

3. **Configure Build Settings:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com`
   - (Replace with your actual Render backend URL from Step 1.7)

5. **Deploy the site**

### Step 3: Update CORS Settings
1. Go back to your Render dashboard
2. Find your backend service
3. Go to Environment variables
4. Update `CORS_ORIGINS` to include your Netlify URL:
   ```
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-netlify-site.netlify.app
   ```
5. Save and redeploy

## 🧪 Testing Deployment

### Backend Health Check
```bash
curl https://your-backend-url.onrender.com/api/health
```
Expected response: `{"status":"healthy","timestamp":"..."}`

### Frontend Test
1. Open your Netlify URL
2. Try logging in with demo players
3. Place a bet and test the game functionality

## 🔗 Final URLs

After successful deployment, you'll have:
- **GitHub Repository:** https://github.com/vinayj767/Crypto-Crash-Game
- **Backend API:** https://your-service.onrender.com
- **Frontend App:** https://your-site.netlify.app

## ⚠️ Common Issues

### Backend Won't Start
- Check MongoDB connection string
- Verify all environment variables are set
- Check Render logs for errors

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is set correctly
- Check CORS_ORIGINS includes your frontend URL
- Ensure backend is deployed and running

### Database Connection Issues
- Verify MongoDB Atlas whitelist includes 0.0.0.0/0
- Check username/password in connection string
- Ensure database name is correct

## 🎉 Success!

Once both services are deployed and working:
1. Test the full application flow
2. Share the links:
   - GitHub: https://github.com/vinayj767/Crypto-Crash-Game
   - Live App: https://your-site.netlify.app
   - API: https://your-service.onrender.com

The deployment is complete! 🚀
