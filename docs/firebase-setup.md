# Firebase Setup Guide

This guide explains how to set up Firebase for Sawyer's RPG Game cloud save functionality.

## Prerequisites

- Node.js and npm installed
- A Google account
- Firebase SDK installed (already done via `npm install firebase`)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "sawyers-rpg")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Required Services

### Authentication
1. In the Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Optionally enable **Anonymous** authentication for testing

### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll configure security rules later)
4. Select your preferred location
5. Click "Done"

### Storage
1. Go to **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Choose your storage location
5. Click "Done"

## Step 3: Get Configuration Values

1. In the Firebase Console, go to **Project settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web app** icon (`</>`)
4. Register your app with a nickname (e.g., "Sawyers RPG Web")
5. Copy the configuration object values

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local` in your project root:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values from your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your-actual-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

3. Restart your development server to load the new environment variables

## Step 5: Configure Firestore Security Rules

1. In the Firebase Console, go to **Firestore Database**
2. Click on the **Rules** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own save data
    match /users/{userId}/saves/{saveId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User profile data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 6: Configure Storage Security Rules

1. In the Firebase Console, go to **Storage**
2. Click on the **Rules** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own save files
    match /users/{userId}/saves/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 7: Test the Connection

1. Start your development server
2. Open the browser console
3. Look for Firebase initialization messages
4. The app should initialize Firebase automatically

## Development vs Production

### Development
- Use the configuration from your Firebase project
- Optionally enable Firebase emulators for local development
- Set `REACT_APP_USE_FIREBASE_EMULATOR=true` to use local emulators

### Production
- Use the same Firebase project or create a separate production project
- Ensure environment variables are set in your deployment environment
- Configure proper security rules
- Enable appropriate authentication methods

## Troubleshooting

### Common Issues

1. **"Firebase API key is invalid"**
   - Double-check your API key in the environment variables
   - Ensure the key is for the correct project

2. **"Permission denied"**
   - Check Firestore and Storage security rules
   - Ensure the user is properly authenticated

3. **"Project ID not found"**
   - Verify the project ID matches your Firebase project
   - Check for typos in environment variables

4. **Network errors in development**
   - Ensure your Firebase project allows localhost origins
   - Check if you need to add your domain to authorized domains

### Environment Variable Issues

If you see placeholder values like "your-api-key-here" in the console:
1. Verify your `.env.local` file exists
2. Restart your development server
3. Check that variable names match exactly (including `REACT_APP_` prefix)

### Firebase Console Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

## Next Steps

Once Firebase is configured:
1. Test authentication functionality
2. Test Firestore save/load operations
3. Configure additional security rules as needed
4. Set up production environment