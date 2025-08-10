# 🚀 Deployment Guide

This guide provides step-by-step instructions for deploying the Crypto Crash Game to production.

## 📋 Prerequisites

- GitHub account
- Render account (for backend)
- Netlify or Vercel account (for frontend)
- MongoDB Atlas account (for production database)

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new account or sign in
3. Create a new cluster (Free tier is sufficient)
4. Choose a cloud provider and region
5. Wait for cluster creation (3-5 minutes)

### 2. Configure Database Access

1. Go to **Database Access** in left sidebar
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Create username and strong password
5. Set role to **Read and write to any database**
6. Click **Add User**

### 3. Configure Network Access

1. Go to **Network Access** in left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
4. Or add specific IPs for better security
5. Click **Confirm**

### 4. Get Connection String

1. Go to **Clusters** in left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your user password
6. Replace `<dbname>` with `crypto-crash-game`

Example: `mongodb+srv://username:password@cluster0.abc123.mongodb.net/crypto-crash-game?retryWrites=true&w=majority`

## 🚀 Backend Deployment (Render)

### 1. Prepare Repository

1. Push your code to GitHub
2. Ensure your `backend/package.json` has correct scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "npm install"
     }
   }
   ```

### 2. Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `crypto-crash-game-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Configure Environment Variables

In the Render dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/crypto-crash-game?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
COINGECKO_API_KEY=your-coingecko-api-key-optional
CORS_ORIGINS=https://your-frontend-domain.netlify.app,https://your-frontend-domain.vercel.app
GAME_ROUND_DURATION=10000
MULTIPLIER_UPDATE_INTERVAL=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://crypto-crash-game-backend.onrender.com`

### 5. Seed Database

After successful deployment:

```bash
# Use Render's shell or run locally with production DB
curl -X POST https://crypto-crash-game-backend.onrender.com/api/player \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "admin_user",
    "name": "Admin User",
    "initialBtcBalance": 0.1,
    "initialEthBalance": 5
  }'
```

Or connect to your backend logs and manually run the seed script.

### 6. Test Backend

```bash
# Health check
curl https://crypto-crash-game-backend.onrender.com/api/health

# API info
curl https://crypto-crash-game-backend.onrender.com/api/info

# Game state
curl https://crypto-crash-game-backend.onrender.com/api/game/state
```

## 🌐 Frontend Deployment (Netlify)

### 1. Prepare Frontend

1. Update `frontend/env` with production backend URL:
   ```bash
   VITE_API_URL=https://crypto-crash-game-backend.onrender.com
   ```

2. Ensure `frontend/package.json` has build script:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

### 2. Deploy to Netlify

#### Option A: GitHub Integration

1. Go to [Netlify](https://app.netlify.com/)
2. Click **New site from Git**
3. Choose **GitHub** and authorize
4. Select your repository
5. Configure build settings:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

#### Option B: Drag and Drop

1. Build locally:
   ```bash
   cd frontend
   npm run build
   ```
2. Drag `frontend/dist` folder to Netlify deploy area

### 3. Configure Environment Variables

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add:
   ```
   VITE_API_URL=https://crypto-crash-game-backend.onrender.com
   ```

### 4. Configure Redirects (SPA Support)

Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

### 5. Test Frontend

1. Visit your Netlify URL
2. Try logging in with demo players
3. Test real-time functionality

## 🔄 Alternative: Frontend on Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
cd frontend
vercel --prod
```

### 3. Configure Environment Variables

```bash
vercel env add VITE_API_URL
# Enter: https://crypto-crash-game-backend.onrender.com

vercel env add NODE_ENV
# Enter: production
```

### 4. Redeploy with Environment Variables

```bash
vercel --prod
```

## 🔐 Security Checklist

### Backend Security

- [ ] Use strong JWT secret (32+ characters)
- [ ] Set secure MongoDB user credentials
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set NODE_ENV=production
- [ ] Monitor logs for errors
- [ ] Use HTTPS only

### Frontend Security

- [ ] No sensitive data in client code
- [ ] Use environment variables for API URLs
- [ ] Enable HTTPS (automatic on Netlify/Vercel)
- [ ] Set proper CSP headers

### Database Security

- [ ] Restrict IP access in MongoDB Atlas
- [ ] Use strong database passwords
- [ ] Enable MongoDB encryption at rest
- [ ] Regular backup schedule

## 📊 Monitoring & Maintenance

### Health Monitoring

Set up monitoring for these endpoints:
- `GET /api/health` - Backend health
- `GET /api/game/state` - Game functionality
- WebSocket connection test

### Log Monitoring

Monitor these logs:
- Application errors
- Database connection issues
- High response times
- Rate limit violations
- WebSocket disconnections

### Performance Monitoring

Track these metrics:
- API response times
- WebSocket latency
- Database query performance
- Memory usage
- CPU utilization

## 🔄 Continuous Deployment

### Automatic Deployments

Both Render and Netlify support automatic deployments:

1. **Enable auto-deploy** in service settings
2. **Connect to main branch**
3. Deployments trigger on git push

### Environment Management

Use different branches for environments:
- `main` → Production
- `staging` → Staging environment
- `develop` → Development

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check logs in Render dashboard
# Common issues:
# - Wrong MONGODB_URI format
# - Missing environment variables
# - Port conflicts (should be process.env.PORT)
```

#### Frontend Can't Connect
```bash
# Check browser console
# Common issues:
# - Wrong VITE_API_URL
# - CORS misconfiguration
# - HTTPS mixed content errors
```

#### Database Connection Fails
```bash
# Check MongoDB Atlas:
# - Correct IP whitelist
# - Valid user credentials
# - Network connectivity
```

#### WebSocket Issues
```bash
# Check:
# - CORS configuration
# - WebSocket transport settings
# - Proxy/CDN compatibility
```

### Debug Commands

```bash
# Test backend endpoints
curl -v https://your-backend.onrender.com/api/health

# Check WebSocket connection
curl -v --include \
  --no-buffer \
  --header "Connection: Upgrade" \
  --header "Upgrade: websocket" \
  https://your-backend.onrender.com/socket.io/

# Test from frontend domain
curl -H "Origin: https://your-frontend.netlify.app" \
  https://your-backend.onrender.com/api/health
```

## 🔄 Updates & Rollbacks

### Updating the Application

1. **Test changes locally**
2. **Deploy to staging first** (if available)
3. **Push to main branch**
4. **Monitor deployment logs**
5. **Test production deployment**

### Rolling Back

#### Render Rollback
1. Go to service dashboard
2. Click **Deployments** tab
3. Click **Rollback** on previous deployment

#### Netlify Rollback
1. Go to site dashboard
2. Click **Deploys** tab
3. Click **Publish deploy** on previous version

## 📈 Scaling Considerations

### When to Scale

Monitor these indicators:
- Response times > 1 second
- High CPU/memory usage (>80%)
- Frequent WebSocket disconnections
- Database connection pool exhaustion

### Scaling Options

#### Backend Scaling
- **Vertical**: Upgrade Render plan
- **Horizontal**: Multiple Render services + load balancer
- **Database**: MongoDB Atlas cluster scaling

#### Frontend Scaling
- Netlify/Vercel handle this automatically
- Consider CDN for global users

## 💰 Cost Optimization

### Free Tier Limits

#### Render (Free Tier)
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- 512MB RAM, 0.5 CPU

#### MongoDB Atlas (Free Tier)
- 512MB storage
- Shared CPU
- No backups

#### Netlify (Free Tier)
- 100GB bandwidth/month
- 300 build minutes/month

### Optimization Tips

1. **Use caching** to reduce API calls
2. **Optimize images** and assets
3. **Enable compression** on static files
4. **Monitor usage** with analytics
5. **Clean up old data** periodically

## 📞 Support

For deployment issues:
- Check service status pages
- Review documentation
- Contact support if needed

**Service Status Pages:**
- [Render Status](https://status.render.com/)
- [Netlify Status](https://www.netlifystatus.com/)
- [MongoDB Atlas Status](https://status.cloud.mongodb.com/)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Backend deployed to Render with environment variables
- [ ] Database seeded with sample data
- [ ] Backend health check passes
- [ ] Frontend deployed to Netlify/Vercel
- [ ] Frontend environment variables configured
- [ ] Frontend connects to backend successfully
- [ ] WebSocket functionality working
- [ ] Demo players can login and play
- [ ] Real-time updates working
- [ ] CORS properly configured
- [ ] HTTPS enabled on both services
- [ ] Monitoring set up
- [ ] Documentation updated with live URLs

**Live URLs:**
- Backend: `https://your-backend.onrender.com`
- Frontend: `https://your-frontend.netlify.app`
- API Docs: `https://your-backend.onrender.com/api/info`

