# Firebase Storage Setup Guide

This guide will help you set up Firebase Storage for handling blog images in your PeakNorth Blog Automation System.

## 🔥 **Firebase Storage Configuration**

### **Step 1: Enable Firebase Storage**

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your `peaknorth-blog` project
3. Navigate to **Storage** in the left sidebar
4. Click **Get Started**
5. Choose **Start in production mode** (we'll configure rules next)
6. Select your storage location (choose closest to your users)

### **Step 2: Configure Storage Security Rules**

1. In Firebase Console, go to **Storage** → **Rules**
2. Replace the default rules with the contents from `storage.rules`:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Blog images - allow authenticated users to read/write
    match /blog-images/{allPaths=**} {
      allow read: if true; // Public read access for blog images
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024 // Max 5MB
        && request.resource.contentType.matches('image/.*'); // Only images
    }

    // Featured images - same rules as blog images
    match /featured-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    // Thumbnails and processed images
    match /thumbnails/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish** to save the rules

### **Step 3: Update Environment Variables**

Make sure your `.env` file includes the Firebase Storage bucket:

```env
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## 📁 **Storage Folder Structure**

Your Firebase Storage will be organized as follows:

```
gs://your-project-id.appspot.com/
├── blog-images/           # Content images for blog posts
│   ├── originals/         # Original uploaded images
│   ├── large/            # Large sized images (1200px)
│   ├── medium/           # Medium sized images (800px)
│   └── thumbnails/       # Thumbnail images (300px)
├── featured-images/       # Featured images for blog posts
└── temp/                 # Temporary uploads (auto-cleanup)
```

## 🎯 **Image Upload Features**

### **Supported Image Types**

- JPEG/JPG
- PNG
- WebP
- GIF
- SVG

### **File Size Limits**

- **Maximum size**: 5MB per image
- **Recommended size**: 1-2MB for optimal performance

### **Automatic Image Processing**

The system includes:

- **Client-side resizing** before upload
- **Multiple variants** generation (original, large, medium, thumbnail)
- **Automatic optimization** for web delivery
- **Alt text and caption** management

## 🔧 **Using the Image Upload Components**

### **Single Image Upload**

```tsx
import { ImageUpload } from "../components/ImageUpload";

function MyComponent() {
  const handleImageUpload = (result: UploadResult) => {
    // TODO : Save to your blog post data
  };

  return (
    <ImageUpload
      onImageUploaded={handleImageUpload}
      folder="featured-images"
      showPreview={true}
    />
  );
}
```

### **Multiple Image Upload**

```tsx
import { MultiImageUpload } from "../components/ImageUpload";

function MyComponent() {
  const handleImagesUpload = (results: UploadResult[]) => {
    // Add to your blog post images array
  };

  return (
    <MultiImageUpload
      onImagesUploaded={handleImagesUpload}
      folder="blog-images"
      maxFiles={10}
      existingImages={existingImageUrls}
    />
  );
}
```

## 🗂️ **Blog Post Schema Updates**

Your blog posts now support rich image metadata:

```typescript
interface BlogPost {
  // ... other fields

  // Featured image for the blog post
  featuredImage?: {
    url: string;
    storagePath: string;
    filename: string;
    size: number;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  };

  // Content images used within the blog post
  images?: BlogImage[];
}
```

## 🎨 **Image Management Features**

### **In the Admin Dashboard**

1. **Featured Image Upload**:

   - Drag & drop or click to upload
   - Automatic preview
   - Alt text and caption editing
   - Easy removal and replacement

2. **Content Images**:

   - Bulk upload support
   - Individual image management
   - Alt text for accessibility
   - Captions for context

3. **Image Optimization**:
   - Automatic resizing
   - Format optimization
   - Progressive loading
   - CDN delivery via Firebase

## 📝 **Best Practices**

### **Image Optimization**

1. **Use appropriate formats**:

   - WebP for modern browsers
   - JPEG for photos
   - PNG for graphics with transparency

2. **Optimize before upload**:

   - The system automatically resizes large images
   - Consider manual optimization for best results

3. **Alt text is important**:
   - Always provide descriptive alt text
   - Helps with SEO and accessibility

### **Storage Management**

1. **Regular cleanup**:

   - Remove unused images periodically
   - Use the temp folder for temporary uploads

2. **Organize by purpose**:
   - `featured-images/` for blog post headers
   - `blog-images/` for content images
   - `thumbnails/` for processed versions

## 🔍 **Testing Your Setup**

### **1. Test Image Upload**

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to a blog post edit page
3. Try uploading a featured image
4. Verify the image appears in Firebase Storage console

### **2. Test Image Display**

1. Upload an image through the admin interface
2. Check that it displays correctly in the preview
3. Verify the image URL is publicly accessible

### **3. Test Image Deletion**

1. Upload a test image
2. Remove it using the delete button
3. Verify it's removed from Firebase Storage

## 🚨 **Troubleshooting**

### **Common Issues**

**"Permission denied" errors:**

- Check that your storage rules are published
- Verify the user is authenticated (if required)
- Ensure the file path matches your rules

**"File too large" errors:**

- Images must be under 5MB
- The system will auto-resize, but very large images may fail

**Images not displaying:**

- Check the Firebase Storage URL is correct
- Verify the image is publicly readable
- Check browser console for CORS errors

### **Debug Commands**

```bash
# Check Firebase connection
firebase auth:list

# Test storage rules
firebase emulators:start --only storage

# View storage usage
firebase use your-project-id
firebase functions:log
```

## 📈 **Monitoring & Analytics**

### **Storage Usage**

Monitor your storage usage in Firebase Console:

1. Go to **Storage** → **Usage**
2. Check monthly upload/download quotas
3. Monitor storage size limits

### **Performance**

- Images are served via Firebase CDN
- Automatic optimization and caching
- Global edge locations for fast delivery

## 🎉 **You're Ready!**

Your Firebase Storage is now configured for the PeakNorth Blog Automation System. You can:

- ✅ Upload featured images for blog posts
- ✅ Add multiple content images
- ✅ Manage image metadata (alt text, captions)
- ✅ Automatically optimize and resize images
- ✅ Store images securely with proper access controls

The system will handle all the complex image management while you focus on creating great content!

---

**Need help?** Check the [main README](README.md) or [setup guide](SETUP.md) for additional configuration options.
