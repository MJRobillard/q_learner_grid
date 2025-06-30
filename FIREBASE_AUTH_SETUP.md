# Firebase Authentication Setup

## Enable Authentication Methods

### 1. Anonymous Authentication

1. **Go to Firebase Console** - [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Select your project** - "q-learner-board"
3. **Navigate to Authentication** - Click "Authentication" in the left sidebar
4. **Go to Sign-in method** - Click the "Sign-in method" tab
5. **Enable Anonymous** - Find "Anonymous" in the list and click on it
6. **Enable it** - Toggle the switch to "Enable"
7. **Save** - Click "Save"

### 2. Google Authentication

1. **In the same Sign-in method page**, find "Google" in the list and click on it
2. **Enable Google** - Toggle the switch to "Enable"
3. **Configure OAuth consent screen** (if not already done):
   - Click "Configure" next to "OAuth consent screen"
   - Add your domain to authorized domains if needed
   - Set the app name and user support email
4. **Add authorized domains** - Add your domain (e.g., `localhost` for development)
5. **Save** - Click "Save"

## Security Rules Update

Update your Firestore security rules to allow authenticated users to write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highscores/{document} {
      allow read: if true;  // Anyone can read highscores
      allow write: if request.auth != null; // Only authenticated users can write
    }
  }
}
```

## How it Works

- **Google Sign-in**: Users can sign in with their Google account for a persistent experience
- **Guest Sign-in**: Users can click "Continue as Guest" to get an anonymous account
- **User Information**: Google users will have their display name pre-filled in the score submission form
- **Secure**: Each submission is tied to a unique user ID
- **Sign Out**: Users can sign out to clear their session

## Features Added

✅ **Google Authentication** - Sign in with Google account  
✅ **Anonymous Authentication** - Guest sign-in for easy access  
✅ **User Tracking** - Each score linked to a user ID  
✅ **Auto-fill Names** - Google display names pre-filled in forms  
✅ **Sign Out** - Users can sign out when done  
✅ **Session Persistence** - Stays signed in across page refreshes  
✅ **Security** - Only authenticated users can submit scores  
✅ **User Display** - Shows Google user info vs Guest status 