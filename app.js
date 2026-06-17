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
    summaryResultsList: document.getElementById('summary-results-list'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    settingDarkMode: document.getElementById('setting-dark-mode'),
    settingShowPercent: document.getElementById('setting-show-percent'),
    settingShowAvgTime: document.getElementById('setting-show-avg-time'),
    cardOrderBtn: document.getElementById('card-order-btn'),
    summaryTitle: document.getElementById('summary-title'),
    themeToggleBtn: document.getElementById('theme-toggle-btn')
};

// State
let sessionData = {
    language: '',
    numbers: [],
    currentIndex: 0,
    flipTime: 0,
    results: []
};

let canFlipCard = true;

let appSettings = {
    darkMode: true,
    showPercent: true,
    showAvgTime: true,
    randomOrder: true
};

// Settings & Preferences Persistence
function loadSettings() {
    const dm = localStorage.getItem('numflash_dark_mode');
    const sp = localStorage.getItem('numflash_show_percent');
    const sat = localStorage.getItem('numflash_show_avg_time');
    const ro = localStorage.getItem('numflash_random_order');

    appSettings.darkMode = dm === null ? true : dm === 'true';
    appSettings.showPercent = sp === null ? true : sp === 'true';
    appSettings.showAvgTime = sat === null ? true : sat === 'true';
    appSettings.randomOrder = ro === null ? true : ro === 'true';

    elements.settingDarkMode.checked = appSettings.darkMode;
    elements.settingShowPercent.checked = appSettings.showPercent;
    elements.settingShowAvgTime.checked = appSettings.showAvgTime;

    applyTheme();
    updateCardOrderButtonState();
}

function applyTheme() {
    if (appSettings.darkMode) {
        document.body.classList.remove('light-theme');
        elements.themeToggleBtn.textContent = '🌙';
    } else {
        document.body.classList.add('light-theme');
        elements.themeToggleBtn.textContent = '☀️';
    }
    elements.settingDarkMode.checked = appSettings.darkMode;
}

function updateCardOrderButtonState() {
    if (appSettings.randomOrder) {
        elements.cardOrderBtn.textContent = 'Random: ON';
        elements.cardOrderBtn.classList.add('active');
    } else {
        elements.cardOrderBtn.textContent = 'Random: OFF';
        elements.cardOrderBtn.classList.remove('active');
    }
}

function saveSetting(key, value) {
    localStorage.setItem(key, value);
}

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
loadSettings();
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

    let sessionNumbers;
    if (appSettings.randomOrder) {
        const shuffled = allNumbers.sort(() => 0.5 - Math.random());
        sessionNumbers = shuffled.slice(0, reviews);
    } else {
        sessionNumbers = allNumbers.slice(0, reviews);
    }

    sessionData = {
        language: lang,
        numbers: sessionNumbers,
        currentIndex: 0,
        results: [],
        totalStartTime: Date.now()
    };

    elements.summaryResults.classList.add('hidden');

    showView('session');
    canFlipCard = false;
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
    endSession(true);
}

function showNextCard() {
    if (sessionData.currentIndex >= sessionData.numbers.length) {
        endSession(false);
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

    // Guard: enable flip only after the transition back to front is fully done
    setTimeout(() => {
        canFlipCard = true;
    }, 100);
}

function flipCard() {
    if (!canFlipCard) return;
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
    canFlipCard = false; // Disable card tapping while transition runs
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

// Difficulty Calculation Helpers
function getAccuracyLevel(percent) {
    if (percent < 55) return 3;
    if (percent < 70) return 2;
    if (percent < 85) return 1;
    return 0;
}

function getTimeLevel(avgTime) {
    if (avgTime > 5) return 3;
    if (avgTime > 4) return 2;
    if (avgTime > 2) return 1;
    return 0;
}

const DIFFICULTY_LEVELS = [
    { className: 'learned', text: 'Learned' },
    { className: 'getting-there', text: 'Getting There' },
    { className: 'needs-improvement', text: 'Needs Work' },
    { className: 'difficult', text: 'Difficult' }
];

function getCardStatsInfo(num, data, language) {
    const timesStudied = data.timesStudied || 0;
    const percent = timesStudied > 0 ? (data.timesCorrect / timesStudied) * 100 : 0;
    
    // Calculate recent average flip time
    let recentAvgTime = 0;
    if (data.recentFlipTimes && data.recentFlipTimes.length > 0) {
        const sum = data.recentFlipTimes.reduce((a, b) => a + b, 0);
        recentAvgTime = sum / data.recentFlipTimes.length;
    } else if (timesStudied > 0) {
        recentAvgTime = data.totalFlipTime / timesStudied;
    }

    const accuracyLevel = getAccuracyLevel(percent);
    const timeLevel = getTimeLevel(recentAvgTime);
    const worseLevel = timesStudied > 0 ? Math.max(accuracyLevel, timeLevel) : 0;

    const word = NUMBER_DATA[language][num] || '';

    return {
        number: num,
        word,
        percent,
        recentAvgTime,
        worseLevel,
        timesStudied
    };
}

function renderBadgeContent(percent, avgTime, statusText) {
    const parts = [];
    if (appSettings.showPercent) {
        parts.push(`${Math.round(percent)}%`);
    }
    if (appSettings.showAvgTime) {
        parts.push(`${avgTime.toFixed(2)}s`);
    }
    parts.push(statusText);
    return parts.join(' · ');
}

function endSession(isEarlyExit = false) {
    const totalSessionTime = (Date.now() - sessionData.totalStartTime) / 1000;
    const correctCount = sessionData.results.filter(r => r.isCorrect).length;
    const accuracy = sessionData.results.length > 0 ? Math.round((correctCount / sessionData.results.length) * 100) : 0;
    const avgFlipTime = sessionData.results.length > 0 ? (sessionData.results.reduce((acc, r) => acc + r.flipTime, 0) / sessionData.results.length).toFixed(2) : '0.00';

    elements.summaryTime.textContent = Math.round(totalSessionTime);
    elements.summaryAccuracy.textContent = accuracy;
    elements.summaryAvgTime.textContent = avgFlipTime;

    if (isEarlyExit) {
        elements.summaryTitle.textContent = "Session Ended Early";
    } else {
        elements.summaryTitle.textContent = "Session Complete";
    }

    // Display session results sorted by difficulty
    const allStats = StorageManager.getAllStats();
    const langStats = allStats[sessionData.language] || {};

    const sessionNumbersUnique = [...new Set(sessionData.results.map(r => r.number))];
    const statItems = sessionNumbersUnique.map(num => {
        const data = langStats[num] || langStats[String(num)] || { timesStudied: 0, timesCorrect: 0, totalFlipTime: 0 };
        return getCardStatsInfo(num, data, sessionData.language);
    });

    // Sort by difficulty: highest worseLevel first, then lowest accuracy, then longest recentAvgTime
    statItems.sort((a, b) => {
        if (b.worseLevel !== a.worseLevel) return b.worseLevel - a.worseLevel;
        if (a.percent !== b.percent) return a.percent - b.percent;
        return b.recentAvgTime - a.recentAvgTime;
    });

    elements.summaryResultsList.innerHTML = '';
    
    statItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stat-item';

        const config = DIFFICULTY_LEVELS[item.worseLevel];
        const badgeText = renderBadgeContent(item.percent, item.recentAvgTime, config.text);

        div.innerHTML = `
            <div class="stat-label">
                <span class="stat-number">${item.number} <span class="stat-word-translation">— ${item.word}</span></span>
                <span class="stat-details">${item.timesStudied} trials · Avg ${item.recentAvgTime.toFixed(2)}s</span>
            </div>
            <span class="stat-badge ${config.className}">${badgeText}</span>
        `;
        elements.summaryResultsList.appendChild(div);
    });

    if (statItems.length > 0) {
        elements.summaryResults.classList.remove('hidden');
    } else {
        elements.summaryResults.classList.add('hidden');
    }

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
        const data = langStats[i] || langStats[String(i)] || { timesStudied: 0, timesCorrect: 0, totalFlipTime: 0 };
        if (data.timesStudied === 0) {
            statItems.push({ number: i, isStudied: false });
        } else {
            const info = getCardStatsInfo(i, data, lang);
            statItems.push({ ...info, isStudied: true });
        }
    }

    // Sort: studied cards first, sorted by worseLevel descending, then percent ascending, then recentAvgTime descending
    statItems.sort((a, b) => {
        if (!a.isStudied && !b.isStudied) return 0;
        if (!a.isStudied) return 1;
        if (!b.isStudied) return -1;
        if (b.worseLevel !== a.worseLevel) return b.worseLevel - a.worseLevel;
        if (a.percent !== b.percent) return a.percent - b.percent;
        return b.recentAvgTime - a.recentAvgTime;
    });

    elements.statsList.innerHTML = '';
    let studiedCount = 0;

    statItems.forEach(item => {
        if (!item.isStudied) return;
        studiedCount++;

        const div = document.createElement('div');
        div.className = 'stat-item';

        const config = DIFFICULTY_LEVELS[item.worseLevel];
        const badgeText = renderBadgeContent(item.percent, item.recentAvgTime, config.text);

        div.innerHTML = `
            <div class="stat-label">
                <span class="stat-number">${item.number} <span class="stat-word-translation">— ${item.word}</span></span>
                <span class="stat-details">${item.timesStudied} trials · Avg ${item.recentAvgTime.toFixed(2)}s</span>
            </div>
            <span class="stat-badge ${config.className}">${badgeText}</span>
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

// Settings Dialog / Events
elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
});
elements.settingsCloseBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
});
elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
        elements.settingsModal.classList.add('hidden');
    }
});
elements.settingDarkMode.addEventListener('change', (e) => {
    appSettings.darkMode = e.target.checked;
    saveSetting('numflash_dark_mode', appSettings.darkMode);
    applyTheme();
});
elements.settingShowPercent.addEventListener('change', (e) => {
    appSettings.showPercent = e.target.checked;
    saveSetting('numflash_show_percent', appSettings.showPercent);
    if (!views.summary.classList.contains('hidden')) {
        endSession(elements.summaryTitle.textContent === "Session Ended Early");
    } else if (!views.stats.classList.contains('hidden')) {
        showStats();
    }
});
elements.settingShowAvgTime.addEventListener('change', (e) => {
    appSettings.showAvgTime = e.target.checked;
    saveSetting('numflash_show_avg_time', appSettings.showAvgTime);
    if (!views.summary.classList.contains('hidden')) {
        endSession(elements.summaryTitle.textContent === "Session Ended Early");
    } else if (!views.stats.classList.contains('hidden')) {
        showStats();
    }
});
elements.cardOrderBtn.addEventListener('click', () => {
    appSettings.randomOrder = !appSettings.randomOrder;
    saveSetting('numflash_random_order', appSettings.randomOrder);
    updateCardOrderButtonState();
});

elements.themeToggleBtn.addEventListener('click', () => {
    appSettings.darkMode = !appSettings.darkMode;
    saveSetting('numflash_dark_mode', appSettings.darkMode);
    applyTheme();
});
