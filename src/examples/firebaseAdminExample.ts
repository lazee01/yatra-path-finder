// Example usage of Firebase Admin SDK
// This file demonstrates how to use Firebase Admin operations

import { FirebaseAdminService } from '../services/firebaseAdmin';

// Example 1: User Management
export async function userManagementExample() {
  console.log('=== Firebase Admin User Management Examples ===');

  // Create a new user
  const createResult = await FirebaseAdminService.createUser(
    'example@example.com',
    'securePassword123',
    'Example User'
  );
  console.log('Create user result:', createResult);

  // Get user by email
  const getUserResult = await FirebaseAdminService.getUserByEmail('example@example.com');
  console.log('Get user result:', getUserResult);

  // Set custom claims (for roles/permissions)
  if (getUserResult.success && getUserResult.user) {
    const claimsResult = await FirebaseAdminService.setCustomClaims(getUserResult.user.uid, {
      role: 'admin',
      premium: true
    });
    console.log('Set custom claims result:', claimsResult);
  }
}

// Example 2: Firestore Operations
export async function firestoreOperationsExample() {
  console.log('=== Firebase Admin Firestore Examples ===');

  // Create a document
  const setDocResult = await FirebaseAdminService.setDocument('test-collection', 'test-doc', {
    name: 'Test Document',
    description: 'Created with Firebase Admin SDK',
    timestamp: new Date(),
    metadata: {
      createdBy: 'admin',
      version: '1.0'
    }
  });
  console.log('Set document result:', setDocResult);

  // Get a document
  const getDocResult = await FirebaseAdminService.getDocument('test-collection', 'test-doc');
  console.log('Get document result:', getDocResult);

  // Update a document
  const updateDocResult = await FirebaseAdminService.updateDocument('test-collection', 'test-doc', {
    lastModified: new Date(),
    status: 'updated'
  });
  console.log('Update document result:', updateDocResult);

  // Get all documents from a collection
  const getCollectionResult = await FirebaseAdminService.getCollection('test-collection', 10);
  console.log('Get collection result:', getCollectionResult);
}

// Example 3: Analytics and Reporting
export async function analyticsExample() {
  console.log('=== Firebase Admin Analytics Examples ===');

  // Get user count
  const userCountResult = await FirebaseAdminService.getUserCount();
  console.log('User count result:', userCountResult);

  // Export collection data (for backup/analytics)
  const exportResult = await FirebaseAdminService.exportCollection('users');
  console.log('Export collection result:', exportResult);
}

// Example 4: Bulk Operations
export async function bulkOperationsExample() {
  console.log('=== Firebase Admin Bulk Operations Examples ===');

  // Note: This is just an example - be careful with bulk operations
  // const bulkDeleteResult = await FirebaseAdminService.bulkDeleteUsers(['uid1', 'uid2']);
  // console.log('Bulk delete result:', bulkDeleteResult);
}

// Example 5: Complete Admin Workflow
export async function completeAdminWorkflow() {
  console.log('=== Complete Firebase Admin Workflow ===');

  try {
    // 1. Create a user
    const userResult = await FirebaseAdminService.createUser(
      'workflow@example.com',
      'password123',
      'Workflow User'
    );

    if (userResult.success) {
      console.log('✅ User created successfully');

      // 2. Set user preferences
      const prefsResult = await FirebaseAdminService.setDocument(
        'users',
        userResult.user.uid,
        {
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          },
          profile: {
            displayName: userResult.user.displayName,
            email: userResult.user.email,
            createdAt: new Date()
          }
        }
      );

      if (prefsResult.success) {
        console.log('✅ User preferences set successfully');

        // 3. Create a sample trip
        const tripResult = await FirebaseAdminService.setDocument(
          'trips',
          `trip_${Date.now()}`,
          {
            userId: userResult.user.uid,
            destination: 'Varanasi',
            duration: 3,
            budget: 'mid',
            createdAt: new Date(),
            status: 'planned'
          }
        );

        if (tripResult.success) {
          console.log('✅ Trip created successfully');
        }
      }
    }

    console.log('🎉 Complete admin workflow finished successfully!');

  } catch (error) {
    console.error('❌ Error in admin workflow:', error);
  }
}

// All functions are already exported above
// Usage:
// import { completeAdminWorkflow } from './examples/firebaseAdminExample';
// completeAdminWorkflow().then(() => console.log('Done!'));

// Usage example:
// import { completeAdminWorkflow } from './examples/firebaseAdminExample';
// completeAdminWorkflow().then(() => console.log('Done!'));