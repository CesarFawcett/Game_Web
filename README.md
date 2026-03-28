# 🃏 Game_Web - Premium Card Battler

A powerful, Yugioh-inspired card game platform with a real-time feel, interactive boards, and intuitive administration.

---

## ✨ Features

-   **🕹️ Yugioh-style Board**: 6 card slots and a dedicated deck space for each player.
-   **🔐 Admin Mode**: Secure portal (password: `admin123`) to upload custom cards with stats and images.
-   **⚡ Real-time Experience**: Powered by React and Framer Motion for smooth animations and transitions.
-   **🖼️ Premium UI**: Modern dark theme with glassmorphism and high-quality typography.
-   **📦 Docker Ready**: Full-stack orchestration (Frontend + Backend + MongoDB) in a single command.

---

## 🚀 Getting Started

### Prerequisites

-   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### Running with Docker (easiest)

1.  Open your terminal in the `Game_Web` directory.
2.  Launch the stack:
    ```bash
    docker-compose up --build
    ```
3.  Access the game at: `http://localhost:5173`

---

## 🛠️ Technical Stack

-   **Frontend**: Vite, React, Lucide Icons, Framer Motion.
-   **Backend**: Node.js, Express, Multer (file uploads).
-   **Database**: MongoDB with Mongoose.
-   **Infrastructure**: Docker Compose.

---

## 📂 Project Structure

```bash
Game_Web/
├── backend/        # Node.js/Express API & Models
├── frontend/       # Vite/React Application
├── uploads/        # Card images storage
├── docker-compose.yml # Full stack orchestration
└── README.md       # Project documentation
```

---

## 🛡️ Administrative Info

To enter Admin Mode:
1. Click the **User Icon** (top right).
2. Use password `admin123`.
3. Add cards and they will immediately be available in Player Mode.

---

*Desarrollado con ❤️ para amantes de los juegos de cartas.*
