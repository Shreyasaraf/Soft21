// ===== Firebase Sync Module =====
// Handles real-time sync between two challengers

let firebaseApp = null;
let firebaseDb = null;
let syncEnabled = false;
let activeListeners = {};

// Initialize Firebase
function initFirebase() {
    if (typeof FIREBASE_CONFIG === 'undefined' || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
        console.log('Firebase not configured — running in local-only mode');
        return false;
    }

    try {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        firebaseDb = firebase.database();
        syncEnabled = true;
        console.log('Firebase connected — sync enabled');
        return true;
    } catch (e) {
        console.error('Firebase init error:', e);
        return false;
    }
}

// Generate a short share code from challenge ID
function generateShareCode(challengeId) {
    // Use last 8 chars of the timestamp ID + random suffix
    const base = challengeId.slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return base + rand;
}

// Push a challenge to Firebase (called by creator)
function shareChallenge(challenge) {
    if (!syncEnabled) {
        alert('Firebase not configured. See sync.html for setup instructions.');
        return null;
    }

    const shareCode = generateShareCode(challenge.id);
    const syncData = {
        id: challenge.id,
        name: challenge.name,
        goal: challenge.goal,
        objective: challenge.objective,
        days: challenge.days,
        tasks: challenge.tasks,
        person1: challenge.person1,
        person2: challenge.person2,
        startDate: challenge.startDate,
        completion: challenge.completion || {},
        shareCode: shareCode,
        createdAt: new Date().toISOString()
    };

    firebaseDb.ref('challenges/' + shareCode).set(syncData);

    // Save shareCode locally
    const state = getState();
    const local = state.challenges.find(c => c.id === challenge.id);
    if (local) {
        local.shareCode = shareCode;
        local.synced = true;
        saveState(state);
    }

    // Start listening for changes
    listenToChallenge(shareCode);

    return shareCode;
}

// Join a challenge by share code (called by friend)
function joinChallenge(shareCode) {
    if (!syncEnabled) {
        alert('Firebase not configured. See sync.html for setup instructions.');
        return;
    }

    shareCode = shareCode.trim().toUpperCase();

    firebaseDb.ref('challenges/' + shareCode).once('value', function(snapshot) {
        const data = snapshot.val();
        if (!data) {
            alert('Challenge not found. Check the code and try again.');
            return;
        }

        // Check if already joined
        const state = getState();
        const existing = state.challenges.find(c => c.shareCode === shareCode);
        if (existing) {
            alert('You already joined this challenge!');
            return;
        }

        // Add to local state
        const challenge = {
            id: data.id,
            name: data.name,
            goal: data.goal,
            objective: data.objective,
            days: data.days,
            tasks: data.tasks,
            person1: data.person1,
            person2: data.person2,
            startDate: data.startDate,
            completion: data.completion || {},
            photos: [],
            shareCode: shareCode,
            synced: true
        };

        state.challenges.push(challenge);
        saveState(state);

        // Start listening
        listenToChallenge(shareCode);

        // Re-render
        navigate('home');
        alert('Joined "' + challenge.name + '" successfully!');
    });
}

// Listen for real-time changes on a shared challenge
function listenToChallenge(shareCode) {
    if (!syncEnabled || activeListeners[shareCode]) return;

    const ref = firebaseDb.ref('challenges/' + shareCode + '/completion');
    ref.on('value', function(snapshot) {
        const remoteCompletion = snapshot.val() || {};

        // Update local state
        const state = getState();
        const challenge = state.challenges.find(c => c.shareCode === shareCode);
        if (challenge) {
            challenge.completion = remoteCompletion;
            saveState(state);

            // If currently viewing this challenge, re-render
            if (currentChallenge && currentChallenge.shareCode === shareCode) {
                currentChallenge = challenge;
                render();
            }
        }
    });

    activeListeners[shareCode] = ref;
}

// Push task completion to Firebase
function syncTaskToggle(challenge, day, person, taskIndex, checked) {
    if (!syncEnabled || !challenge.shareCode) return;

    const path = 'challenges/' + challenge.shareCode + '/completion/' + day + '/' + person + '_' + taskIndex;
    firebaseDb.ref(path).set(checked);
}

// Start listeners for all synced challenges on app load
function initSyncListeners() {
    if (!syncEnabled) return;

    const state = getState();
    state.challenges.forEach(function(c) {
        if (c.shareCode && c.synced) {
            listenToChallenge(c.shareCode);
        }
    });
}

// Stop all listeners (cleanup)
function stopAllListeners() {
    Object.keys(activeListeners).forEach(function(key) {
        activeListeners[key].off();
    });
    activeListeners = {};
}
