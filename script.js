// Game State
let gameState = {
    civilization: null,
    currency: 0,
    currencyPerClick: 1,
    currencyPerSecond: 0,
    rebirths: 0,
    hasRebirthed: false,
    upgrades: {},
    buildings: {},
    inventory: [],
    equippedItems: [],
    listings: [], // Player's active listings (local tracking)
    lastUpdate: Date.now(),
    lastMarketUpdate: Date.now()
};

// Maximum listing slots
const MAX_LISTINGS = 5;

// Socket.io connection
let socket = null;
let playerId = null;
let playerName = null;
let isConnected = false;

// Authentication state
let isAuthenticated = false;
let currentUser = null;
let autoSaveInterval = null;

// Real online marketplace listings (from other players)
let onlineMarketplace = [];

// Currency configurations
const currencies = {
    red: {
        name: 'Red Circles',
        icon: 'red-circle',
        color: '#e74c3c'
    },
    blue: {
        name: 'Blue Squares',
        icon: 'blue-square',
        color: '#3498db'
    },
    yellow: {
        name: 'Yellow Triangles',
        icon: 'yellow-triangle',
        color: '#f1c40f'
    }
};

// Upgrades data
const upgradesData = [
    { id: 'click1', name: 'Better Cursor', description: 'Doubles click power', cost: 10, effect: { clickMultiplier: 2 } },
    { id: 'click2', name: 'Reinforced Cursor', description: 'Triples click power', cost: 100, effect: { clickMultiplier: 3 } },
    { id: 'click3', name: 'Carbon Cursor', description: '5x click power', cost: 1000, effect: { clickMultiplier: 5 } },
    { id: 'click4', name: 'Adamantium Cursor', description: '10x click power', cost: 10000, effect: { clickMultiplier: 10 } },
    { id: 'click5', name: 'Unobtanium Cursor', description: '20x click power', cost: 100000, effect: { clickMultiplier: 20 } },
    { id: 'click6', name: 'Quantum Cursor', description: '50x click power', cost: 1000000, effect: { clickMultiplier: 50 } },
    { id: 'click7', name: 'Reality Cursor', description: '100x click power', cost: 10000000, effect: { clickMultiplier: 100 } }
];

// Buildings data
const buildingsData = [
    { id: 'generator1', name: 'Currency Generator', description: 'Produces 1 currency/sec', cost: 50, production: 1 },
    { id: 'generator2', name: 'Currency Factory', description: 'Produces 5 currency/sec', cost: 500, production: 5 },
    { id: 'generator3', name: 'Currency Plant', description: 'Produces 25 currency/sec', cost: 5000, production: 25 },
    { id: 'generator4', name: 'Currency Mine', description: 'Produces 100 currency/sec', cost: 50000, production: 100 },
    { id: 'generator5', name: 'Currency Forge', description: 'Produces 500 currency/sec', cost: 500000, production: 500 },
    { id: 'generator6', name: 'Currency Nexus', description: 'Produces 2500 currency/sec', cost: 5000000, production: 2500 },
    { id: 'generator7', name: 'Currency Dimension', description: 'Produces 10000 currency/sec', cost: 50000000, production: 10000 }
];

// Marketplace items with benefits
const marketplaceItems = [
    { 
        id: 'item1', 
        name: 'Digital Coin', 
        rarity: 'common', 
        description: 'A basic digital collectible that boosts click power', 
        basePrice: 1000,
        effects: { clickMultiplier: 1.1 } // +10% click power
    },
    { 
        id: 'item2', 
        name: 'Virtual Gem', 
        rarity: 'rare', 
        description: 'A rare virtual gemstone that enhances production', 
        basePrice: 10000,
        effects: { productionMultiplier: 1.15 } // +15% production
    },
    { 
        id: 'item3', 
        name: 'Cyber Artifact', 
        rarity: 'epic', 
        description: 'An epic cyber artifact that boosts both click and production', 
        basePrice: 100000,
        effects: { clickMultiplier: 1.2, productionMultiplier: 1.2 } // +20% both
    },
    { 
        id: 'item4', 
        name: 'Quantum Token', 
        rarity: 'legendary', 
        description: 'A legendary quantum token with massive click power boost', 
        basePrice: 1000000,
        effects: { clickMultiplier: 1.5 } // +50% click power
    },
    { 
        id: 'item5', 
        name: 'Reality Fragment', 
        rarity: 'legendary', 
        description: 'A fragment of reality itself - massive production boost', 
        basePrice: 10000000,
        effects: { productionMultiplier: 1.75 } // +75% production
    },
    { 
        id: 'item6', 
        name: 'Cosmic Relic', 
        rarity: 'epic', 
        description: 'A relic from the cosmos - powerful production enhancer', 
        basePrice: 500000,
        effects: { productionMultiplier: 1.35 } // +35% production
    },
    { 
        id: 'item7', 
        name: 'Neural Interface', 
        rarity: 'rare', 
        description: 'A rare neural interface chip - balanced boost', 
        basePrice: 50000,
        effects: { clickMultiplier: 1.12, productionMultiplier: 1.12 } // +12% both
    },
    { 
        id: 'item8', 
        name: 'Data Crystal', 
        rarity: 'common', 
        description: 'A common data storage crystal - small production boost', 
        basePrice: 5000,
        effects: { productionMultiplier: 1.08 } // +8% production
    },
    {
        id: 'item9',
        name: 'Mythic Core',
        rarity: 'legendary',
        description: 'The ultimate item - massive boosts to everything',
        basePrice: 50000000,
        effects: { clickMultiplier: 2.0, productionMultiplier: 2.0 } // +100% both
    }
];

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/user', { credentials: 'include' });
        const data = await response.json();
        
        if (data.authenticated) {
            isAuthenticated = true;
            currentUser = data.user;
            updateAuthUI(data);
            
            // Load game state if available
            if (data.hasGameState) {
                loadGameFromServer();
            }
        } else {
            isAuthenticated = false;
            currentUser = null;
            updateAuthUI(data);
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        updateAuthUI({ authenticated: false });
    }
}

// Update authentication UI
function updateAuthUI(authData) {
    const notSignedIn = document.getElementById('not-signed-in');
    const signedIn = document.getElementById('signed-in');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPicture = document.getElementById('user-picture');
    
    if (authData.authenticated && authData.user) {
        notSignedIn.classList.add('hidden');
        signedIn.classList.remove('hidden');
        if (userName) userName.textContent = authData.user.name;
        if (userEmail) userEmail.textContent = authData.user.email;
        if (userPicture) userPicture.src = authData.user.picture;
    } else {
        notSignedIn.classList.remove('hidden');
        signedIn.classList.add('hidden');
    }
}

// Load game state from server
async function loadGameFromServer() {
    try {
        const response = await fetch('/api/load', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.gameState) {
            // Merge server game state with current state
            gameState = { ...gameState, ...data.gameState };
            gameState.lastUpdate = Date.now();
            
            // Recalculate stats
            recalculateStats();
            
            // Update UI
            updateUI();
            
            // If civilization is set, show game screen
            if (gameState.civilization) {
                document.getElementById('civilization-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                startGame();
            }
            
            showNotification('Game progress loaded from cloud!');
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Save game state to server
async function saveGameToServer() {
    if (!isAuthenticated) return;
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ gameState: gameState })
        });
        
        const data = await response.json();
        if (data.success) {
            updateSaveStatus('Saved', true);
        } else {
            updateSaveStatus('Save failed', false);
        }
    } catch (error) {
        console.error('Error saving game state:', error);
        updateSaveStatus('Save failed', false);
    }
}

// Update save status indicator
function updateSaveStatus(text, success) {
    const saveIndicator = document.getElementById('save-indicator');
    const saveText = document.getElementById('save-text');
    
    if (saveIndicator) {
        saveIndicator.style.color = success ? '#27ae60' : '#e74c3c';
    }
    if (saveText) {
        saveText.textContent = text;
        setTimeout(() => {
            if (saveText) saveText.textContent = 'Auto-saving...';
        }, 2000);
    }
}

// Initialize Socket.io connection
function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        isConnected = true;
        updateConnectionStatus('Connected', true);
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        isConnected = false;
        updateConnectionStatus('Disconnected', false);
        console.log('Disconnected from server');
    });
    
    socket.on('connect_error', (error) => {
        isConnected = false;
        updateConnectionStatus('Connection failed', false);
        console.error('Connection error:', error);
    });
    
    socket.on('registered', (data) => {
        playerId = data.playerId;
        playerName = data.playerName;
        document.getElementById('player-display-name').textContent = `Player: ${playerName}`;
        console.log('Registered as:', playerName, playerId);
    });
    
    socket.on('marketplace-update', (data) => {
        onlineMarketplace = data.listings || [];
        updateOnlinePlayerCount(data.onlineCount || 0);
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('listing-added', (listing) => {
        onlineMarketplace.push(listing);
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('listing-removed', (data) => {
        onlineMarketplace = onlineMarketplace.filter(l => l.id !== data.listingId);
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('listing-purchased', (data) => {
        // Remove purchased listing
        onlineMarketplace = onlineMarketplace.filter(l => l.id !== data.listingId);
        
        // If it was our listing, remove from local tracking and add currency
        const wasMyListing = gameState.listings.some(l => l.id === data.listingId);
        if (wasMyListing) {
            gameState.listings = gameState.listings.filter(l => l.id !== data.listingId);
            // Add currency from sale
            gameState.currency += data.price;
            showNotification(`${data.buyerName} bought your ${getItemName(data.itemId)} for ${formatNumber(data.price)}!`);
        }
        
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('online-count-update', (data) => {
        updateOnlinePlayerCount(data.count || 0);
    });
    
    socket.on('my-listings', (listings) => {
        // Sync server listings with local state
        gameState.listings = listings.map(l => ({
            id: l.id,
            itemId: l.itemId,
            price: l.price
        }));
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('listing-created', (listing) => {
        // Add to local listings
        gameState.listings.push({
            id: listing.id,
            itemId: listing.itemId,
            price: listing.price
        });
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('listing-cancelled', (data) => {
        // Remove from local listings
        gameState.listings = gameState.listings.filter(l => l.id !== data.listingId);
        if (gameState.hasRebirthed) {
            updateMarketplaceUI();
        }
    });
    
    socket.on('purchase-success', (data) => {
        // Purchase confirmed by server
        showNotification(`Successfully purchased ${getItemName(data.itemId)}!`);
    });
    
    socket.on('error', (data) => {
        console.error('Server error:', data.message);
        alert('Error: ' + data.message);
    });
}

// Update connection status UI
function updateConnectionStatus(text, connected) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');
    const connectionStatus = document.getElementById('connection-status');
    
    if (statusText) statusText.textContent = text;
    if (statusDot) {
        statusDot.style.background = connected ? '#27ae60' : '#e74c3c';
    }
    if (connectionStatus) {
        connectionStatus.style.color = connected ? '#27ae60' : '#e74c3c';
    }
}

// Show notification
function showNotification(message) {
    // Simple notification - could be enhanced with a toast library
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get item name by ID
function getItemName(itemId) {
    const item = marketplaceItems.find(i => i.id === itemId);
    return item ? item.name : 'item';
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toLocaleString();
}

// Initialize civilization selection
function initCivilizationSelection() {
    const cards = document.querySelectorAll('.civilization-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const civilization = card.dataset.civilization;
            selectCivilization(civilization);
        });
    });
}

// Select civilization
function selectCivilization(civilization) {
    gameState.civilization = civilization;
    
    // Get player name
    const nameInput = document.getElementById('player-name');
    const enteredName = nameInput.value.trim() || `Player${Math.floor(Math.random() * 10000)}`;
    
    // Register with server
    if (socket && isConnected) {
        socket.emit('register', {
            playerId: playerId, // Will be generated if null
            playerName: enteredName,
            civilization: civilization
        });
    }
    
    document.getElementById('civilization-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateUI();
    startGame();
}

// Start game loop
function startGame() {
    updateUI();
    setInterval(gameLoop, 100);
    loadGame();
    
    // Request marketplace listings if rebirthed
    if (gameState.hasRebirthed && socket && isConnected) {
        socket.emit('get-listings');
        socket.emit('get-my-listings');
    }
}

// Game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastUpdate) / 1000;
    gameState.lastUpdate = now;
    
    // Add passive income (with item bonuses)
    if (gameState.currencyPerSecond > 0) {
        const productionMultiplier = calculateProductionMultiplier();
        gameState.currency += gameState.currencyPerSecond * productionMultiplier * deltaTime;
    }
    
    // Request marketplace updates every 10 seconds
    if (now - gameState.lastMarketUpdate > 10000 && socket && isConnected && gameState.hasRebirthed) {
        socket.emit('get-listings');
        socket.emit('get-my-listings');
        gameState.lastMarketUpdate = now;
    }
    
    updateUI();
}

// Calculate production multiplier from equipped items
function calculateProductionMultiplier() {
    let multiplier = 1;
    gameState.equippedItems.forEach(itemId => {
        const item = marketplaceItems.find(i => i.id === itemId);
        if (item && item.effects.productionMultiplier) {
            multiplier *= item.effects.productionMultiplier;
        }
    });
    return multiplier;
}

// Calculate click multiplier from equipped items
function calculateClickMultiplier() {
    let multiplier = 1;
    gameState.equippedItems.forEach(itemId => {
        const item = marketplaceItems.find(i => i.id === itemId);
        if (item && item.effects.clickMultiplier) {
            multiplier *= item.effects.clickMultiplier;
        }
    });
    return multiplier;
}

// Marketplace is now updated via Socket.io events

// Update UI
function updateUI() {
    if (!gameState.civilization) return;
    
    const currency = currencies[gameState.civilization];
    
    // Update currency display
    document.getElementById('currency-name').textContent = currency.name;
    document.getElementById('currency-amount').textContent = formatNumber(gameState.currency);
    document.getElementById('currency-per-second').textContent = formatNumber(gameState.currencyPerSecond) + '/sec';
    
    // Update icons
    const iconClass = currency.icon;
    document.getElementById('currency-icon').className = `currency-icon-large ${iconClass}`;
    document.getElementById('click-icon').className = `click-icon ${iconClass}`;
    
    // Update civilization name
    document.getElementById('civilization-name').textContent = `Civilization: ${currency.name}`;
    document.getElementById('rebirth-count').textContent = `Rebirths: ${gameState.rebirths}`;
    
    // Update upgrades
    updateUpgradesUI();
    
    // Update buildings
    updateBuildingsUI();
    
    // Update rebirth button
    const rebirthCost = 1e12;
    document.getElementById('rebirth-cost').textContent = formatNumber(rebirthCost);
    document.getElementById('rebirth-button').disabled = gameState.currency < rebirthCost;
    
    // Update item bonuses display
    updateItemBonuses();
    
    // Show marketplace if rebirthed
    if (gameState.hasRebirthed) {
        document.getElementById('marketplace-section').classList.remove('hidden');
        updateMarketplaceUI();
        updateOnlinePlayerCount();
    }
    
    // Save game
    saveGame();
}

// Update item bonuses display
function updateItemBonuses() {
    const clickMult = calculateClickMultiplier();
    const productionMult = calculateProductionMultiplier();
    
    const clickBonus = ((clickMult - 1) * 100).toFixed(1);
    const productionBonus = ((productionMult - 1) * 100).toFixed(1);
    
    if (clickBonus > 0 || productionBonus > 0) {
        document.getElementById('item-bonuses').style.display = 'block';
        document.getElementById('click-bonus').textContent = `+${clickBonus}%`;
        document.getElementById('production-bonus').textContent = `+${productionBonus}%`;
    } else {
        document.getElementById('item-bonuses').style.display = 'none';
    }
}

// Update online player count
function updateOnlinePlayerCount(count) {
    if (document.getElementById('online-players')) {
        document.getElementById('online-players').textContent = `${count.toLocaleString()} players online`;
    }
}

// Update upgrades UI
function updateUpgradesUI() {
    const upgradesList = document.getElementById('upgrades-list');
    upgradesList.innerHTML = '';
    
    upgradesData.forEach(upgrade => {
        const owned = gameState.upgrades[upgrade.id] || 0;
        const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
        const canAfford = gameState.currency >= cost;
        
        const item = document.createElement('div');
        item.className = `upgrade-item ${canAfford ? '' : 'disabled'}`;
        item.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name} (${owned})</div>
                <div class="upgrade-description">${upgrade.description}</div>
            </div>
            <div class="upgrade-cost">${formatNumber(cost)}</div>
            <button class="buy-button" ${canAfford ? '' : 'disabled'} onclick="buyUpgrade('${upgrade.id}')">Buy</button>
        `;
        upgradesList.appendChild(item);
    });
}

// Update buildings UI
function updateBuildingsUI() {
    const buildingsList = document.getElementById('buildings-list');
    buildingsList.innerHTML = '';
    
    buildingsData.forEach(building => {
        const owned = gameState.buildings[building.id] || 0;
        const cost = Math.floor(building.cost * Math.pow(1.15, owned));
        const canAfford = gameState.currency >= cost;
        
        const item = document.createElement('div');
        item.className = `building-item ${canAfford ? '' : 'disabled'}`;
        item.innerHTML = `
            <div class="building-info">
                <div class="building-name">${building.name} (${owned})</div>
                <div class="building-description">${building.description}</div>
            </div>
            <div class="building-cost">${formatNumber(cost)}</div>
            <button class="buy-button" ${canAfford ? '' : 'disabled'} onclick="buyBuilding('${building.id}')">Buy</button>
        `;
        buildingsList.appendChild(item);
    });
}

// Buy upgrade
function buyUpgrade(upgradeId) {
    const upgrade = upgradesData.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const owned = gameState.upgrades[upgradeId] || 0;
    const cost = Math.floor(upgrade.cost * Math.pow(1.5, owned));
    
    if (gameState.currency >= cost) {
        gameState.currency -= cost;
        gameState.upgrades[upgradeId] = (gameState.upgrades[upgradeId] || 0) + 1;
        
        // Apply upgrade effect
        if (upgrade.effect.clickMultiplier) {
            gameState.currencyPerClick = 1;
            // Recalculate total click multiplier
            upgradesData.forEach(u => {
                const count = gameState.upgrades[u.id] || 0;
                if (u.effect.clickMultiplier) {
                    gameState.currencyPerClick *= Math.pow(u.effect.clickMultiplier, count);
                }
            });
        }
        
        updateUI();
    }
}

// Buy building
function buyBuilding(buildingId) {
    const building = buildingsData.find(b => b.id === buildingId);
    if (!building) return;
    
    const owned = gameState.buildings[buildingId] || 0;
    const cost = Math.floor(building.cost * Math.pow(1.15, owned));
    
    if (gameState.currency >= cost) {
        gameState.currency -= cost;
        gameState.buildings[buildingId] = (gameState.buildings[buildingId] || 0) + 1;
        
        // Recalculate production
        gameState.currencyPerSecond = 0;
        buildingsData.forEach(b => {
            const count = gameState.buildings[b.id] || 0;
            gameState.currencyPerSecond += b.production * count;
        });
        
        updateUI();
    }
}

// Click currency
function clickCurrency() {
    const clickMultiplier = calculateClickMultiplier();
    gameState.currency += gameState.currencyPerClick * clickMultiplier;
    
    // Visual feedback
    const icon = document.getElementById('currency-icon');
    icon.style.transform = 'scale(1.2)';
    setTimeout(() => {
        icon.style.transform = 'scale(1)';
    }, 100);
    
    updateUI();
}

// Rebirth
function rebirth() {
    const rebirthCost = 1e12;
    if (gameState.currency < rebirthCost) return;
    
    if (confirm(`Are you sure you want to rebirth? This will reset your currency, upgrades, and buildings, but unlock the marketplace!`)) {
        gameState.currency = 0;
        gameState.currencyPerClick = 1;
        gameState.currencyPerSecond = 0;
        gameState.upgrades = {};
        gameState.buildings = {};
        // Keep inventory, equipped items, and listings on rebirth
        gameState.rebirths++;
        gameState.hasRebirthed = true;
        
        // Request marketplace listings
        if (socket && isConnected) {
            socket.emit('get-listings');
            socket.emit('get-my-listings');
        }
        
        updateUI();
    }
}

// Update marketplace UI
function updateMarketplaceUI() {
    const activeTab = document.querySelector('.tab-button.active')?.dataset.tab || 'browse';
    const content = document.getElementById('marketplace-content');
    content.innerHTML = '';
    
    // Update listing count badge
    document.getElementById('listing-count').textContent = `${gameState.listings.length}/${MAX_LISTINGS}`;
    
    if (activeTab === 'browse') {
        // Show online marketplace listings from real players
        if (!isConnected) {
            content.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Not connected to server. Please refresh the page.</p>';
        } else if (onlineMarketplace.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No listings available. Be the first to list an item!</p>';
        } else {
            // Filter out own listings
            const otherListings = onlineMarketplace.filter(l => l.sellerId !== playerId);
            
            if (otherListings.length === 0) {
                content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No listings from other players. Check back soon!</p>';
            } else {
                otherListings.forEach(listing => {
                    const item = marketplaceItems.find(i => i.id === listing.itemId);
                    if (!item) return;
                    
                    const effectsText = getItemEffectsText(item);
                    const card = document.createElement('div');
                    card.className = 'item-card';
                    card.innerHTML = `
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <span class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                            <div class="item-description">${item.description}</div>
                            <div class="item-effects">${effectsText}</div>
                            <div class="seller-info">Seller: <strong>${listing.sellerName || 'Unknown'}</strong></div>
                        </div>
                        <div class="item-price">${formatNumber(listing.price)}</div>
                        <button class="buy-button" ${gameState.currency >= listing.price ? '' : 'disabled'} 
                            onclick="buyFromMarketplace('${listing.id}')">Buy Now</button>
                    `;
                    content.appendChild(card);
                });
            }
        }
    } else if (activeTab === 'listings') {
        // Show player's active listings
        if (gameState.listings.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">You have no active listings. List items from your inventory!</p>';
        } else {
            gameState.listings.forEach(listing => {
                const item = marketplaceItems.find(i => i.id === listing.itemId);
                if (!item) return;
                
                const effectsText = getItemEffectsText(item);
                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <span class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                        <div class="item-description">${item.description}</div>
                        <div class="item-effects">${effectsText}</div>
                    </div>
                    <div class="item-price">${formatNumber(listing.price)}</div>
                    <button class="buy-button" onclick="cancelListing('${listing.id}')">Cancel Listing</button>
                `;
                content.appendChild(card);
            });
        }
        
        // Show inventory items that can be listed
        const inventoryCounts = {};
        gameState.inventory.forEach(itemId => {
            inventoryCounts[itemId] = (inventoryCounts[itemId] || 0) + 1;
        });
        
        const canListMore = gameState.listings.length < MAX_LISTINGS;
        if (canListMore && Object.keys(inventoryCounts).length > 0) {
            const divider = document.createElement('div');
            divider.className = 'listing-divider';
            divider.innerHTML = '<h4>List Items from Inventory:</h4>';
            content.appendChild(divider);
            
            Object.keys(inventoryCounts).forEach(itemId => {
                const item = marketplaceItems.find(i => i.id === itemId);
                if (!item) return;
                
                const count = inventoryCounts[itemId];
                const alreadyListed = gameState.listings.filter(l => l.itemId === itemId).length;
                const availableToList = count - alreadyListed;
                
                if (availableToList > 0) {
                    const suggestedPrice = Math.floor(item.basePrice * (0.8 + Math.random() * 0.4));
                    const card = document.createElement('div');
                    card.className = 'item-card';
                    card.innerHTML = `
                        <div class="item-info">
                            <div class="item-name">${item.name} (${availableToList} available)</div>
                            <span class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                        </div>
                        <div class="listing-input">
                            <input type="number" id="price-${itemId}" value="${suggestedPrice}" min="${item.basePrice * 0.5}" max="${item.basePrice * 2}" class="price-input">
                            <button class="buy-button" onclick="createListing('${itemId}')">List Item</button>
                        </div>
                    `;
                    content.appendChild(card);
                }
            });
        }
    } else if (activeTab === 'inventory') {
        // Show inventory with equip/unequip options
        const inventoryCounts = {};
        gameState.inventory.forEach(itemId => {
            inventoryCounts[itemId] = (inventoryCounts[itemId] || 0) + 1;
        });
        
        Object.keys(inventoryCounts).forEach(itemId => {
            const item = marketplaceItems.find(i => i.id === itemId);
            if (!item) return;
            
            const count = inventoryCounts[itemId];
            const equippedCount = gameState.equippedItems.filter(id => id === itemId).length;
            const effectsText = getItemEffectsText(item);
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name} (x${count})</div>
                    <span class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                    <div class="item-description">${item.description}</div>
                    <div class="item-effects">${effectsText}</div>
                    ${equippedCount > 0 ? `<div class="equipped-badge">Equipped: ${equippedCount}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${equippedCount < count ? `<button class="buy-button" onclick="equipItem('${itemId}')">Equip</button>` : ''}
                    ${equippedCount > 0 ? `<button class="buy-button" onclick="unequipItem('${itemId}')">Unequip</button>` : ''}
                </div>
            `;
            content.appendChild(card);
        });
        
        if (gameState.inventory.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Your inventory is empty. Buy items from the Browse Market tab!</p>';
        }
    } else if (activeTab === 'equipped') {
        // Show equipped items
        const equippedCounts = {};
        gameState.equippedItems.forEach(itemId => {
            equippedCounts[itemId] = (equippedCounts[itemId] || 0) + 1;
        });
        
        if (Object.keys(equippedCounts).length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No items equipped. Equip items from your inventory to gain benefits!</p>';
        } else {
            Object.keys(equippedCounts).forEach(itemId => {
                const item = marketplaceItems.find(i => i.id === itemId);
                if (!item) return;
                
                const count = equippedCounts[itemId];
                const effectsText = getItemEffectsText(item);
                const card = document.createElement('div');
                card.className = 'item-card equipped-item';
                card.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${item.name} (x${count})</div>
                        <span class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                        <div class="item-description">${item.description}</div>
                        <div class="item-effects">${effectsText}</div>
                    </div>
                    <button class="buy-button" onclick="unequipItem('${itemId}')">Unequip</button>
                `;
                content.appendChild(card);
            });
        }
    }
}

// Get item effects as text
function getItemEffectsText(item) {
    const effects = [];
    if (item.effects.clickMultiplier) {
        const bonus = ((item.effects.clickMultiplier - 1) * 100).toFixed(0);
        effects.push(`+${bonus}% Click Power`);
    }
    if (item.effects.productionMultiplier) {
        const bonus = ((item.effects.productionMultiplier - 1) * 100).toFixed(0);
        effects.push(`+${bonus}% Production`);
    }
    return effects.length > 0 ? `<div class="effects-text">Effects: ${effects.join(', ')}</div>` : '';
}

// Buy from online marketplace
function buyFromMarketplace(listingId) {
    const listing = onlineMarketplace.find(l => l.id == listingId);
    if (!listing) {
        alert('Listing not found. It may have been sold.');
        return;
    }
    
    if (gameState.currency < listing.price) {
        alert('Not enough currency!');
        return;
    }
    
    if (!socket || !isConnected) {
        alert('Not connected to server!');
        return;
    }
    
    // Send purchase request to server
    socket.emit('buy-listing', { listingId: listingId });
    
    // Optimistically update (server will confirm)
    gameState.currency -= listing.price;
    gameState.inventory.push(listing.itemId);
    updateUI();
}

// Create listing
function createListing(itemId) {
    if (!socket || !isConnected) {
        alert('Not connected to server!');
        return;
    }
    
    // Check current listings count
    if (gameState.listings.length >= MAX_LISTINGS) {
        alert(`You can only have ${MAX_LISTINGS} active listings at once!`);
        return;
    }
    
    // Check if item is in inventory
    const itemIndex = gameState.inventory.indexOf(itemId);
    if (itemIndex === -1) {
        alert('You don\'t have this item in your inventory!');
        return;
    }
    
    // Check if item is equipped
    const equippedIndex = gameState.equippedItems.indexOf(itemId);
    if (equippedIndex !== -1) {
        alert('Cannot list equipped items! Unequip it first.');
        return;
    }
    
    const priceInput = document.getElementById(`price-${itemId}`);
    const price = parseInt(priceInput.value);
    const item = marketplaceItems.find(i => i.id === itemId);
    
    if (!price || price < item.basePrice * 0.5 || price > item.basePrice * 2) {
        alert(`Price must be between ${formatNumber(item.basePrice * 0.5)} and ${formatNumber(item.basePrice * 2)}`);
        return;
    }
    
    // Send to server
    socket.emit('create-listing', {
        itemId: itemId,
        price: price
    });
    
    // Optimistically update
    gameState.inventory.splice(itemIndex, 1);
    updateUI();
}

// Cancel listing
function cancelListing(listingId) {
    if (!socket || !isConnected) {
        alert('Not connected to server!');
        return;
    }
    
    const listing = gameState.listings.find(l => l.id == listingId);
    if (!listing) return;
    
    // Send cancel request to server
    socket.emit('cancel-listing', { listingId: listingId });
    
    // Optimistically update
    gameState.inventory.push(listing.itemId);
    gameState.listings = gameState.listings.filter(l => l.id != listingId);
    updateUI();
}

// Equip item
function equipItem(itemId) {
    const itemIndex = gameState.inventory.indexOf(itemId);
    if (itemIndex === -1) return;
    
    // Check if item is listed
    const isListed = gameState.listings.some(l => l.itemId === itemId);
    if (isListed) {
        alert('Cannot equip listed items! Cancel the listing first.');
        return;
    }
    
    gameState.inventory.splice(itemIndex, 1);
    gameState.equippedItems.push(itemId);
    
    // Recalculate stats
    recalculateStats();
    updateUI();
}

// Unequip item
function unequipItem(itemId) {
    const equippedIndex = gameState.equippedItems.indexOf(itemId);
    if (equippedIndex === -1) return;
    
    gameState.equippedItems.splice(equippedIndex, 1);
    gameState.inventory.push(itemId);
    
    // Recalculate stats
    recalculateStats();
    updateUI();
}

// Recalculate game stats with item bonuses
function recalculateStats() {
    // Recalculate click power
    gameState.currencyPerClick = 1;
    upgradesData.forEach(u => {
        const count = gameState.upgrades[u.id] || 0;
        if (u.effect.clickMultiplier) {
            gameState.currencyPerClick *= Math.pow(u.effect.clickMultiplier, count);
        }
    });
    
    // Recalculate production
    gameState.currencyPerSecond = 0;
    buildingsData.forEach(b => {
        const count = gameState.buildings[b.id] || 0;
        gameState.currencyPerSecond += b.production * count;
    });
}

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateMarketplaceUI();
        });
    });
}

// Save game
function saveGame() {
    // Save to localStorage as backup
    const saveData = {
        ...gameState,
        playerName: playerName,
        playerId: playerId
    };
    localStorage.setItem('clickerMarketSave', JSON.stringify(saveData));
    
    // Save to server if authenticated
    if (isAuthenticated) {
        saveGameToServer();
    }
    
    // Also send to server via socket for marketplace sync
    if (socket && isConnected && playerId) {
        socket.emit('update-game-state', { gameState: gameState });
    }
}

// Load game
function loadGame() {
    const save = localStorage.getItem('clickerMarketSave');
    if (save) {
        try {
            const loaded = JSON.parse(save);
            // Only load if we have a civilization selected
            if (loaded.civilization && loaded.civilization === gameState.civilization) {
                gameState = { ...gameState, ...loaded };
                gameState.lastUpdate = Date.now();
                
                // Recalculate stats
                recalculateStats();
                
        // Request marketplace listings if rebirthed
        if (gameState.hasRebirthed && socket && isConnected) {
            socket.emit('get-listings');
            socket.emit('get-my-listings');
        }
        
        updateUI();
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    await checkAuth();
    
    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        showNotification('Successfully signed in with Google!');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Reload auth status
        await checkAuth();
    }
    
    // Initialize socket connection
    initSocket();
    
    initCivilizationSelection();
    initTabs();
    
    // Click button
    document.getElementById('click-button').addEventListener('click', clickCurrency);
    
    // Rebirth button
    document.getElementById('rebirth-button').addEventListener('click', rebirth);
    
    // Set up auto-save interval (every 30 seconds if authenticated)
    if (isAuthenticated) {
        autoSaveInterval = setInterval(() => {
            if (gameState.civilization) {
                saveGameToServer();
            }
        }, 30000); // Every 30 seconds
    }
    
    // Check if we should load a saved game (from localStorage as fallback)
    const save = localStorage.getItem('clickerMarketSave');
    if (save && !isAuthenticated) {
        try {
            const loaded = JSON.parse(save);
            if (loaded.civilization) {
                // Restore player name if saved
                if (loaded.playerName) {
                    document.getElementById('player-name').value = loaded.playerName;
                }
                // Auto-select civilization and load game
                selectCivilization(loaded.civilization);
            }
        } catch (e) {
            console.error('Failed to load saved civilization:', e);
        }
    } else if (save && isAuthenticated) {
        // If authenticated, prefer server data, but use local as fallback
        try {
            const loaded = JSON.parse(save);
            if (loaded.playerName) {
                document.getElementById('player-name').value = loaded.playerName;
            }
        } catch (e) {
            console.error('Failed to load local data:', e);
        }
    }
});

