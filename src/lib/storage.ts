import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
}

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export class StorageService {
  /**
   * Upload an image file to Firebase Storage
   * @param file - The image file to upload
   * @param folder - The folder path in storage (e.g., 'blog-images', 'featured-images')
   * @param filename - Optional custom filename, otherwise uses timestamp + original name
   * @returns Promise with upload result
   */
  static async uploadImage(
    file: File,
    folder: string = 'blog-images',
    filename?: string
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Generate filename if not provided
      const finalFilename = filename || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Create storage reference
      const storageRef = ref(storage, `${folder}/${finalFilename}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        filename: finalFilename,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images at once
   * @param files - Array of image files
   * @param folder - Storage folder path
   * @returns Promise with array of upload results
   */
  static async uploadMultipleImages(
    files: File[],
    folder: string = 'blog-images'
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file, folder)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Firebase Storage
   * @param imagePath - The full path of the image in storage
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Delete multiple images from Firebase Storage
   * @param imagePaths - Array of image paths to delete
   */
  static async deleteMultipleImages(imagePaths: string[]): Promise<void> {
    const deletePromises = imagePaths.map(path => this.deleteImage(path));
    
    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw error;
    }
  }

  /**
   * Get all images from a specific folder
   * @param folder - The folder path to list images from
   * @returns Promise with array of image URLs and metadata
   */
  static async listImages(folder: string): Promise<Array<{
    url: string;
    path: string;
    name: string;
  }>> {
    try {
      const folderRef = ref(storage, folder);
      const result = await listAll(folderRef);
      
      const imagePromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          url,
          path: itemRef.fullPath,
          name: itemRef.name
        };
      });

      return await Promise.all(imagePromises);
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }

  /**
   * Resize image client-side before upload (optional optimization)
   * @param file - Original image file
   * @param maxWidth - Maximum width in pixels
   * @param maxHeight - Maximum height in pixels
   * @param quality - JPEG quality (0-1)
   * @returns Promise with resized file
   */
  static async resizeImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 800,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate optimized image variants (thumbnail, medium, large)
   * @param file - Original image file
   * @returns Promise with multiple sized versions
   */
  static async generateImageVariants(file: File): Promise<{
    original: UploadResult;
    large: UploadResult;
    medium: UploadResult;
    thumbnail: UploadResult;
  }> {
    try {
      // Create different sizes
      const largeImage = await this.resizeImage(file, 1200, 800, 0.85);
      const mediumImage = await this.resizeImage(file, 800, 600, 0.8);
      const thumbnailImage = await this.resizeImage(file, 300, 200, 0.75);

      // Upload all variants
      const baseFilename = file.name.split('.')[0];
      const extension = file.name.split('.').pop();

      const [original, large, medium, thumbnail] = await Promise.all([
        this.uploadImage(file, 'blog-images/originals'),
        this.uploadImage(largeImage, 'blog-images/large', `${baseFilename}-large.${extension}`),
        this.uploadImage(mediumImage, 'blog-images/medium', `${baseFilename}-medium.${extension}`),
        this.uploadImage(thumbnailImage, 'blog-images/thumbnails', `${baseFilename}-thumb.${extension}`)
      ]);

      return {
        original,
        large,
        medium,
        thumbnail
      };
    } catch (error) {
      console.error('Error generating image variants:', error);
      throw error;
    }
  }

  /**
   * Extract image path from Firebase Storage URL
   * @param url - Firebase Storage download URL
   * @returns Storage path or null if invalid URL
   */
  static extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/b\/[^\/]+\/o\/(.+)$/);
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a file is a valid image type
   * @param file - File to check
   * @returns boolean indicating if file is a valid image
   */
  static isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ];
    
    return validTypes.includes(file.type);
  }

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export utility functions
export const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  listImages,
  resizeImage,
  generateImageVariants,
  extractPathFromUrl,
  isValidImageFile,
  formatFileSize
} = StorageService;
