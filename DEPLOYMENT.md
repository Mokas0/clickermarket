# Deployment Guide for ClickerMarket

This guide will help you deploy ClickerMarket to a free hosting service.

## Quick Deploy Options

### Option 1: Render (Recommended - Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `clickermarket` (or your choice)
     - **Region**: Choose closest to you
     - **Branch**: `main`
     - **Root Directory**: (leave empty)
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   
3. **Add Environment Variables** (in Render dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   SESSION_SECRET=your-random-secret-here (generate a long random string)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-app.onrender.com/auth/google/callback
   ```
   **Important**: Replace `your-app.onrender.com` with your actual Render URL!

4. **Update Google OAuth Settings**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-app.onrender.com/auth/google/callback`

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your app will be live!

### Option 2: Railway

1. **Push to GitHub** (same as above)

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Add Environment Variables**:
   - Click on your service → "Variables" tab
   - Add the same variables as Render (above)
   - Update `GOOGLE_CALLBACK_URL` to your Railway URL

4. **Update Google OAuth** with Railway callback URL

5. **Deploy** - Railway auto-deploys on git push!

### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   npm install -g @fly/cli
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Initialize**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Choose a region
   - Don't deploy yet

4. **Set Secrets**
   ```bash
   fly secrets set GOOGLE_CLIENT_ID=your-id
   fly secrets set GOOGLE_CLIENT_SECRET=your-secret
   fly secrets set SESSION_SECRET=your-secret
   fly secrets set GOOGLE_CALLBACK_URL=https://your-app.fly.dev/auth/google/callback
   fly secrets set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

## Environment Variables Reference

Create these in your hosting platform's environment variables section:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (auto-set by most hosts) | `10000` |
| `SESSION_SECRET` | Secret for session encryption | Generate random string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `https://your-app.com/auth/google/callback` |

## Generating a Secure Session Secret

Run this command to generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator: https://randomkeygen.com/

## Post-Deployment Checklist

- [ ] App is accessible at your URL
- [ ] Google Sign-In button appears
- [ ] Can sign in with Google account
- [ ] Game progress saves correctly
- [ ] Marketplace shows online players
- [ ] Can create listings
- [ ] Can buy from other players
- [ ] HTTPS is enabled (check for padlock icon)

## Troubleshooting

### App won't start
- Check build logs in your hosting dashboard
- Verify all environment variables are set
- Check that `npm install` completes successfully

### Google Sign-In not working
- Verify `GOOGLE_CALLBACK_URL` matches your actual URL
- Check Google Cloud Console has the correct redirect URI
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### WebSocket/Socket.io not working
- Verify your hosting platform supports WebSockets (Render, Railway, Fly.io all do)
- Check browser console for connection errors
- Ensure CORS is properly configured

### Free tier limitations
- **Render**: Spins down after 15 min inactivity (first request may be slow)
- **Railway**: $5/month credit (may run out)
- **Fly.io**: 3 shared VMs free

## Updating Your App

After making changes:
1. Commit and push to GitHub
2. Most platforms auto-deploy on push
3. Check deployment logs if issues occur

## Need Help?

- Check hosting platform documentation
- Review server logs in dashboard
- Check browser console for errors
- Verify all environment variables are set correctly

