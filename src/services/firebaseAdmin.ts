// Firebase Admin SDK for server-side operations
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  // For production, use service account key
  // const serviceAccount = require('../config/serviceAccountKey.json');

  // For development, you can use environment variables or default credentials
  admin.initializeApp({
    // Option 1: Use service account key (recommended for production)
    // credential: admin.credential.cert(serviceAccount),

    // Option 2: Use environment variables (for development)
    // credential: admin.credential.cert({
    //   projectId: process.env.FIREBASE_PROJECT_ID,
    //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // }),

    // Option 3: Use default credentials (when running on GCP)
    // credential: admin.credential.applicationDefault(),

    // Database URL (optional, for Realtime Database)
    databaseURL: `https://moksha-yatra-ai-25c42.firebaseio.com`,

    // Storage bucket
    storageBucket: 'moksha-yatra-ai-25c42.firebasestorage.app'
  });
}

// Export admin services
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Helper functions for common admin operations
export class FirebaseAdminService {
  // User management
  static async createUser(email: string, password: string, displayName?: string) {
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
      return { success: true, user: userRecord };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteUser(uid: string) {
    try {
      await adminAuth.deleteUser(uid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      return { success: true, user: userRecord };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Firestore operations
  static async getDocument(collection: string, documentId: string) {
    try {
      const docRef = adminDb.collection(collection).doc(documentId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async setDocument(collection: string, documentId: string, data: any) {
    try {
      await adminDb.collection(collection).doc(documentId).set(data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateDocument(collection: string, documentId: string, data: any) {
    try {
      await adminDb.collection(collection).doc(documentId).update(data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteDocument(collection: string, documentId: string) {
    try {
      await adminDb.collection(collection).doc(documentId).delete();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCollection(collection: string, limitCount: number = 50) {
    try {
      const querySnapshot = await adminDb.collection(collection).limit(limitCount).get();
      const documents: any[] = [];

      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, data: documents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom claims for user roles
  static async setCustomClaims(uid: string, claims: { [key: string]: any }) {
    try {
      await adminAuth.setCustomUserClaims(uid, claims);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Bulk operations
  static async bulkDeleteUsers(uids: string[]) {
    try {
      await adminAuth.deleteUsers(uids);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Analytics and reporting
  static async getUserCount() {
    try {
      // This would typically use Firebase Analytics or custom counters
      const usersSnapshot = await adminDb.collection('users').get();
      return { success: true, count: usersSnapshot.size };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Backup and maintenance
  static async exportCollection(collectionName: string) {
    try {
      const querySnapshot = await adminDb.collection(collectionName).get();
      const data: any[] = [];

      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export the admin app instance
export default admin;