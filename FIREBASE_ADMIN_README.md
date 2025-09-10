# Firebase Admin SDK Setup Guide

This guide explains how to set up and use Firebase Admin SDK for server-side operations in your Yatra Path Finder project.

## 📋 Prerequisites

- Firebase project: `moksha-yatra-ai-25c42`
- Node.js installed
- Firebase Admin SDK installed (`npm install firebase-admin`)

## 🔑 Step 1: Generate Service Account Key

### Option A: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/project/moksha-yatra-ai-25c42/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Download the JSON file
4. Save it as `src/config/serviceAccountKey.json`
5. **⚠️ IMPORTANT:** Never commit this file to Git!

### Option B: Environment Variables (Development)
Set these environment variables in your `.env` file:
```env
FIREBASE_PROJECT_ID=moksha-yatra-ai-25c42
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@moksha-yatra-ai-25c42.iam.gserviceaccount.com
```

## ⚙️ Step 2: Configure Firebase Admin

### Update `src/services/firebaseAdmin.ts`

Uncomment the appropriate configuration in `src/services/firebaseAdmin.ts`:

```typescript
// Option 1: Service Account Key (Production)
import serviceAccount from '../config/serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://moksha-yatra-ai-25c42.firebaseio.com',
  storageBucket: 'moksha-yatra-ai-25c42.firebasestorage.app'
});

// Option 2: Environment Variables (Development)
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//   }),
//   databaseURL: 'https://moksha-yatra-ai-25c42.firebaseio.com',
//   storageBucket: 'moksha-yatra-ai-25c42.firebasestorage.app'
// });
```

## 🚀 Step 3: Usage Examples

### Basic Usage

```typescript
import { FirebaseAdminService } from './services/firebaseAdmin';

// Create a user
const result = await FirebaseAdminService.createUser(
  'user@example.com',
  'password123',
  'User Name'
);

// Get user data
const userData = await FirebaseAdminService.getUserByEmail('user@example.com');

// Set Firestore document
const docResult = await FirebaseAdminService.setDocument(
  'collection-name',
  'document-id',
  { data: 'value' }
);
```

### Advanced Examples

See `src/examples/firebaseAdminExample.ts` for comprehensive examples:

```typescript
import {
  userManagementExample,
  firestoreOperationsExample,
  completeAdminWorkflow
} from './examples/firebaseAdminExample';

// Run examples
await userManagementExample();
await firestoreOperationsExample();
await completeAdminWorkflow();
```

## 🔧 Available Admin Operations

### User Management
- `createUser(email, password, displayName)` - Create new user
- `deleteUser(uid)` - Delete user by UID
- `getUserByEmail(email)` - Get user by email
- `setCustomClaims(uid, claims)` - Set user roles/permissions
- `bulkDeleteUsers(uids)` - Delete multiple users

### Firestore Operations
- `getDocument(collection, docId)` - Get document
- `setDocument(collection, docId, data)` - Create/update document
- `updateDocument(collection, docId, data)` - Update document
- `deleteDocument(collection, docId)` - Delete document
- `getCollection(collection, limit)` - Get collection documents

### Analytics & Reporting
- `getUserCount()` - Get total user count
- `exportCollection(collectionName)` - Export collection data

## 🔒 Security Best Practices

### 1. Service Account Key Security
- ✅ Never commit `serviceAccountKey.json` to Git
- ✅ Add it to `.gitignore`
- ✅ Use environment variables in production
- ✅ Rotate keys regularly

### 2. Firestore Security Rules
Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin operations
    match /admin/{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.admin == true;
    }
  }
}
```

### 3. Environment Variables
For production deployments:
```env
FIREBASE_PROJECT_ID=moksha-yatra-ai-25c42
FIREBASE_PRIVATE_KEY=your_encoded_private_key
FIREBASE_CLIENT_EMAIL=your_service_account_email
```

## 🌐 Deployment Options

### Option 1: Firebase Cloud Functions
```bash
firebase init functions
cd functions
npm install firebase-admin
# Deploy: firebase deploy --only functions
```

### Option 2: Express Server
```javascript
const express = require('express');
const { FirebaseAdminService } = require('./services/firebaseAdmin');

const app = express();

// API endpoints using Firebase Admin
app.post('/api/users', async (req, res) => {
  const result = await FirebaseAdminService.createUser(
    req.body.email,
    req.body.password
  );
  res.json(result);
});

app.listen(3000);
```

### Option 3: Next.js API Routes
```typescript
// pages/api/users.ts
import { FirebaseAdminService } from '../../services/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const result = await FirebaseAdminService.createUser(
      req.body.email,
      req.body.password
    );
    res.status(200).json(result);
  }
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid service account key"**
   - Check if the JSON file is valid
   - Verify project ID matches

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify service account has proper permissions

3. **"App already initialized"**
   - Firebase Admin can only be initialized once
   - Check for multiple initialization calls

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

## 🎯 Next Steps

1. Generate your service account key
2. Configure Firebase Admin in your project
3. Test the examples in `firebaseAdminExample.ts`
4. Set up proper security rules
5. Deploy your admin operations

---

**Your Firebase Admin SDK is now ready for server-side operations!** 🚀