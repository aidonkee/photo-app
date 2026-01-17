'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';

import { savePhotoRecord, revalidateClassroomPhotos } from '@/actions/photo-db-actions';
import { getSupabaseClient, getPublicUrl } from '@/lib/supabase/client';

// Configuration
const BUCKET_NAME = 'school-photos';
const CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Types
type UploadFile = {
  file: File;
  id: string; // Unique ID for tracking
};

type UploadProgress = {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  overallProgress: number;
  uploadedPhotoIds: string[];
};

type UploadError = {
  fileName: string;
  error: string;
  canRetry: boolean;
};

type UploadResult = {
  success: boolean;
  uploadedCount: number;
  failedCount: number;
  uploadedPhotoIds: string[];
  errors: UploadError[];
};

/**
 * Extract image dimensions using browser Image API
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Файл слишком большой (максимум 50 МБ)`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Файл пустой',
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:  `Неподдерживаемый формат (разрешены: JPG, PNG, WebP)`,
    };
  }

  return { valid: true };
}

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload single file to Supabase with retry logic
 */
async function uploadFileWithRetry(
  file: File,
  classId: string,
  retries = MAX_RETRIES
): Promise<string> {
  const supabase = getSupabaseClient();
  const fileExtension = file.name.split('. ').pop() || 'jpg';
  const timestamp = Date.now();
  const uniqueId = uuidv4();
  const fileName = `${timestamp}_${uniqueId}.${fileExtension}`;
  const filePath = `originals/${classId}/${fileName}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase. storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 year cache
          upsert: false,
        });

      if (error) {
        // Don't retry on certain errors
        if (error.message.includes('already exists')) {
          throw new Error('Файл уже существует');
        }
        if (error.message.includes('Payload too large')) {
          throw new Error('Файл слишком большой');
        }
        
        throw error;
      }

      if (! data) {
        throw new Error('Upload failed:  no data returned');
      }

      // Return public URL
      return getPublicUrl(BUCKET_NAME, data.path);
    } catch (error:  any) {
      console.error(`Upload attempt ${attempt}/${retries} failed:`, error);

      // If last attempt, throw error
      if (attempt === retries) {
        throw new Error(error.message || 'Upload failed after retries');
      }

      // Wait before retrying (exponential backoff)
      await sleep(RETRY_DELAY * attempt);
    }
  }

  throw new Error('Upload failed');
}

/**
 * Main upload hook
 */
export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    overallProgress: 0,
    uploadedPhotoIds: [],
  });
  const [errors, setErrors] = useState<UploadError[]>([]);

  /**
   * Upload files to Supabase and save metadata to database
   */
  const uploadFiles = useCallback(
    async (files: File[], classId: string, schoolId:  string): Promise<UploadResult> => {
      if (files.length === 0) {
        return {
          success: false,
          uploadedCount: 0,
          failedCount: 0,
          uploadedPhotoIds: [],
          errors: [{ fileName: '', error: 'Не выбраны файлы', canRetry: false }],
        };
      }

      setIsUploading(true);
      setErrors([]);
      setProgress({
        currentFile: 0,
        totalFiles: files.length,
        currentFileName: '',
        overallProgress: 0,
        uploadedPhotoIds: [],
      });

      const uploadedPhotoIds: string[] = [];
      const uploadErrors: UploadError[] = [];
      const limit = pLimit(CONCURRENT_UPLOADS);

      // Create upload tasks
      const uploadTasks = files.map((file, index) =>
        limit(async () => {
          const uploadFile:  UploadFile = { file, id: uuidv4() };

          try {
            // Update current file progress
            setProgress((prev) => ({
              ...prev,
              currentFile: index + 1,
              currentFileName: file.name,
            }));

            // 1. Validate file
            const validation = validateFile(file);
            if (!validation.valid) {
              throw new Error(validation.error);
            }

            // 2. Extract image dimensions
            const { width, height } = await getImageDimensions(file);

            // 3. Upload file to Supabase
            const originalUrl = await uploadFileWithRetry(file, classId);

            // 4. Save metadata to database
            const result = await savePhotoRecord({
              classId,
              originalUrl,
              width,
              height,
              fileSize: file.size,
              mimeType: file. type,
              alt: file. name. replace(/\.[^/.]+$/, ''), // Remove extension
            });

            if (result.success && result.photoId) {
              uploadedPhotoIds.push(result.photoId);

              // Update progress
              setProgress((prev) => ({
                ... prev,
                overallProgress: Math.round(((index + 1) / files.length) * 100),
                uploadedPhotoIds: [... prev.uploadedPhotoIds, result.photoId],
              }));
            }
          } catch (error:  any) {
            console.error(`Failed to upload ${file.name}:`, error);

            const uploadError: UploadError = {
              fileName: file.name,
              error: error.message || 'Неизвестная ошибка',
              canRetry: ! error.message?. includes('слишком большой'),
            };

            uploadErrors.push(uploadError);
            setErrors((prev) => [...prev, uploadError]);
          }
        })
      );

      // Wait for all uploads to complete
      await Promise.allSettled(uploadTasks);

      // Batch revalidation at the end
      try {
        await revalidateClassroomPhotos(classId, schoolId);
      } catch (error) {
        console.error('Revalidation failed:', error);
        // Don't fail the whole operation if revalidation fails
      }

      setIsUploading(false);

      const result: UploadResult = {
        success: uploadErrors.length === 0,
        uploadedCount: uploadedPhotoIds.length,
        failedCount: uploadErrors.length,
        uploadedPhotoIds,
        errors:  uploadErrors,
      };

      return result;
    },
    []
  );

  return {
    uploadFiles,
    isUploading,
    progress,
    errors,
  };
}