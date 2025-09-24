import React, { useState, useRef } from "react";
import { StorageService, UploadResult } from "../lib/storage";

interface ImageUploadProps {
  onImageUploaded: (result: UploadResult) => void;
  onError?: (error: string) => void;
  folder?: string;
  maxFiles?: number;
  showPreview?: boolean;
  accept?: string;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  preview?: string;
}

export function ImageUpload({
  onImageUploaded,
  onError,
  folder = "blog-images",
  maxFiles = 1,
  showPreview = true,
  accept = "image/*",
  className = "",
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // For now, handle single file upload

    // Validate file
    if (!StorageService.isValidImageFile(file)) {
      const error =
        "Please select a valid image file (JPEG, PNG, WebP, GIF, SVG)";
      setUploadState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    // Show preview
    if (showPreview) {
      const previewUrl = URL.createObjectURL(file);
      setUploadState((prev) => ({
        ...prev,
        preview: previewUrl,
        error: undefined,
      }));
    }

    // Start upload
    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: undefined,
    }));

    try {
      // Simulate progress (Firebase doesn't provide real-time progress for small files)
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 20, 90),
        }));
      }, 200);

      const result = await StorageService.uploadImage(file, folder);

      clearInterval(progressInterval);
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        error: undefined,
      }));

      onImageUploaded(result);

      // Clear preview after successful upload
      setTimeout(() => {
        setUploadState((prev) => ({
          ...prev,
          preview: undefined,
          progress: 0,
        }));
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className={`image-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${uploadState.isUploading ? "pointer-events-none opacity-50" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploadState.isUploading}
        />

        {uploadState.isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-sm text-gray-600">
              Uploading... {uploadState.progress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{" "}
              or drag and drop
            </div>
            <div className="text-xs text-gray-500">
              PNG, JPG, WebP up to 5MB
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && uploadState.preview && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
          <div className="relative inline-block">
            <img
              src={uploadState.preview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-lg shadow-sm border"
            />
            {uploadState.progress === 100 && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <div className="text-sm text-red-800">{uploadState.error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-image upload component
interface MultiImageUploadProps
  extends Omit<ImageUploadProps, "onImageUploaded"> {
  onImagesUploaded: (results: UploadResult[]) => void;
  maxFiles?: number;
  existingImages?: string[];
  onImageRemove?: (imageUrl: string) => void;
}

export function MultiImageUpload({
  onImagesUploaded,
  onError,
  folder = "blog-images",
  maxFiles = 5,
  showPreview = true,
  existingImages = [],
  onImageRemove,
  className = "",
}: MultiImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) =>
      StorageService.isValidImageFile(file)
    );

    if (validFiles.length === 0) {
      const error = "Please select valid image files";
      setUploadState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    // Check max files limit
    const totalFiles = existingImages.length + validFiles.length;
    if (totalFiles > maxFiles) {
      const error = `Maximum ${maxFiles} images allowed`;
      setUploadState((prev) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    // Show previews
    if (showPreview) {
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }

    setUploadState({ isUploading: true, progress: 0, error: undefined });

    try {
      const results = await StorageService.uploadMultipleImages(
        validFiles,
        folder
      );

      setUploadState({
        isUploading: false,
        progress: 100,
        error: undefined,
      });

      onImagesUploaded(results);

      // Clear previews
      setTimeout(() => {
        setPreviews([]);
        setUploadState((prev) => ({ ...prev, progress: 0 }));
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      onError?.(errorMessage);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeExistingImage = (imageUrl: string) => {
    onImageRemove?.(imageUrl);
  };

  return (
    <div className={`multi-image-upload ${className}`}>
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Current Images:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                {onImageRemove && (
                  <button
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploadState.isUploading}
        />

        {uploadState.isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-sm text-gray-600">Uploading images...</div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              Click to upload up to {maxFiles} images
            </div>
            <div className="text-xs text-gray-500">
              PNG, JPG, WebP up to 5MB each
            </div>
          </div>
        )}
      </div>

      {/* Preview of new uploads */}
      {previews.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            New Uploads:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                {uploadState.progress === 100 && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">{uploadState.error}</div>
        </div>
      )}
    </div>
  );
}
