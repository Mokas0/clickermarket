# Quick Start - Deploy in 5 Minutes! 🚀

## Step 1: Push to GitHub (2 minutes)

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Ready for deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render (3 minutes)

1. **Go to [render.com](https://render.com)** and sign up (use GitHub to sign in)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**
   - Select your ClickerMarket repo
   - Click "Connect"

4. **Configure the service:**
   - **Name**: `clickermarket` (or any name you like)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   
   **Required:**
   ```
   NODE_ENV = production
   PORT = 10000
   SESSION_SECRET = [Generate a random string - see below]
   ```
   
   **For Google Sign-In (optional but recommended):**
   ```
   GOOGLE_CLIENT_ID = [Your Google Client ID]
   GOOGLE_CLIENT_SECRET = [Your Google Client Secret]
   GOOGLE_CALLBACK_URL = https://your-app.onrender.com/auth/google/callback
   ```
   ⚠️ **Important**: Replace `your-app` with your actual Render app name!

6. **Click "Create Web Service"**

7. **Wait 5-10 minutes** for deployment

8. **Your app is live!** 🎉
   - URL will be: `https://your-app.onrender.com`

## Step 3: Update Google OAuth (if using Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 credentials
3. Add authorized redirect URI:
   ```
   https://your-app.onrender.com/auth/google/callback
   ```
4. Save changes

## Generate Session Secret

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET`.

## That's It! 🎊

Your game is now live and accessible worldwide!

**Next Steps:**
- Share your URL with friends
- Test the multiplayer marketplace
- Sign in with Google to save progress

## Troubleshooting

**App won't start?**
- Check the "Logs" tab in Render dashboard
- Verify all environment variables are set
- Make sure `npm install` completed successfully

**Google Sign-In not working?**
- Double-check `GOOGLE_CALLBACK_URL` matches your Render URL exactly
- Verify redirect URI is added in Google Cloud Console
- Check that Client ID and Secret are correct

**Need help?** Check the full [DEPLOYMENT.md](DEPLOYMENT.md) guide!

