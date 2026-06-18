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
    },

    revertResult(language, number, isCorrect, flipTime) {
        const data = this._getData();
        if (!data[language]) return;

        const numStr = String(number);
        if (!data[language][numStr]) return;

        const stats = data[language][numStr];
        stats.timesStudied = Math.max(0, stats.timesStudied - 1);
        if (isCorrect) {
            stats.timesCorrect = Math.max(0, stats.timesCorrect - 1);
        }
        stats.totalFlipTime = Math.max(0, stats.totalFlipTime - flipTime);

        if (stats.recentFlipTimes && stats.recentFlipTimes.length > 0) {
            stats.recentFlipTimes.pop();
        }

        if (stats.timesStudied === 0) {
            delete data[language][numStr];
        }

        this._saveData(data);
    }
};

export { StorageManager };
