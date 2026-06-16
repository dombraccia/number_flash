import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { app, StorageManager } from "./storage.js";
import { NUMBER_DATA } from "./data.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ALLOWED_EMAIL = "domenick.braccia@gmail.com";

// UI Elements
const views = {
    app: document.getElementById('app'),
    login: document.getElementById('login-view'),
    home: document.getElementById('home-view'),
    session: document.getElementById('session-view'),
    summary: document.getElementById('summary-view'),
    stats: document.getElementById('stats-view')
};

const elements = {
    googleLoginBtn: document.getElementById('google-login-btn'),
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    langSelect: document.getElementById('language-select'),
    rangeSelect: document.getElementById('range-select'),
    startBtn: document.getElementById('start-btn'),
    statsBtn: document.getElementById('stats-btn'),
    finishBtn: document.getElementById('finish-btn'),
    statsBackBtn: document.getElementById('stats-back-btn'),
    countdown: document.getElementById('countdown'),
    flashcard: document.getElementById('flashcard'),
    cardFront: document.querySelector('.card-face.front'),
    cardBack: document.querySelector('.card-face.back'),
    controls: document.getElementById('session-controls'),
    incorrectBtn: document.getElementById('incorrect-btn'),
    correctBtn: document.getElementById('correct-btn'),
    summaryTime: document.getElementById('summary-time'),
    summaryAccuracy: document.getElementById('summary-accuracy'),
    summaryAvgTime: document.getElementById('summary-avg-time'),
    statsList: document.getElementById('stats-list')
};

// State
let currentUser = null;
let sessionData = {
    language: '',
    numbers: [],
    currentIndex: 0,
    startTime: 0,
    flipTime: 0,
    results: []
};

// Auth Management
onAuthStateChanged(auth, (user) => {
    views.app.classList.remove('hidden');
    if (user && user.email === ALLOWED_EMAIL) {
        currentUser = user;
        showView('home');
    } else {
        if (user) signOut(auth);
        currentUser = null;
        showView('login');
    }
});

async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        alert("Login failed: " + e.message);
    }
}

async function handleEmailLogin() {
    const email = elements.loginEmail.value;
    const pass = elements.loginPass.value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Login failed: " + e.message);
    }
}

function handleLogout() {
    signOut(auth);
}

// View Management
function showView(viewName) {
    Object.keys(views).forEach(k => {
        if (k !== 'app') {
            const isMatch = k === viewName;
            views[k].classList.toggle('hidden', !isMatch);
        }
    });
}

// Session Logic
function startSession() {
    const lang = elements.langSelect.value;
    const rangeStr = elements.rangeSelect.value;
    const [min, max] = rangeStr.split('-').map(Number);
    
    let allNumbers = [];
    for (let i = min; i <= max; i++) allNumbers.push(i);
    
    const shuffled = allNumbers.sort(() => 0.5 - Math.random());
    const sessionNumbers = shuffled.slice(0, 20);
    
    sessionData = {
        language: lang,
        numbers: sessionNumbers,
        currentIndex: 0,
        results: [],
        totalStartTime: Date.now()
    };
    
    showView('session');
    runCountdown(() => {
        showNextCard();
    });
}

function runCountdown(callback) {
    elements.countdown.classList.remove('hidden');
    elements.flashcard.classList.add('hidden');
    elements.controls.classList.add('hidden');
    
    let count = 3;
    elements.countdown.textContent = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdown.textContent = count;
        } else {
            clearInterval(interval);
            elements.countdown.classList.add('hidden');
            elements.flashcard.classList.remove('hidden');
            callback();
        }
    }, 1000);
}

function showNextCard() {
    if (sessionData.currentIndex >= sessionData.numbers.length) {
        endSession();
        return;
    }
    
    const number = sessionData.numbers[sessionData.currentIndex];
    elements.cardFront.textContent = number;
    elements.cardBack.textContent = '';
    
    // Ensure card is not flipped when showing next
    elements.flashcard.classList.remove('flipped');
    elements.controls.classList.add('hidden');
    
    sessionData.cardStartTime = Date.now();
}

function flipCard() {
    if (elements.flashcard.classList.contains('flipped')) return;
    
    const number = sessionData.numbers[sessionData.currentIndex];
    const lang = sessionData.language;
    
    if (!NUMBER_DATA[lang] || NUMBER_DATA[lang][number] === undefined) {
        alert(`Error: Missing data for ${lang} number ${number}`);
        return;
    }

    sessionData.flipTime = (Date.now() - sessionData.cardStartTime) / 1000;
    const answer = NUMBER_DATA[lang][number];
    
    elements.cardBack.textContent = answer;
    elements.flashcard.classList.add('flipped');
    elements.controls.classList.remove('hidden');
    
    try {
        speak(answer, lang);
    } catch (e) {
        console.warn("Speech API error:", e);
    }
}

async function recordResult(isCorrect) {
    const number = sessionData.numbers[sessionData.currentIndex];
    sessionData.results.push({
        number,
        flipTime: sessionData.flipTime,
        isCorrect
    });
    
    // Background sync to Firestore
    StorageManager.saveResult(currentUser.uid, sessionData.language, number, isCorrect, sessionData.flipTime);
    
    elements.flashcard.classList.remove('flipped');
    elements.controls.classList.add('hidden');
    
    sessionData.currentIndex++;
    
    setTimeout(() => {
        showNextCard();
    }, 400);
}

function endSession() {
    const totalSessionTime = (Date.now() - sessionData.totalStartTime) / 1000;
    const correctCount = sessionData.results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionData.results.length) * 100);
    const avgFlipTime = (sessionData.results.reduce((acc, r) => acc + r.flipTime, 0) / sessionData.results.length).toFixed(2);
    
    elements.summaryTime.textContent = Math.round(totalSessionTime);
    elements.summaryAccuracy.textContent = accuracy;
    elements.summaryAvgTime.textContent = avgFlipTime;
    
    showView('summary');
}

// Stats Logic
async function showStats() {
    if (!currentUser) {
        alert("You must be logged in to view stats.");
        return;
    }

    const lang = elements.langSelect.value;
    elements.statsList.innerHTML = '<p style="text-align:center; padding: 20px;">Loading your stats from the cloud...</p>';
    showView('stats');

    try {
        const allStats = await StorageManager.getStats(currentUser.uid);
        const langStats = allStats[lang] || {};

        const statItems = [];
        for (let i = 0; i <= 100; i++) {
            // Check both number and string keys just in case
            const data = langStats[i] || langStats[String(i)] || { timesStudied: 0, timesCorrect: 0, totalFlipTime: 0 };
            const percent = data.timesStudied > 0 ? (data.timesCorrect / data.timesStudied) * 100 : null;
            const avgTime = data.timesStudied > 0 ? (data.totalFlipTime / data.timesStudied) : 0;

            statItems.push({ number: i, percent, avgTime, data });
        }

        statItems.sort((a, b) => {
            if (a.percent === null && b.percent === null) return 0;
            if (a.percent === null) return 1;
            if (b.percent === null) return -1;
            if (a.percent !== b.percent) return a.percent - b.percent;
            return b.avgTime - a.avgTime;
        });

        elements.statsList.innerHTML = '';
        let studiedCount = 0;

        statItems.forEach(item => {
            if (item.data.timesStudied === 0) return;
            studiedCount++;

            const div = document.createElement('div');
            div.className = 'stat-item';

            let difficultyClass = '';
            let statusText = '';

            if (item.percent < 55) { difficultyClass = 'difficult'; statusText = 'Difficult'; }
            else if (item.percent < 70) { difficultyClass = 'needs-improvement'; statusText = 'Needs Improvement'; }
            else if (item.percent < 85) { difficultyClass = 'getting-there'; statusText = 'Getting There'; }
            else { difficultyClass = 'learned'; statusText = 'Learned'; }

            div.innerHTML = `
                <div class="stat-label">
                    <span class="stat-number">${item.number}</span>
                    <span class="stat-details">${item.data.timesStudied} trials | Avg ${item.avgTime.toFixed(2)}s</span>
                </div>
                <span class="stat-badge ${difficultyClass}">${Math.round(item.percent)}% - ${statusText}</span>
            `;
            elements.statsList.appendChild(div);
        });

        if (studiedCount === 0) {
            const rawData = JSON.stringify(allStats);
            elements.statsList.innerHTML = `
                <p style="text-align:center; padding: 20px; color: #8E8E93;">No numbers studied yet for this language.</p>
                <div style="font-size: 10px; color: #CCC; padding: 10px; word-break: break-all; border-top: 1px solid #EEE;">
                    Debug Info: UID ${currentUser.uid} | Lang ${lang} | Data: ${rawData.substring(0, 100)}...
                </div>
            `;
        }

    } catch (e) {

        console.error("Stats View Error:", e);
        elements.statsList.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--error-color);">Error loading stats: ${e.message}</p>`;
    }
}

// Speech Utility
function speak(text, lang) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
}

// Event Listeners
elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
elements.loginBtn.addEventListener('click', handleEmailLogin);
elements.logoutBtn.addEventListener('click', handleLogout);
elements.startBtn.addEventListener('click', startSession);

elements.statsBtn.addEventListener('click', async () => {
    try {
        await showStats();
    } catch (e) {
        console.error("Stats button handler error:", e);
        alert("Critical Error: " + e.message);
    }
});

elements.finishBtn.addEventListener('click', () => showView('home'));
elements.statsBackBtn.addEventListener('click', () => showView('home'));
elements.flashcard.addEventListener('click', flipCard);
elements.incorrectBtn.addEventListener('click', () => recordResult(false));
elements.correctBtn.addEventListener('click', () => recordResult(true));
