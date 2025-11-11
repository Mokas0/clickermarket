require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'clickermarket-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const userData = {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0].value,
            provider: 'google'
        };
        return done(null, userData);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// CORS configuration
const corsOptions = {
    origin: isProduction 
        ? process.env.ALLOWED_ORIGINS?.split(',') || true 
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(__dirname));

// Data storage
const DATA_FILE = path.join(__dirname, 'marketplace-data.json');
const USERS_FILE = path.join(__dirname, 'users-data.json');

// In-memory data (loaded from file)
let marketplaceData = {
    listings: [],
    players: {},
    onlinePlayers: new Set()
};

// User accounts data
let usersData = {};

// Load users data
async function loadUsersData() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        usersData = JSON.parse(data);
    } catch (error) {
        console.log('No existing users data file, starting fresh');
        usersData = {};
        await saveUsersData();
    }
}

// Save users data
async function saveUsersData() {
    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));
}

// Load data from file
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        marketplaceData = { ...marketplaceData, ...JSON.parse(data) };
        marketplaceData.onlinePlayers = new Set();
    } catch (error) {
        console.log('No existing data file, starting fresh');
        await saveData();
    }
}

// Save data to file
async function saveData() {
    const dataToSave = {
        listings: marketplaceData.listings,
        players: marketplaceData.players
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
}

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Clean up old listings (older than 1 hour)
function cleanupOldListings() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    marketplaceData.listings = marketplaceData.listings.filter(
        listing => listing.timestamp > oneHourAgo
    );
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    let playerId = null;
    let playerName = null;
    
    // Player registration
    socket.on('register', (data) => {
        playerId = data.playerId || generatePlayerId();
        playerName = data.playerName || `Player${playerId.slice(-6)}`;
        
        // Store player info
        if (!marketplaceData.players[playerId]) {
            marketplaceData.players[playerId] = {
                id: playerId,
                name: playerName,
                civilization: data.civilization,
                joinedAt: Date.now()
            };
        }
        
        marketplaceData.onlinePlayers.add(playerId);
        socket.playerId = playerId;
        
        socket.emit('registered', {
            playerId: playerId,
            playerName: playerName
        });
        
        // Send current marketplace state
        socket.emit('marketplace-update', {
            listings: marketplaceData.listings,
            onlineCount: marketplaceData.onlinePlayers.size
        });
        
        // Broadcast online count update
        io.emit('online-count-update', {
            count: marketplaceData.onlinePlayers.size
        });
        
        console.log(`Player registered: ${playerName} (${playerId})`);
    });
    
    // Get marketplace listings
    socket.on('get-listings', () => {
        cleanupOldListings();
        socket.emit('marketplace-update', {
            listings: marketplaceData.listings,
            onlineCount: marketplaceData.onlinePlayers.size
        });
    });
    
    // Create listing
    socket.on('create-listing', async (data) => {
        if (!playerId) {
            socket.emit('error', { message: 'Not registered' });
            return;
        }
        
        const listing = {
            id: 'listing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            itemId: data.itemId,
            sellerId: playerId,
            sellerName: playerName,
            price: data.price,
            timestamp: Date.now()
        };
        
        marketplaceData.listings.push(listing);
        await saveData();
        
        // Broadcast new listing to all players
        io.emit('listing-added', listing);
        
        socket.emit('listing-created', listing);
        console.log(`Listing created by ${playerName}: ${data.itemId} for ${data.price}`);
    });
    
    // Cancel listing
    socket.on('cancel-listing', async (data) => {
        if (!playerId) {
            socket.emit('error', { message: 'Not registered' });
            return;
        }
        
        const listingIndex = marketplaceData.listings.findIndex(
            l => l.id === data.listingId && l.sellerId === playerId
        );
        
        if (listingIndex !== -1) {
            const listing = marketplaceData.listings[listingIndex];
            marketplaceData.listings.splice(listingIndex, 1);
            await saveData();
            
            // Broadcast listing removal
            io.emit('listing-removed', { listingId: data.listingId });
            
            socket.emit('listing-cancelled', { listingId: data.listingId });
            console.log(`Listing cancelled by ${playerName}: ${data.listingId}`);
        }
    });
    
    // Buy listing
    socket.on('buy-listing', async (data) => {
        if (!playerId) {
            socket.emit('error', { message: 'Not registered' });
            return;
        }
        
        const listingIndex = marketplaceData.listings.findIndex(
            l => l.id === data.listingId
        );
        
        if (listingIndex === -1) {
            socket.emit('error', { message: 'Listing not found' });
            return;
        }
        
        const listing = marketplaceData.listings[listingIndex];
        
        // Remove listing
        marketplaceData.listings.splice(listingIndex, 1);
        await saveData();
        
        // Broadcast purchase
        io.emit('listing-purchased', {
            listingId: data.listingId,
            buyerId: playerId,
            buyerName: playerName,
            sellerId: listing.sellerId,
            sellerName: listing.sellerName,
            itemId: listing.itemId,
            price: listing.price
        });
        
        socket.emit('purchase-success', {
            listingId: data.listingId,
            itemId: listing.itemId
        });
        
        console.log(`${playerName} bought ${listing.itemId} from ${listing.sellerName} for ${listing.price}`);
    });
    
    // Update player game state
    socket.on('update-game-state', async (data) => {
        if (!playerId) return;
        
        if (marketplaceData.players[playerId]) {
            marketplaceData.players[playerId].gameState = data.gameState;
            // Don't save on every update, too frequent
        }
    });
    
    // Get player's listings
    socket.on('get-my-listings', () => {
        if (!playerId) {
            socket.emit('error', { message: 'Not registered' });
            return;
        }
        
        const myListings = marketplaceData.listings.filter(
            l => l.sellerId === playerId
        );
        
        socket.emit('my-listings', myListings);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        if (playerId) {
            marketplaceData.onlinePlayers.delete(playerId);
            io.emit('online-count-update', {
                count: marketplaceData.onlinePlayers.size
            });
            console.log(`Player disconnected: ${playerName} (${playerId})`);
        }
    });
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        
        // Initialize user data if doesn't exist
        if (!usersData[user.id]) {
            usersData[user.id] = {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                gameState: null,
                createdAt: Date.now(),
                lastLogin: Date.now()
            };
            saveUsersData();
        } else {
            usersData[user.id].lastLogin = Date.now();
            saveUsersData();
        }
        
        res.redirect('/?auth=success');
    }
);

// Logout route
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

// Get current user
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        const userData = usersData[req.user.id];
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                picture: req.user.picture
            },
            hasGameState: userData && userData.gameState !== null
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Save game state
app.post('/api/save', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const userId = req.user.id;
        if (!usersData[userId]) {
            usersData[userId] = {
                id: userId,
                email: req.user.email,
                name: req.user.name,
                picture: req.user.picture,
                gameState: null,
                createdAt: Date.now(),
                lastLogin: Date.now()
            };
        }
        
        usersData[userId].gameState = req.body.gameState;
        usersData[userId].lastSave = Date.now();
        await saveUsersData();
        
        res.json({ success: true, message: 'Game state saved' });
    } catch (error) {
        console.error('Error saving game state:', error);
        res.status(500).json({ error: 'Failed to save game state' });
    }
});

// Load game state
app.get('/api/load', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const userId = req.user.id;
        const userData = usersData[userId];
        
        if (userData && userData.gameState) {
            res.json({ success: true, gameState: userData.gameState });
        } else {
            res.json({ success: false, message: 'No saved game state' });
        }
    } catch (error) {
        console.error('Error loading game state:', error);
        res.status(500).json({ error: 'Failed to load game state' });
    }
});

// API endpoint to get marketplace stats
app.get('/api/stats', (req, res) => {
    res.json({
        totalListings: marketplaceData.listings.length,
        onlinePlayers: marketplaceData.onlinePlayers.size,
        totalPlayers: Object.keys(marketplaceData.players).length
    });
});

// Cleanup old listings periodically
setInterval(() => {
    cleanupOldListings();
    saveData();
}, 5 * 60 * 1000); // Every 5 minutes

// Initialize
const PORT = process.env.PORT || 3000;

Promise.all([loadData(), loadUsersData()]).then(() => {
    server.listen(PORT, () => {
        console.log(`ClickerMarket server running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT} in your browser`);
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.warn('WARNING: GOOGLE_CLIENT_ID not set. Google authentication will not work.');
            console.warn('Create a .env file with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
        }
    });
});

