# ⚡ Number Flash ⚡

Number Flash is a free web application designed to help language learners improve both accuracy and recall time of numbers in their target language. It uses a flashcard-style interface with smart difficulty analytics incorporating *both* speed and accuracy in recalling numbers, helping you optimize your practice sessions. I built this tool specifically to help me master recalling numbers in French and Italian, a task I have found surprisingly difficult to do quickly and accurately. I hope it can help you too!

## Installation

Number Flash is a Progressive Web App (PWA) that can be installed on your device for an app-like experience, without needing to go to the App Store.

### iPhone / iPad Users
1. Open **Safari** and open https://dbraccia.com/number-flash
2. Tap the three-dot menu button and then tap **Share** (looks like a square with an upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.

### Android Users
> NOTE: I have not tested it on Android, but should work as a standard PWA

1. Open **Chrome** and navigate to https://dbraccia.com/number-flash
2. Tap the three-dot menu button.
3. Tap **"Install App"** (or **"Add to Home screen"**).
4. Follow the prompt to complete the installation. 

> [!WARNING]  
> Aside from initial setup, Number Flash is a 100% offline application, so all of your review data is stored locally on your device's browser. If you clear your browser data or switch devices, your progress is not saved.

## ℹ More Information

* **Current Languages**: French (🇫🇷), Italian (🇮🇹), Spanish (🇪🇸), Kannada (🇮🇳), and Mandarin (🇨🇳).
* **Number Range**: Custom bounds supported up to `1100` (varies by language, e.g., `100` for Kannada, `1000` for Mandarin).
* **Flow & Customization**:
  * **Card Order**: Toggle between **Random** and **Sequential** order.
  * **Auto Read Aloud**: Toggled automatic pronunciation on card flip.
  * **Custom Reviews**: Select review lengths up to language limit.
  * **Dark Mode**: High contrast night mode styling toggle.
* **Smart Difficulty Analytics**:
  * Tracks response times (rolling average of the last 10 flips) and accuracy percentages.
  * Automatically classifies cards into 4 levels: *Difficult*, *Needs Work*, *Getting There*, and *Learned*.
  * Built-in targeting filter for quick reviews of weak categories.
