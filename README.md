# 🛋️ Sofa So Good

A personal TV show & movie tracking PWA for iPhone, shared between you and your partner in real-time.

## Tech Stack
- **Frontend**: React + Vite PWA
- **Backend**: Firebase (Firestore + Auth)
- **Data**: TMDB API

## Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., "sofa-so-good")
3. Enable **Firestore Database** (start in production mode)
4. Enable **Authentication** → Email/Password
5. Go to Project Settings → General → Your apps → Add web app
6. Copy the SDK configuration values

### 2. Get a TMDB API Key
1. Register at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API
3. Request an API key (free for personal use)
4. Copy your **Read Access Token (v4 auth)**

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and fill in all the REPLACE_ME values
```

### 4. Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # select your project
cp firebase/firestore.rules firestore.rules
firebase deploy --only firestore:rules
```

### 5. Run Locally
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### 6. Install on iPhone
1. Open Safari on your iPhone
2. Navigate to your deployed URL (or use a tunnel like `ngrok` for local)
3. Tap Share → "Add to Home Screen"
4. Tap "Add" — the app appears on your home screen!

### 7. Share with Your Partner
1. Open the app → Sign up (create a new account for her)
2. One of you creates a household, the other joins with the invite code
3. Your partner adds the app to her home screen too — done! 🎉

## Development
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview the production build
```

## Features
- 🔍 Search movies and TV shows via TMDB
- 📺 Track watched episodes per season
- 🎬 Mark movies as watched with timestamp
- 📚 Library with All / TV / Movie filters
- 📅 See upcoming episodes for shows you follow
- 🏠 Shared household — real-time sync with your partner
- 📱 PWA — install on iPhone, works offline

---
*This product uses the TMDB API but is not endorsed or certified by TMDB.*
