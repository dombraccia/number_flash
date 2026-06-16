import { StorageManager } from './storage.js';
import { NUMBER_DATA } from './data.js';

// UI Elements
const views = {
    app: document.getElementById('app'),
    home: document.getElementById('home-view'),
    session: document.getElementById('session-view'),
    summary: document.getElementById('summary-view'),
    stats: document.getElementById('stats-view')
};

const elements = {
    langSelect: document.getElementById('language-select'),
    rangeMin: document.getElementById('range-min'),
    rangeMax: document.getElementById('range-max'),
    reviewsCount: document.getElementById('reviews-count'),
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
    statsList: document.getElementById('stats-list'),
    progress: document.getElementById('session-progress'),
    exitBtn: document.getElementById('exit-btn'),
    summaryResults: document.getElementById('summary-results'),
    summaryResultsList: document.getElementById('summary-results-list')
};

// State
let sessionData = {
    language: '',
    numbers: [],
    currentIndex: 0,
    flipTime: 0,
    results: []
};

// Preference Persistence
function loadPreferences() {
    const lang = localStorage.getItem('numflash_lang');
    const rangeMin = localStorage.getItem('numflash_range_min');
    const rangeMax = localStorage.getItem('numflash_range_max');
    const reviewsCount = localStorage.getItem('numflash_reviews_count');
    
    if (lang) elements.langSelect.value = lang;
    if (rangeMin !== null) elements.rangeMin.value = rangeMin;
    if (rangeMax !== null) elements.rangeMax.value = rangeMax;
    if (reviewsCount !== null) elements.reviewsCount.value = reviewsCount;
}

function savePreferences() {
    localStorage.setItem('numflash_lang', elements.langSelect.value);
    localStorage.setItem('numflash_range_min', elements.rangeMin.value);
    localStorage.setItem('numflash_range_max', elements.rangeMax.value);
    localStorage.setItem('numflash_reviews_count', elements.reviewsCount.value);
}

// Initialize — go straight to home (no auth needed)
loadPreferences();
views.app.classList.remove('hidden');
showView('home');

// View Management
function showView(viewName) {
    Object.keys(views).forEach(k => {
        if (k !== 'app') {
            views[k].classList.toggle('hidden', k !== viewName);
        }
    });
}

// Session Logic
let countdownInterval = null;

function startSession() {
    savePreferences();

    const lang = elements.langSelect.value;
    let min = parseInt(elements.rangeMin.value, 10);
    let max = parseInt(elements.rangeMax.value, 10);
    let reviews = parseInt(elements.reviewsCount.value, 10);

    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = 20;
    if (isNaN(reviews) || reviews <= 0) reviews = 20;

    // Clamp range values to dictionary limits
    min = Math.max(0, Math.min(100, min));
    max = Math.max(0, Math.min(100, max));

    if (min > max) {
        const temp = min;
        min = max;
        max = temp;
    }

    elements.rangeMin.value = min;
    elements.rangeMax.value = max;
    elements.reviewsCount.value = reviews;

    const allNumbers = [];
    for (let i = min; i <= max; i++) allNumbers.push(i);

    const shuffled = allNumbers.sort(() => 0.5 - Math.random());
    const sessionNumbers = shuffled.slice(0, reviews);

    sessionData = {
        language: lang,
        numbers: sessionNumbers,
        currentIndex: 0,
        results: [],
        totalStartTime: Date.now()
    };

    elements.summaryResults.classList.add('hidden');

    showView('session');
    runCountdown(() => showNextCard());
}

function runCountdown(callback) {
    elements.countdown.classList.remove('hidden');
    elements.flashcard.classList.add('hidden');
    elements.controls.classList.add('hidden');
    elements.progress.classList.add('hidden');

    let count = 3;
    elements.countdown.textContent = count;

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdown.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            elements.countdown.classList.add('hidden');
            elements.flashcard.classList.remove('hidden');
            elements.progress.classList.remove('hidden');
            callback();
        }
    }, 1000);
}

function exitSession() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    showView('home');
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

    // Update progress indicator
    elements.progress.textContent = `${sessionData.currentIndex + 1} / ${sessionData.numbers.length}`;

    sessionData.cardStartTime = Date.now();
}

function flipCard() {
    if (elements.flashcard.classList.contains('flipped')) return;

    const number = sessionData.numbers[sessionData.currentIndex];
    const lang = sessionData.language;

    if (!NUMBER_DATA[lang] || NUMBER_DATA[lang][number] === undefined) {
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
        console.warn('Speech API error:', e);
    }
}

function recordResult(isCorrect) {
    const number = sessionData.numbers[sessionData.currentIndex];
    sessionData.results.push({
        number,
        flipTime: sessionData.flipTime,
        isCorrect
    });

    // Save to localStorage
    StorageManager.saveResult(sessionData.language, number, isCorrect, sessionData.flipTime);

    elements.flashcard.classList.remove('flipped');
    elements.controls.classList.add('hidden');

    sessionData.currentIndex++;

    setTimeout(() => showNextCard(), 400);
}

function endSession() {
    const totalSessionTime = (Date.now() - sessionData.totalStartTime) / 1000;
    const correctCount = sessionData.results.filter(r => r.isCorrect).length;
    const accuracy = sessionData.results.length > 0 ? Math.round((correctCount / sessionData.results.length) * 100) : 0;
    const avgFlipTime = sessionData.results.length > 0 ? (sessionData.results.reduce((acc, r) => acc + r.flipTime, 0) / sessionData.results.length).toFixed(2) : '0.00';

    elements.summaryTime.textContent = Math.round(totalSessionTime);
    elements.summaryAccuracy.textContent = accuracy;
    elements.summaryAvgTime.textContent = avgFlipTime;

    // Display session results sorted by difficulty
    const allStats = StorageManager.getAllStats();
    const langStats = allStats[sessionData.language] || {};

    const sessionNumbersUnique = [...new Set(sessionData.results.map(r => r.number))];
    const statItems = sessionNumbersUnique.map(num => {
        const data = langStats[num] || langStats[String(num)] || { timesStudied: 0, timesCorrect: 0, totalFlipTime: 0 };
        const percent = data.timesStudied > 0 ? (data.timesCorrect / data.timesStudied) * 100 : 0;
        const avgTime = data.timesStudied > 0 ? (data.totalFlipTime / data.timesStudied) : 0;
        const word = NUMBER_DATA[sessionData.language][num] || '';
        return { number: num, word, percent, avgTime, data };
    });

    // Sort by difficulty: lowest accuracy (lowest percent) first, then longest avgFlipTime first
    statItems.sort((a, b) => {
        if (a.percent !== b.percent) return a.percent - b.percent;
        return b.avgTime - a.avgTime;
    });

    elements.summaryResultsList.innerHTML = '';
    
    statItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stat-item';

        let difficultyClass = '';
        let statusText = '';

        if (item.percent < 55) { difficultyClass = 'difficult'; statusText = 'Difficult'; }
        else if (item.percent < 70) { difficultyClass = 'needs-improvement'; statusText = 'Needs Work'; }
        else if (item.percent < 85) { difficultyClass = 'getting-there'; statusText = 'Getting There'; }
        else { difficultyClass = 'learned'; statusText = 'Learned'; }

        div.innerHTML = `
            <div class="stat-label">
                <span class="stat-number">${item.number} <span class="stat-word-translation">— ${item.word}</span></span>
                <span class="stat-details">${item.data.timesStudied} trials · Avg ${item.avgTime.toFixed(2)}s</span>
            </div>
            <span class="stat-badge ${difficultyClass}">${Math.round(item.percent)}% · ${statusText}</span>
        `;
        elements.summaryResultsList.appendChild(div);
    });

    elements.summaryResults.classList.remove('hidden');

    showView('summary');
}

// Stats Logic
function showStats() {
    const lang = elements.langSelect.value;
    showView('stats');

    const allStats = StorageManager.getAllStats();
    const langStats = allStats[lang] || {};

    const statItems = [];
    for (let i = 0; i <= 100; i++) {
        // Check both number and string keys
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
        else if (item.percent < 70) { difficultyClass = 'needs-improvement'; statusText = 'Needs Work'; }
        else if (item.percent < 85) { difficultyClass = 'getting-there'; statusText = 'Getting There'; }
        else { difficultyClass = 'learned'; statusText = 'Learned'; }

        const word = NUMBER_DATA[lang][item.number] || '';
        div.innerHTML = `
            <div class="stat-label">
                <span class="stat-number">${item.number} <span class="stat-word-translation">— ${word}</span></span>
                <span class="stat-details">${item.data.timesStudied} trials · Avg ${item.avgTime.toFixed(2)}s</span>
            </div>
            <span class="stat-badge ${difficultyClass}">${Math.round(item.percent)}% · ${statusText}</span>
        `;
        elements.statsList.appendChild(div);
    });

    if (studiedCount === 0) {
        elements.statsList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>No numbers studied yet for this language.</p>
                <p class="empty-hint">Complete a session to see your progress here.</p>
            </div>
        `;
    }
}

// Speech Utility
function speak(text, lang) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
}

// Event Listeners
elements.startBtn.addEventListener('click', startSession);
elements.statsBtn.addEventListener('click', showStats);
elements.finishBtn.addEventListener('click', () => showView('home'));
elements.statsBackBtn.addEventListener('click', () => showView('home'));
elements.flashcard.addEventListener('click', flipCard);
elements.incorrectBtn.addEventListener('click', () => recordResult(false));
elements.correctBtn.addEventListener('click', () => recordResult(true));
elements.exitBtn.addEventListener('click', exitSession);
