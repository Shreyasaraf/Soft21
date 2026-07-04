// ===== State Management =====
const STATE_KEY = 'consistency_challenges';

function getState() {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : { challenges: [] };
}

function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// ===== App Router =====
let currentScreen = 'home';
let currentChallenge = null;
let currentTab = 'tasks';
let currentDay = 0;
let createFormData = { name: '', goal: '', objective: '', days: 21, tasks: [], person1: '', person2: '' };
let createStep = 1;

function navigate(screen, data = {}) {
    currentScreen = screen;
    if (data.challengeId !== undefined) {
        const state = getState();
        currentChallenge = state.challenges.find(c => c.id === data.challengeId);
        currentDay = getCurrentDayIndex(currentChallenge);
    }
    render();
}

function getCurrentDayIndex(challenge) {
    if (!challenge) return 0;
    const start = new Date(challenge.startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(0, diff), challenge.days - 1);
}

// ===== Render Functions =====
function render() {
    const app = document.getElementById('app');
    switch (currentScreen) {
        case 'home':
            app.innerHTML = renderHome();
            break;
        case 'create':
            app.innerHTML = renderCreate();
            break;
        case 'challenge':
            app.innerHTML = renderChallenge();
            break;
    }
    attachEventListeners();
}

function renderHome() {
    const state = getState();
    const challenges = state.challenges;

    return `
        <div class="screen active">
            <div class="header">
                <div>
                    <h1 class="welcome-greeting">Welcome</h1>
                    <p class="welcome-subtitle">Stay consistent, stay winning</p>
                </div>
                <div class="header-avatar">⚡</div>
            </div>

            <div class="home-hero">
                <div class="hero-emoji">🎯</div>
            </div>

            <div class="section-title">
                <span>Your Challenges</span>
                <button class="add-icon-btn" onclick="startCreate()">+</button>
            </div>

            <button class="join-btn" onclick="promptJoinChallenge()">
                🔗 Join a Challenge
            </button>

            ${challenges.length === 0 ? `
                <div class="empty-state">
                    <p>No challenges yet. Tap + to get started!</p>
                </div>
            ` : `
                <div class="challenge-list">
                    ${challenges.map(c => `
                        <div class="challenge-card" onclick="openChallenge('${c.id}')">
                            <div class="challenge-card-name">${c.name}</div>
                            <div class="challenge-card-meta">
                                <span>📅 ${c.days} days</span>
                                <span>👥 ${c.person1} & ${c.person2}</span>
                                <span>📋 ${c.tasks.length} tasks</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function renderCreate() {
    return `
        <div class="screen active">
            <button class="back-btn" onclick="navigate('home')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back
            </button>

            <div class="form-step-indicator">
                <div class="step-dot ${createStep >= 1 ? 'active' : ''} ${createStep > 1 ? 'completed' : ''}"></div>
                <div class="step-dot ${createStep >= 2 ? 'active' : ''} ${createStep > 2 ? 'completed' : ''}"></div>
                <div class="step-dot ${createStep >= 3 ? 'active' : ''}"></div>
            </div>

            ${createStep === 1 ? renderCreateStep1() : ''}
            ${createStep === 2 ? renderCreateStep2() : ''}
            ${createStep === 3 ? renderCreateStep3() : ''}
        </div>
    `;
}

function renderCreateStep1() {
    return `
        <div>
            <h2 class="form-title">New Challenge</h2>
            <p class="form-subtitle">Define your challenge details</p>

            <div class="form-group">
                <label class="form-label">Challenge Name</label>
                <input class="form-input" id="challenge-name" type="text" placeholder="e.g. Soft 21" value="${createFormData.name}">
            </div>

            <div class="form-group">
                <label class="form-label">Goal</label>
                <textarea class="form-input" id="challenge-goal" placeholder="What do you want to achieve?">${createFormData.goal}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Objective</label>
                <textarea class="form-input" id="challenge-objective" placeholder="How will you measure success?">${createFormData.objective}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Number of Days</label>
                <input class="form-input" id="challenge-days" type="number" min="1" max="365" value="${createFormData.days}">
            </div>

            <div class="form-nav">
                <button class="btn-secondary" onclick="navigate('home')">Cancel</button>
                <button class="btn-primary" onclick="nextStep()">Next</button>
            </div>
        </div>
    `;
}

function renderCreateStep2() {
    return `
        <div>
            <h2 class="form-title">Daily Tasks</h2>
            <p class="form-subtitle">Add tasks to complete each day (1 point each)</p>

            <div class="task-input-row">
                <input class="form-input" id="new-task-input" type="text" placeholder="Enter a task...">
                <button class="add-task-btn" onclick="addTask()">+</button>
            </div>

            <div class="task-list">
                ${createFormData.tasks.map((task, i) => `
                    <div class="task-item">
                        <span class="task-item-name">${task}</span>
                        <button class="task-item-delete" onclick="removeTask(${i})">✕</button>
                    </div>
                `).join('')}
            </div>

            ${createFormData.tasks.length === 0 ? `
                <p style="color: var(--text-muted); text-align: center; margin-top: 24px; font-size: 14px;">Add at least one task to continue</p>
            ` : ''}

            <div class="form-nav">
                <button class="btn-secondary" onclick="prevStep()">Back</button>
                <button class="btn-primary" onclick="nextStep()" ${createFormData.tasks.length === 0 ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;
}

function renderCreateStep3() {
    return `
        <div>
            <h2 class="form-title">Challengers</h2>
            <p class="form-subtitle">Who's competing?</p>

            <div class="challenger-input-group">
                <label class="challenger-label">Challenger 1</label>
                <input class="form-input" id="person1" type="text" placeholder="First person's name" value="${createFormData.person1}">
            </div>

            <div class="challenger-input-group">
                <label class="challenger-label">Challenger 2</label>
                <input class="form-input" id="person2" type="text" placeholder="Second person's name" value="${createFormData.person2}">
            </div>

            <div class="form-nav">
                <button class="btn-secondary" onclick="prevStep()">Back</button>
                <button class="btn-primary" onclick="createChallenge()">Create</button>
            </div>
        </div>
    `;
}

function renderChallenge() {
    if (!currentChallenge) return '';

    return `
        <div class="screen active">
            <button class="back-btn" onclick="navigate('home')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                ${currentChallenge.name}
            </button>

            <div class="challenge-header">
                <p class="challenge-header-goal">${currentChallenge.goal}</p>
                ${currentChallenge.shareCode ? `
                    <div class="share-badge">🔗 Synced · Code: ${currentChallenge.shareCode}</div>
                ` : `
                    <button class="share-btn" onclick="shareChallengeAction()">📤 Share Challenge</button>
                `}
            </div>

            <div class="tabs">
                <button class="tab ${currentTab === 'tasks' ? 'active' : ''}" onclick="switchTab('tasks')">Daily Tasks</button>
                <button class="tab ${currentTab === 'progress' ? 'active' : ''}" onclick="switchTab('progress')">Progress Pics</button>
                <button class="tab ${currentTab === 'score' ? 'active' : ''}" onclick="switchTab('score')">Score</button>
            </div>

            ${currentTab === 'tasks' ? renderTasksTab() : ''}
            ${currentTab === 'progress' ? renderProgressTab() : ''}
            ${currentTab === 'score' ? renderScoreTab() : ''}
        </div>
    `;
}

function renderTasksTab() {
    const challenge = currentChallenge;
    const dayNum = currentDay + 1;
    const startDate = new Date(challenge.startDate);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + currentDay);
    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayCompletion = challenge.completion[currentDay] || {};

    return `
        <div class="day-navigator">
            <button class="day-nav-btn" onclick="changeDay(-1)" ${currentDay === 0 ? 'disabled' : ''}>
                ‹
            </button>
            <div class="day-display">
                <div class="day-display-date">${dateStr}</div>
                <div class="day-display-day">Day ${dayNum} / ${challenge.days}</div>
            </div>
            <button class="day-nav-btn" onclick="changeDay(1)" ${currentDay >= challenge.days - 1 ? 'disabled' : ''}>
                ›
            </button>
        </div>

        <div class="task-tracker">
            <div class="tracker-header">
                <span>${challenge.person1}</span>
                <span>Tasks</span>
                <span>${challenge.person2}</span>
            </div>
            ${challenge.tasks.map((task, i) => {
                const p1Checked = dayCompletion[`p1_${i}`] || false;
                const p2Checked = dayCompletion[`p2_${i}`] || false;
                return `
                    <div class="tracker-row">
                        <div class="tracker-checkbox">
                            <input type="checkbox" ${p1Checked ? 'checked' : ''} onchange="toggleTask(${currentDay}, 'p1', ${i}, this.checked)">
                        </div>
                        <div class="tracker-task-name">${task}</div>
                        <div class="tracker-checkbox">
                            <input type="checkbox" ${p2Checked ? 'checked' : ''} onchange="toggleTask(${currentDay}, 'p2', ${i}, this.checked)">
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderProgressTab() {
    const challenge = currentChallenge;
    const photos = challenge.photos || [];
    const dayNum = currentDay + 1;
    const progressPercent = Math.max(2, (dayNum / challenge.days) * 100);

    // Build grid cells for each day
    let gridHTML = '';
    for (let d = 1; d <= challenge.days; d++) {
        const photo = photos.find(function(p) { return p.day === d; });
        const isCurrent = (d === dayNum);
        const hasPhoto = !!photo;

        let cellClass = 'photo-day-cell';
        if (hasPhoto) cellClass += ' has-photo';
        if (isCurrent && !hasPhoto) cellClass += ' current-day';

        if (hasPhoto) {
            gridHTML += '<div class="' + cellClass + '" onclick="viewPhoto(' + d + ')">'
                + '<img src="' + photo.data + '" alt="Day ' + d + '">'
                + '<span class="photo-day-label">Day ' + d + '</span>'
                + '</div>';
        } else {
            gridHTML += '<div class="' + cellClass + '" onclick="handleDayCellClick(' + d + ')">'
                + '<span class="photo-day-number">Day ' + d + '</span>'
                + (isCurrent ? '<span class="photo-day-add">+</span>' : '')
                + '</div>';
        }
    }

    return '<div class="progress-tab-layout">'
        + '<div class="progress-tab-header">'
        + '<h2 style="font-size: 20px; font-weight: 700; text-align: center;">' + challenge.name + '</h2>'
        + '<p style="font-size: 14px; color: var(--text-secondary); text-align: center;">Day ' + dayNum + '/' + challenge.days + '</p>'
        + '<p style="font-size: 13px; color: var(--purple-light); text-align: center; margin-top: 4px; font-style: italic;">' + challenge.goal + '</p>'
        + '</div>'
        + '<div class="progress-bar-container">'
        + '<div class="progress-bar">'
        + '<div class="progress-fill person1" style="width: ' + progressPercent + '%"></div>'
        + '</div>'
        + '</div>'
        + '<div class="photo-day-grid">'
        + gridHTML
        + '</div>'
        + '</div>'
        + '<div class="photo-modal" id="photo-modal">'
        + '<div class="photo-modal-options" id="photo-options">'
        + '<h3 style="text-align: center; margin-bottom: 12px;">Add Progress Photo</h3>'
        + '<button class="photo-modal-btn" onclick="takePhoto()">📷 Take Photo</button>'
        + '<button class="photo-modal-btn" onclick="chooseFromLibrary()">🖼️ Choose from Library</button>'
        + '<button class="photo-modal-btn cancel" onclick="closePhotoModal()">Cancel</button>'
        + '</div>'
        + '<div class="photo-preview" id="photo-preview">'
        + '<img id="preview-img" src="" alt="Preview">'
        + '<div class="photo-preview-actions">'
        + '<button class="btn-secondary" onclick="retakePhoto()">Retake</button>'
        + '<button class="btn-primary" onclick="savePhoto()">Save</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="photo-viewer-modal" id="photo-viewer-modal" onclick="closePhotoViewer()">'
        + '<div class="photo-viewer-content" onclick="event.stopPropagation()">'
        + '<img id="viewer-img" src="" alt="Progress photo">'
        + '<div class="photo-viewer-info">'
        + '<span id="viewer-day"></span>'
        + '<span id="viewer-date"></span>'
        + '</div>'
        + '<div class="photo-viewer-actions">'
        + '<button class="btn-secondary" onclick="deleteViewedPhoto()">Delete</button>'
        + '<button class="btn-primary" onclick="closePhotoViewer()">Close</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<input type="file" accept="image/*" class="hidden-input" id="photo-library-input" onchange="handlePhotoSelected(event)">'
        + '<input type="file" accept="image/*" capture="environment" class="hidden-input" id="photo-camera-input" onchange="handlePhotoSelected(event)">';
}

function renderScoreTab() {
    const challenge = currentChallenge;
    const totalPossible = challenge.tasks.length * challenge.days;
    const scores = calculateScores(challenge);

    // Build perfect days dot grid for each person
    function buildDotGrid(perfectDaysArray, totalDays) {
        let dots = '';
        for (let d = 0; d < totalDays; d++) {
            const isPerfect = perfectDaysArray[d];
            dots += '<span class="dot ' + (isPerfect ? 'dot-perfect' : 'dot-empty') + '"></span>';
        }
        return dots;
    }

    return `
        <div class="score-tab-layout">
            <div class="score-section-card">
                <h3 class="score-section-title">Score</h3>
                <div class="score-display">
                    <div class="score-display-person">
                        <div class="score-display-name">${challenge.person1}</div>
                        <div class="score-display-value">${scores.p1Score}</div>
                        <div class="score-display-total">/${totalPossible}</div>
                    </div>
                    <div class="score-display-person">
                        <div class="score-display-name">${challenge.person2}</div>
                        <div class="score-display-value">${scores.p2Score}</div>
                        <div class="score-display-total">/${totalPossible}</div>
                    </div>
                </div>
            </div>

            <div class="score-section-card">
                <h3 class="score-section-title">Perfect Days</h3>
                <div class="perfect-days-grid">
                    <div class="perfect-days-column">
                        <div class="perfect-days-col-header">
                            <span class="perfect-days-name">${challenge.person1}</span>
                            <span class="perfect-days-count">${scores.p1PerfectDays}</span>
                        </div>
                        <div class="dot-grid">
                            ${buildDotGrid(scores.p1PerfectDaysArray, challenge.days)}
                        </div>
                    </div>
                    <div class="perfect-days-divider"></div>
                    <div class="perfect-days-column">
                        <div class="perfect-days-col-header">
                            <span class="perfect-days-name">${challenge.person2}</span>
                            <span class="perfect-days-count">${scores.p2PerfectDays}</span>
                        </div>
                        <div class="dot-grid">
                            ${buildDotGrid(scores.p2PerfectDaysArray, challenge.days)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== Score Calculation =====
function calculateScores(challenge) {
    let p1Score = 0;
    let p2Score = 0;
    let p1PerfectDays = 0;
    let p2PerfectDays = 0;
    const p1PerfectDaysArray = [];
    const p2PerfectDaysArray = [];
    const taskCount = challenge.tasks.length;

    for (let day = 0; day < challenge.days; day++) {
        const dayData = challenge.completion[day] || {};
        let p1DayScore = 0;
        let p2DayScore = 0;

        for (let t = 0; t < taskCount; t++) {
            if (dayData[`p1_${t}`]) { p1Score++; p1DayScore++; }
            if (dayData[`p2_${t}`]) { p2Score++; p2DayScore++; }
        }

        const p1Perfect = p1DayScore === taskCount;
        const p2Perfect = p2DayScore === taskCount;
        if (p1Perfect) p1PerfectDays++;
        if (p2Perfect) p2PerfectDays++;
        p1PerfectDaysArray.push(p1Perfect);
        p2PerfectDaysArray.push(p2Perfect);
    }

    return { p1Score, p2Score, p1PerfectDays, p2PerfectDays, p1PerfectDaysArray, p2PerfectDaysArray };
}

// ===== Event Handlers =====
function startCreate() {
    createFormData = { name: '', goal: '', objective: '', days: 21, tasks: [], person1: '', person2: '' };
    createStep = 1;
    navigate('create');
}

function nextStep() {
    if (createStep === 1) {
        createFormData.name = document.getElementById('challenge-name').value.trim();
        createFormData.goal = document.getElementById('challenge-goal').value.trim();
        createFormData.objective = document.getElementById('challenge-objective').value.trim();
        createFormData.days = parseInt(document.getElementById('challenge-days').value) || 21;
        if (!createFormData.name) {
            alert('Please enter a challenge name');
            return;
        }
    }
    if (createStep === 2 && createFormData.tasks.length === 0) {
        return;
    }
    createStep++;
    render();
}

function prevStep() {
    createStep--;
    render();
}

function addTask() {
    const input = document.getElementById('new-task-input');
    const task = input.value.trim();
    if (task) {
        createFormData.tasks.push(task);
        render();
        setTimeout(() => {
            const newInput = document.getElementById('new-task-input');
            if (newInput) newInput.focus();
        }, 50);
    }
}

function removeTask(index) {
    createFormData.tasks.splice(index, 1);
    render();
}

function createChallenge() {
    createFormData.person1 = document.getElementById('person1').value.trim();
    createFormData.person2 = document.getElementById('person2').value.trim();

    if (!createFormData.person1 || !createFormData.person2) {
        alert('Please enter both challenger names');
        return;
    }

    const state = getState();
    const challenge = {
        id: Date.now().toString(),
        name: createFormData.name,
        goal: createFormData.goal,
        objective: createFormData.objective,
        days: createFormData.days,
        tasks: createFormData.tasks,
        person1: createFormData.person1,
        person2: createFormData.person2,
        startDate: new Date().toISOString(),
        completion: {},
        photos: []
    };

    state.challenges.push(challenge);
    saveState(state);
    navigate('home');
}

function openChallenge(id) {
    currentTab = 'tasks';
    navigate('challenge', { challengeId: id });
}

function switchTab(tab) {
    currentTab = tab;
    render();
}

function changeDay(delta) {
    const newDay = currentDay + delta;
    if (newDay >= 0 && newDay < currentChallenge.days) {
        currentDay = newDay;
        render();
    }
}

function toggleTask(day, person, taskIndex, checked) {
    const state = getState();
    const challenge = state.challenges.find(c => c.id === currentChallenge.id);
    if (!challenge.completion[day]) {
        challenge.completion[day] = {};
    }
    challenge.completion[day][`${person}_${taskIndex}`] = checked;
    saveState(state);
    currentChallenge = challenge;

    // Sync to Firebase if connected
    syncTaskToggle(challenge, day, person, taskIndex, checked);
}

// ===== Photo Handlers =====
let pendingPhotoData = null;
let pendingPhotoDay = null;

function handleDayCellClick(day) {
    // If the cell already has a photo, don't open modal (user can delete instead)
    const photos = currentChallenge.photos || [];
    const existing = photos.find(p => p.day === day);
    if (existing) return;

    pendingPhotoDay = day;
    openPhotoModal();
}

function openPhotoModal() {
    const modal = document.getElementById('photo-modal');
    const options = document.getElementById('photo-options');
    const preview = document.getElementById('photo-preview');
    modal.classList.add('active');
    options.style.display = 'flex';
    preview.classList.remove('active');
}

function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    modal.classList.remove('active');
    pendingPhotoData = null;
    pendingPhotoDay = null;
}

function takePhoto() {
    document.getElementById('photo-camera-input').click();
}

function chooseFromLibrary() {
    document.getElementById('photo-library-input').click();
}

function handlePhotoSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        pendingPhotoData = e.target.result;
        showPhotoPreview(pendingPhotoData);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function showPhotoPreview(dataUrl) {
    const options = document.getElementById('photo-options');
    const preview = document.getElementById('photo-preview');
    const img = document.getElementById('preview-img');
    
    options.style.display = 'none';
    preview.classList.add('active');
    img.src = dataUrl;
}

function retakePhoto() {
    pendingPhotoData = null;
    const options = document.getElementById('photo-options');
    const preview = document.getElementById('photo-preview');
    options.style.display = 'flex';
    preview.classList.remove('active');
}

function savePhoto() {
    if (!pendingPhotoData) return;

    const state = getState();
    const challenge = state.challenges.find(c => c.id === currentChallenge.id);
    const dayNum = pendingPhotoDay || (currentDay + 1);

    if (!challenge.photos) challenge.photos = [];
    
    // Remove existing photo for that day if any
    challenge.photos = challenge.photos.filter(p => p.day !== dayNum);
    
    challenge.photos.push({
        data: pendingPhotoData,
        day: dayNum,
        date: new Date().toISOString()
    });

    // Sort by day
    challenge.photos.sort((a, b) => a.day - b.day);

    saveState(state);
    currentChallenge = challenge;
    closePhotoModal();
    render();
}

function deleteDayPhoto(day) {
    if (!confirm('Delete this photo?')) return;

    const state = getState();
    const challenge = state.challenges.find(c => c.id === currentChallenge.id);
    challenge.photos = (challenge.photos || []).filter(p => p.day !== day);
    saveState(state);
    currentChallenge = challenge;
    render();
}

// Photo deletion is now handled by deleteDayPhoto

// ===== Photo Viewer =====
let viewingPhotoDay = null;

function viewPhoto(day) {
    const photos = currentChallenge.photos || [];
    const photo = photos.find(function(p) { return p.day === day; });
    if (!photo) return;

    viewingPhotoDay = day;
    const modal = document.getElementById('photo-viewer-modal');
    const img = document.getElementById('viewer-img');
    const dayLabel = document.getElementById('viewer-day');
    const dateLabel = document.getElementById('viewer-date');

    img.src = photo.data;
    dayLabel.textContent = 'Day ' + day + ' / ' + currentChallenge.days;
    dateLabel.textContent = new Date(photo.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    modal.classList.add('active');
}

function closePhotoViewer() {
    const modal = document.getElementById('photo-viewer-modal');
    modal.classList.remove('active');
    viewingPhotoDay = null;
}

function deleteViewedPhoto() {
    if (!viewingPhotoDay) return;
    if (!confirm('Delete this photo?')) return;

    const state = getState();
    const challenge = state.challenges.find(function(c) { return c.id === currentChallenge.id; });
    challenge.photos = (challenge.photos || []).filter(function(p) { return p.day !== viewingPhotoDay; });
    saveState(state);
    currentChallenge = challenge;
    closePhotoViewer();
    render();
}

// ===== Keyboard Support =====
function attachEventListeners() {
    const taskInput = document.getElementById('new-task-input');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }
}

// ===== Sync Actions =====
function promptJoinChallenge() {
    const code = prompt('Enter the Share Code from your friend:');
    if (code) {
        joinChallenge(code);
    }
}

function shareChallengeAction() {
    if (!currentChallenge) return;
    const code = shareChallenge(currentChallenge);
    if (code) {
        currentChallenge.shareCode = code;
        currentChallenge.synced = true;
        render();
        // Try native share, fall back to alert
        if (navigator.share) {
            navigator.share({
                title: currentChallenge.name + ' Challenge',
                text: 'Join my consistency challenge! Code: ' + code,
            }).catch(() => {});
        }
        alert('Share Code: ' + code + '\n\nSend this to your friend so they can join!');
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase sync
    initFirebase();
    initSyncListeners();
    render();
});
