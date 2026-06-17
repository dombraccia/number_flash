# ⚡ Number Flash

Number Flash is a sleek, offline-first Progressive Web App (PWA) designed to help you master numbers in **French** (🇫🇷) and **Italian** (🇮🇹) from **0 to 200**. 

With smart difficulty tracking, audio pronunciations, and tailored review modes, you can practice on any device, anywhere—even without an internet connection.

---

## 🌟 Key Features

- **🇫🇷 French & 🇮🇹 Italian Support**: Practice numbers ranging from `0` to `200` with accurate pronunciation.
- **🎯 Configurable Sessions**: Choose your target language, specify a custom number range, and select how many reviews you want to complete.
- **🔀 Card Order Control**: Toggle between **Random** shuffling (default) or **Sequential** order (low to high) directly from the setup panel.
- **🔊 Interactive Audio**: Hear native pronunciations automatically when a card is revealed, or tap any number card on your stats pages to repeat the pronunciation.
- **🌙 Dynamic Themes**: Instantly switch between dark and light themes with the header toggle.
- **📱 Installed PWA Support**: Add the app to your phone’s home screen. It runs full-screen, offline, with zero loading latency.
- **🔒 Private & Local**: Your statistics, progress, and settings are saved 100% locally on your device's storage. No servers, no accounts, and no tracking.

---

## 📊 Smart Difficulty Tracking

Number Flash uses a dual-metric scoring system to evaluate your progress. For each number, it checks:
1. **Accuracy**: Your lifetime correct-guess ratio.
2. **Response Speed**: Your average reaction time across the **last 10 reviews** of that number.

The app compares both metrics and ranks the card according to the **worse measure** of the two, placing cards into four progress categories:

| Category | Accuracy Range | Avg. Response Time |
| :--- | :--- | :--- |
| **🔴 Difficult** | Below 55% | Greater than 5 seconds |
| **🟠 Needs Work** | 55% – 69% | 4 – 5 seconds |
| **🟡 Getting There** | 70% – 84% | 2 – 4 seconds |
| **🟢 Learned** | 85% or higher | Under 2 seconds |

---

## 🎯 Tailored Review Modes

Practice smarter with custom targeted reviews:
* **Retrain Weak Cards**: At the end of a session, if there are cards you haven't mastered yet (*Difficult*, *Needs Work*, or *Getting There*), you can tap **"Retrain Weak Cards"** to instantly launch a new practice session containing only those numbers.
* **Progress Category Review**: On your **My Progress** page, select any combination of the four difficulty categories via checkboxes (e.g., practice only *Difficult* and *Needs Work* cards) and start a targeted review session of just those numbers.

---

## 📲 How to Install (Offline PWA)

Number Flash works 100% offline once loaded. For the best full-screen experience, install it on your device:

### iOS (iPhone / iPad)
1. Open **Safari** and navigate to your deployed Number Flash website.
2. Tap the **Share** button (the square icon with an upward arrow at the bottom of the screen).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.

### Android
1. Open **Chrome** and navigate to the website.
2. Tap the three-dot menu button.
3. Tap **"Install App"** (or **"Add to Home screen"**).
4. Follow the prompt to complete the installation.
