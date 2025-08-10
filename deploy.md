# Quick Deploy Links & Instructions

## 🚀 One-Click Deploy Links

### Backend on Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vinayj767/Crypto-Crash-Game)

**Manual Deploy Steps for Render:**
1. Go to: https://render.com/deploy?repo=https://github.com/vinayj767/Crypto-Crash-Game
2. Connect your GitHub account
3. Set these environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://vinayjcursor1:vinayjain@cluster0.yveaukn.mongodb.net/crypto-crash-game?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET`: `crypto-crash-game-jwt-secret-production-2024`
   - `CORS_ORIGINS`: `http://localhost:3000,http://localhost:5173,https://crypto-crash-game-frontend.netlify.app`
4. Click "Create Web Service"

### Frontend on Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/vinayj767/Crypto-Crash-Game)

**Manual Deploy Steps for Netlify:**
1. Go to: https://app.netlify.com/start/deploy?repository=https://github.com/vinayj767/Crypto-Crash-Game
2. Connect your GitHub account  
3. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL` with your Render backend URL
5. Click "Deploy site"

## 📱 Direct Access Links

- **GitHub Repository**: https://github.com/vinayj767/Crypto-Crash-Game
- **Backend Deploy**: https://dashboard.render.com/
- **Frontend Deploy**: https://app.netlify.com/

## 🔑 Environment Variables Reference

### Backend (Render)
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://vinayjcursor1:vinayjain@cluster0.yveaukn.mongodb.net/crypto-crash-game?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=crypto-crash-game-jwt-secret-production-2024
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://crypto-crash-game-frontend.netlify.app
GAME_ROUND_DURATION=10000
MULTIPLIER_UPDATE_INTERVAL=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (Netlify)
```
VITE_API_URL=https://your-backend-service.onrender.com
```

## ✅ Quick Verification

After deployment:
1. Backend health: `https://your-backend.onrender.com/api/health`
2. Frontend app: `https://your-site.netlify.app`
3. Test login with demo user: `alice_crypto`
