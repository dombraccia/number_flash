// storage.js — Local Storage Manager (no Firebase, fully offline)
const STORAGE_KEY = 'numflash_stats';

const StorageManager = {
    _getData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    },

    _saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    getAllStats() {
        return this._getData();
    },

    getStats(language) {
        const data = this._getData();
        return data[language] || {};
    },

    saveResult(language, number, isCorrect, flipTime) {
        const data = this._getData();
        if (!data[language]) data[language] = {};

        const numStr = String(number);
        if (!data[language][numStr]) {
            data[language][numStr] = { timesStudied: 0, timesCorrect: 0, totalFlipTime: 0, recentFlipTimes: [] };
        }

        data[language][numStr].timesStudied += 1;
        if (isCorrect) data[language][numStr].timesCorrect += 1;
        data[language][numStr].totalFlipTime += flipTime;

        if (!data[language][numStr].recentFlipTimes) {
            data[language][numStr].recentFlipTimes = [];
        }
        data[language][numStr].recentFlipTimes.push(flipTime);
        if (data[language][numStr].recentFlipTimes.length > 10) {
            data[language][numStr].recentFlipTimes.shift();
        }

        this._saveData(data);
    }
};

export { StorageManager };
