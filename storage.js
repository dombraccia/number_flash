import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCBCUxwnDtDbgPe1FdDXm-xTwBVcKlGnw",
  authDomain: "number-flash-8e808.firebaseapp.com",
  projectId: "number-flash-8e808",
  storageBucket: "number-flash-8e808.firebasestorage.app",
  messagingSenderId: "738887353689",
  appId: "1:738887353689:web:359842cd0386ca290db848",
  measurementId: "G-0GENB9ED6R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const StorageManager = {
    async getStats(userId) {
        if (!userId) return {};
        try {
            const docRef = doc(db, "users", userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data().stats || {} : {};
        } catch (e) {
            console.error("Error getting stats:", e);
            return {};
        }
    },

    async saveResult(userId, language, number, isCorrect, flipTime) {
        if (!userId) return;
        console.log(`Saving result: ${language} ${number}`, { isCorrect, flipTime });
        const docRef = doc(db, "users", userId);
        
        // Firestore keys must be strings
        const numStr = String(number);
        const path = `stats.${language}.${numStr}`;
        
        try {
            await updateDoc(docRef, {
                [`${path}.timesStudied`]: increment(1),
                [`${path}.timesCorrect`]: isCorrect ? increment(1) : increment(0),
                [`${path}.totalFlipTime`]: increment(flipTime)
            });
        } catch (e) {
            console.warn("Doc update failed, trying merge...", e);
            const statsUpdate = {};
            statsUpdate[language] = {};
            statsUpdate[language][numStr] = {
                timesStudied: 1,
                timesCorrect: isCorrect ? 1 : 0,
                totalFlipTime: flipTime
            };
            await setDoc(docRef, { stats: statsUpdate }, { merge: true });
        }
    }
};

export { app, db, StorageManager };
