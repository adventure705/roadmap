// Firebase Configuration
// IMPORTANT: Replace the placeholders below with your actual Firebase project configuration credentials.
// You can get these from the Firebase Console: Project Settings > General > Your Apps > SDK Setup and Configuration (CDN)

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    console.log("Firebase initialized");
} else {
    console.error("Firebase SDK not loaded");
}
