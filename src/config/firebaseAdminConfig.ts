// Firebase Admin Configuration
// This file contains configuration for Firebase Admin SDK

// For production: Use service account key
// 1. Go to Firebase Console: https://console.firebase.google.com/project/moksha-yatra-ai-25c42/settings/serviceaccounts/adminsdk
// 2. Click "Generate new private key"
// 3. Download the JSON file and save it as 'serviceAccountKey.json' in this config folder
// 4. Uncomment the code below and update the path

// import serviceAccount from './serviceAccountKey.json';

// Production configuration with service account
export const firebaseAdminConfig = {
  // Uncomment and use for production
  // credential: admin.credential.cert(serviceAccount),

  // For development, you can use environment variables
  // Make sure to set these environment variables:
  // FIREBASE_PROJECT_ID=moksha-yatra-ai-25c42
  // FIREBASE_PRIVATE_KEY=your_private_key_here
  // FIREBASE_CLIENT_EMAIL=your_client_email_here

  // Development configuration (uncomment if using env vars)
  // credential: admin.credential.cert({
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // }),

  databaseURL: 'https://moksha-yatra-ai-25c42.firebaseio.com',
  storageBucket: 'moksha-yatra-ai-25c42.firebasestorage.app'
};

// Instructions for setting up service account key:
// 1. Visit: https://console.firebase.google.com/project/moksha-yatra-ai-25c42/settings/serviceaccounts/adminsdk
// 2. Click "Generate new private key"
// 3. Download the JSON file
// 4. Save it in src/config/serviceAccountKey.json
// 5. Uncomment the import and credential lines above
// 6. Update firebaseAdmin.ts to use this configuration

export default firebaseAdminConfig;