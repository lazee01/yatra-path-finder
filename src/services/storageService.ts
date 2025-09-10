import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadResult
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export class StorageService {
  // Upload file to Firebase Storage
  static async uploadFile(
    file: File,
    path: string,
    userId?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fullPath = userId ? `users/${userId}/${path}/${fileName}` : `${path}/${fileName}`;
      const storageRef = ref(storage, fullPath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { success: true, url: downloadURL };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Upload temple image
  static async uploadTempleImage(
    file: File,
    templeName: string,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(file, `temples/${templeName}`, userId);
  }

  // Upload hotel image
  static async uploadHotelImage(
    file: File,
    hotelName: string,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(file, `hotels/${hotelName}`, userId);
  }

  // Upload attraction image
  static async uploadAttractionImage(
    file: File,
    attractionName: string,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(file, `attractions/${attractionName}`, userId);
  }

  // Upload trip photo
  static async uploadTripPhoto(
    file: File,
    tripId: string,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(file, `trips/${tripId}`, userId);
  }

  // Upload profile picture
  static async uploadProfilePicture(
    file: File,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(file, 'profile-pictures', userId);
  }

  // Delete file from Firebase Storage
  static async deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get download URL for a file path
  static async getFileURL(path: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // List all files in a directory
  static async listFiles(path: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      const files = result.items.map(item => item.fullPath);
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Validate file type and size
  static validateFile(file: File, allowedTypes: string[], maxSizeMB: number = 5): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  // Generate optimized image URL with Firebase Image Optimization
  static getOptimizedImageURL(url: string, width?: number, height?: number): string {
    if (!url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    let optimizedURL = url;

    if (width || height) {
      const separator = url.includes('?') ? '&' : '?';
      const params = [];

      if (width) params.push(`w=${width}`);
      if (height) params.push(`h=${height}`);

      optimizedURL = `${url}${separator}${params.join('&')}`;
    }

    return optimizedURL;
  }
}