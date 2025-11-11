# ClickerMarket - Multiplayer Edition

A Cookie Clicker-style incremental game with a **real multiplayer marketplace** where players from across the internet can trade rare digital items!

## Features

### Three Civilizations
- **Red Circle**: The passionate civilization of circles
- **Blue Square**: The stable civilization of squares  
- **Yellow Triangle**: The dynamic civilization of triangles

### Real Multiplayer Marketplace
- **Live Trading**: Buy and sell items with real players worldwide
- **Real-time Updates**: See new listings and purchases as they happen
- **Player Names**: Each player has a unique name displayed on listings
- **Online Player Count**: See how many players are currently online
- **Limited Listings**: Each player can have up to 5 active listings (creates scarcity)

### Gameplay
1. **Choose Your Civilization**: Select one of three currency types
2. **Enter Your Name**: Choose a player name for the marketplace
3. **Click to Earn**: Click the currency button to earn currency
4. **Buy Upgrades**: Purchase upgrades to multiply your click power
5. **Buy Buildings**: Purchase buildings to generate passive income
6. **Rebirth**: Spend 1 Trillion currency to rebirth and unlock the marketplace
7. **Trade Items**: Buy items from other players, equip them for bonuses, or list your own!

### Item System
- **Item Benefits**: Items provide real gameplay bonuses (click power and production multipliers)
- **Rarity Tiers**: Common, Rare, Epic, and Legendary items with increasing power
- **Equip System**: Equip items to gain their benefits
- **Marketplace Trading**: List items for sale and buy from other players

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Google OAuth (Optional but Recommended)**
   
   To enable Google account saving:
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable the Google+ API
   
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   
   e. Configure the OAuth consent screen
   
   f. Create OAuth 2.0 credentials:
      - Application type: Web application
      - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
      - (For production, add your production URL)
   
   g. Copy the Client ID and Client Secret
   
   h. Create a `.env` file in the project root:
      ```env
      GOOGLE_CLIENT_ID=your-client-id-here
      GOOGLE_CLIENT_SECRET=your-client-secret-here
      GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
      SESSION_SECRET=your-random-secret-key-here
      PORT=3000
      ```
   
   **Note**: You can run the game without Google OAuth, but progress will only be saved locally in your browser.

3. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - The server will start on `http://localhost:3000`
   - Open this URL in your browser
   - Sign in with Google to save your progress across devices!
   - Multiple players can connect to the same server!

### Deployment

**Quick Deploy**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Recommended Platforms**:
- **Render** (Easiest) - Free tier, auto-deploy from GitHub
- **Railway** - Simple setup, $5/month credit
- **Fly.io** - Good for WebSocket apps

**Quick Steps**:
1. Push your code to GitHub
2. Sign up on Render/Railway/Fly.io
3. Connect your GitHub repo
4. Add environment variables (see DEPLOYMENT.md)
5. Deploy!

**Important**: Update your Google OAuth callback URL in Google Cloud Console to match your deployed URL.

## How to Play

1. **Start the Server**: Run `npm start` in the project directory
2. **Open Browser**: Navigate to `http://localhost:3000`
3. **Enter Name**: Choose your player name
4. **Select Civilization**: Choose Red Circle, Blue Square, or Yellow Triangle
5. **Start Clicking**: Earn currency by clicking
6. **Buy Upgrades & Buildings**: Increase your income
7. **Reach 1 Trillion**: Rebirth to unlock the marketplace
8. **Trade**: Buy items from other players or list your own!

## Account & Save System

- **Google Sign-In**: Sign in with your Google account to save progress
- **Cloud Saves**: Your game progress is saved to the server and synced across devices
- **Auto-Save**: Game automatically saves every 30 seconds when signed in
- **Local Backup**: Progress is also saved locally as a backup
- **Save Status Indicator**: See when your game was last saved

## Multiplayer Features

- **Real-time Marketplace**: See listings from all connected players
- **Live Updates**: New listings and purchases appear instantly
- **Player Identification**: Each listing shows the seller's name
- **Purchase Notifications**: Get notified when someone buys your items
- **Connection Status**: See if you're connected to the server

## Technical Details

- **Backend**: Node.js with Express and Socket.io
- **Real-time Communication**: WebSocket connections for instant updates
- **Data Storage**: JSON file-based storage (can be upgraded to a database)
- **Client**: Vanilla JavaScript with Socket.io client

## Notes

- The server stores marketplace data in `marketplace-data.json`
- Player game state is saved locally in browser localStorage
- Listings expire after 1 hour of inactivity
- The server automatically cleans up old listings

Enjoy trading with players from around the world!
