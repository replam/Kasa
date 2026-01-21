# 🔐 Kasa - Secure Note Taking

**Kasa** is a modern, privacy-focused note-taking and password management application built with **React**, **TypeScript**, and **Capacitor**. Designed to provide a secure and seamless experience on mobile devices.

<div align="center">
  <!-- You can add a screenshot or banner here if you have one -->
  <!-- <img src="assets/banner.png" width="100%" alt="Kasa Banner" /> -->
</div>

## ✨ Features

*   **🔒 Secure Encryption:** All notes and passwords are encrypted locally on your device. Your data never leaves your phone.
*   **🌑 Dark & Light Mode:** Beautiful, responsive UI with automatic dark mode support.
*   **📱 Native Experience:** Built with Capacitor to run smoothly as a native Android app.
*   **⚡ High Performance:** Powered by Vite and React 19 for instant load times.


## 🛠️ Tech Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Mobile Engine:** [Capacitor 7](https://capacitorjs.com/)
*   **Styling:** [TailwindCSS](https://tailwindcss.com/)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   Android Studio (for building the APK)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/kasa.git
    cd kasa
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run locally (Browser):**
    ```bash
    npm run dev
    ```

### 📱 Build for Android

1.  **Build the web assets:**
    ```bash
    npm run build
    ```

2.  **Sync with Capacitor:**
    ```bash
    npx cap sync android
    ```

3.  **Open in Android Studio:**
    ```bash
    npx cap open android
    ```
    *Or build via command line:*
    ```bash
    cd android
    ./gradlew assembleDebug
    ```

---

<p align="center">
  Built with ❤️ by <b>Alper Mercan</b>
</p>
