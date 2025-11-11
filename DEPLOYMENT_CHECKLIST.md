# Deployment Checklist ✅

Use this checklist to ensure everything is ready for deployment.

## Pre-Deployment

- [x] Code is production-ready
- [x] Environment variables documented
- [x] Production settings configured (secure cookies, CORS)
- [x] Deployment config files created (render.yaml, Procfile, railway.json)
- [ ] Code pushed to GitHub
- [ ] Google OAuth credentials obtained (optional)

## GitHub Setup

- [ ] Repository created on GitHub
- [ ] Code committed and pushed
- [ ] .env file is in .gitignore (should not be committed)
- [ ] README.md is up to date

## Google OAuth Setup (Optional)

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Secret copied
- [ ] OAuth consent screen configured

## Deployment Platform Setup

### Render
- [ ] Account created on render.com
- [ ] GitHub repository connected
- [ ] Web service created
- [ ] Environment variables added:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] SESSION_SECRET (random string)
  - [ ] GOOGLE_CLIENT_ID (if using Google Sign-In)
  - [ ] GOOGLE_CLIENT_SECRET (if using Google Sign-In)
  - [ ] GOOGLE_CALLBACK_URL (with your Render URL)
- [ ] Deployment successful
- [ ] App URL noted

### Railway (Alternative)
- [ ] Account created on railway.app
- [ ] Project created
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Deployment successful

## Post-Deployment

- [ ] App is accessible at deployed URL
- [ ] Homepage loads correctly
- [ ] Can select civilization
- [ ] Google Sign-In button appears (if configured)
- [ ] Can sign in with Google (if configured)
- [ ] Game progress saves (if signed in)
- [ ] Marketplace loads (after rebirth)
- [ ] Can create listings
- [ ] Can see other players' listings
- [ ] WebSocket connection works
- [ ] HTTPS is enabled (check for padlock)

## Google OAuth Post-Deployment

- [ ] Updated callback URL in Google Cloud Console
- [ ] Added production redirect URI: `https://your-app.com/auth/google/callback`
- [ ] Tested Google Sign-In flow
- [ ] Verified user data saves correctly

## Testing Checklist

- [ ] Create a new game
- [ ] Click currency
- [ ] Buy upgrades
- [ ] Buy buildings
- [ ] Rebirth (reach 1 trillion)
- [ ] Access marketplace
- [ ] Buy item from another player
- [ ] List an item for sale
- [ ] Sign in with Google
- [ ] Verify progress saves
- [ ] Test on different device (if signed in)

## Performance

- [ ] App loads quickly
- [ ] No console errors
- [ ] WebSocket connects reliably
- [ ] Marketplace updates in real-time

## Security

- [ ] HTTPS enabled
- [ ] Secure cookies in production
- [ ] Environment variables not exposed
- [ ] Session secret is random and secure

## Documentation

- [ ] README.md updated
- [ ] DEPLOYMENT.md created
- [ ] QUICK_START.md created
- [ ] Environment variables documented

---

**Ready to Deploy?** Follow [QUICK_START.md](QUICK_START.md) for step-by-step instructions!

