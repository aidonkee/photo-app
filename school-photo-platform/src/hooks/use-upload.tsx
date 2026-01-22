'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';

import { revalidateClassroomPhotos } from '@/actions/photo-db-actions';

// Configuration
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
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?:  string } {
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
      error: `Неподдерживаемый формат (разрешены: JPG, PNG, WebP)`,
    };
  }

  return { valid: true };
}

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload single file via API with watermark processing
 * This uses the same API endpoint as PhotoUploader
 */
async function uploadFileViaAPI(
  file: File,
  classId: string,
  schoolId: string,
  retries = MAX_RETRIES
): Promise<{ success: boolean; id?:  string; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      formData.append('schoolId', schoolId);

      const response = await fetch(`/api/upload-photos? t=${Date.now()}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (! response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return { success: true, id: result. id };
    } catch (error:  any) {
      console.error(`Upload attempt ${attempt}/${retries} failed:`, error);

      // If last attempt, return error
      if (attempt === retries) {
        return {
          success: false,
          error: error.message || 'Upload failed after retries',
        };
      }

      // Wait before retrying (exponential backoff)
      await sleep(RETRY_DELAY * attempt);
    }
  }

  return { success: false, error: 'Upload failed' };
}

/**
 * Main upload hook - now uses API for watermark processing
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
   * Upload files via API (with watermark processing on server)
   */
  const uploadFiles = useCallback(
    async (files: File[], classId: string, schoolId: string): Promise<UploadResult> => {
      if (files.length === 0) {
        return {
          success: false,
          uploadedCount: 0,
          failedCount:  0,
          uploadedPhotoIds: [],
          errors:  [{ fileName: '', error: 'Не выбраны файлы', canRetry: false }],
        };
      }

      setIsUploading(true);
      setErrors([]);
      setProgress({
        currentFile: 0,
        totalFiles: files.length,
        currentFileName: '',
        overallProgress: 0,
        uploadedPhotoIds:  [],
      });

      const uploadedPhotoIds: string[] = [];
      const uploadErrors: UploadError[] = [];
      const limit = pLimit(CONCURRENT_UPLOADS);

      // Create upload tasks
      const uploadTasks = files.map((file, index) =>
        limit(async () => {
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

            // 2. Upload via API (server handles watermark + thumbnail)
            const result = await uploadFileViaAPI(file, classId, schoolId);

            if (result.success && result.id) {
              uploadedPhotoIds.push(result.id);

              // Update progress
              setProgress((prev) => ({
                ... prev,
                overallProgress: Math.round(((index + 1) / files.length) * 100),
                uploadedPhotoIds: [...prev.uploadedPhotoIds, result.id! ],
              }));
            } else {
              throw new Error(result.error || 'Upload failed');
            }
          } catch (error: any) {
            console.error(`Failed to upload ${file.name}: `, error);

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
        errors: uploadErrors,
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