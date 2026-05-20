# KhidmatAI — Smart AI Service Assistant (Pakistan)

KhidmatAI is a mobile-first, intelligent platform connecting users in Pakistan with verified local service providers (Plumbers, AC Repair, Deep Cleaning, Electricians). It features real multilingual input parsing (Urdu, English, Roman Urdu), voice input capability, advanced provider matching, dynamic pricing, and an administrative control panel with live sync tracking.

## Repository Structure

```
├── apps/
│   ├── customer-app/          # Mobile Frontend App (Vite React + Capacitor)
│   └── orchestration-dashboard/ # Admin Workflow Panel (Original version)
├── frontend/                  # Unified Mobile Frontend App (Vite React + Capacitor)
├── server/                    # Node.js Express Backend with Gemini & Firestore integration
├── admin/                     # Vite React Control Center & Kanban Dashboard
├── firebase.json              # Firebase/Firestore Deployment Configuration
├── .env.example               # Environment Variables configuration blueprint
└── README.md                  # Development & Deployment documentation (This file)
```

---

## Local Development Setup

### 1. Unified Mobile Frontend (`/frontend` or `/apps/customer-app`)
The mobile frontend app uses React 19 and Capacitor.
```bash
cd frontend
npm install

# Run locally in web browser
npm run dev

# Sync web assets to Android
npm run build
npx cap sync android
npx cap open android
```

### 2. Express Backend Server (`/server`)
```bash
cd server
npm install
npm start
```
By default, the server runs on port `8080` and communicates with the Gemini API and Firebase Firestore. If Firebase Service Account variables are not configured in `.env`, the server automatically defaults to a reliable, offline-capable memory database.

### 3. Control Center Admin Dashboard (`/admin`)
```bash
cd admin
npm install
npm run dev
```

---

## Deployment to Google Cloud Console

To deploy both the backend API and the Admin Dashboard to Google Cloud Run, execute the following commands.

### Prerequisites
1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2. Authenticate and configure your active project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

### 1. Deploy Backend (Express API) to Google Cloud Run
Run this command from the root directory to build and deploy the backend:
```bash
gcloud run deploy khidmat-backend \
  --source ./server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=AIzaSyCdsOCgw5xwmCZhCGG1BEcrJEZfRh5xgVk"
```

### 2. Deploy Admin Control Panel to Google Cloud Run
Run this command from the root directory to build and deploy the frontend dashboard:
```bash
gcloud run deploy khidmat-admin \
  --source ./admin \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Features Implemented

1. **Bilingual Layouts & Voice Input**: Text fields support both English and Urdu (Urdu is prioritized first). Built-in speech recognition processes voice inputs using the Web Speech API (`ur-PK` layout with fallback to `en-US`).
2. **Capacitor Geolocation**: Displays a location chip and pulls real coordinate data via reverse geocoding via OpenStreetMap Nominatim, persisting the detected city using Capacitor Preferences.
3. **AI Chat Hub**: Interactive chat log persisted in `localStorage` supporting instant bookings, context-aware answers, and rich image uploads.
4. **Emergency Dispatch Toggle**: Users can fast-track appointments (surcharge of PKR 200) inside the checkout screen.
5. **Local Notifications**: Follow-up notification is automatically scheduled 24 hours after booking creation.
6. **Kanban Admin Panel**: Multi-stage columns (`New`, `Assigned`, `In Progress`, `Done`) with inline technician assignment and real-time backend updates.
