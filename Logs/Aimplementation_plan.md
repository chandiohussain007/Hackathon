# Generate Android APK using Capacitor

We will generate an Android APK for the KhidmatAI application using Capacitor.js to wrap our React + Vite frontend into a native app. This allows the app to be installed and run directly on your Android device.

## Open Questions

> [!WARNING]
> Is it acceptable to hardcode your PC's local IP address (`192.168.10.9`) in the frontend code? 
> Because the APK will run on your phone, it cannot use `localhost` to find the backend (since `localhost` on the phone means the phone itself). Pointing the frontend to `192.168.10.9` ensures your phone can communicate with your computer over the local Wi-Fi. 

## Proposed Changes

### [MODIFY] backend/src/config.py
- Update `cors_origins` to allow `["*"]` so the mobile app's embedded webview can make requests without being blocked by CORS.

### [MODIFY] frontend/src/App.jsx
- Change `API_BASE` from `http://localhost:8000/api/v1` to `http://192.168.10.9:8000/api/v1`.

### Build Process (Terminal Commands)
I will run the following steps autonomously:
1. Install Capacitor dependencies in the `frontend` directory (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
2. Initialize Capacitor (`npx cap init KhidmatAI com.khidmat.app --web-dir dist`).
3. Add the Android platform (`npx cap add android`).
4. Build the web assets (`npm run build`).
5. Sync the web assets into the Android native project (`npx cap sync android`).
6. Execute Gradle to assemble the Android debug APK (`cd android; ./gradlew assembleDebug`).

## Verification Plan

### Automated Tests
- Verify the successful generation of the `.apk` file in the output directory.

### Manual Verification
- Provide you with the exact path to the generated `app-debug.apk` file so you can transfer it to your Android device.
- Instruct you to run the backend using `uvicorn src.api.main:app --host 0.0.0.0 --port 8000` so your phone can reach it.
