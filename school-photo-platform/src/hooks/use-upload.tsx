'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';

import { processAndSavePhoto, revalidateClassroomPhotos } from '@/actions/photo-db-actions';
import { getSupabaseClient, getPublicUrl } from '@/lib/supabase/client';

// Configuration
const BUCKET_NAME = 'school-photos';
const CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; 
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Types
type UploadFile = {
  file: File;
  id: string;
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
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Файл слишком большой (максимум 50 МБ)` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Файл пустой' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Неподдерживаемый формат (разрешены: JPG, PNG, WebP)` };
  }

  return { valid: true };
}

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Upload original file to Supabase (client-side, direct)
 */
async function uploadOriginalToSupabase(
  file: File,
  classId: string,
  retries = MAX_RETRIES
): Promise<{ path: string; url: string }> {
  const supabase = getSupabaseClient();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const uniqueId = uuidv4();
  const fileName = `${timestamp}_${uniqueId}.${fileExtension}`;
  const filePath = `originals/${classId}/${fileName}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false,
        });

      if (error) {
        if (error.message.includes('already exists')) {
          throw new Error('Файл уже существует');
        }
        if (error.message.includes('Payload too large')) {
          throw new Error('Файл слишком большой');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed: no data returned');
      }

      const url = getPublicUrl(BUCKET_NAME, data.path);
      return { path: data.path, url };
    } catch (error: any) {
      console.error(`Upload attempt ${attempt}/${retries} failed:`, error);

      if (attempt === retries) {
        throw new Error(error.message || 'Upload failed after retries');
      }

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

  const uploadFiles = useCallback(
    async (files: File[], classId: string, schoolId: string): Promise<UploadResult> => {
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

      const uploadTasks = files.map((file, index) =>
        limit(async () => {
          try {
            setProgress((prev) => ({
              ...prev,
              currentFile: index + 1,
              currentFileName: file.name,
            }));

            const validation = validateFile(file);
            if (!validation.valid) {
              throw new Error(validation.error);
            }

            const { width, height } = await getImageDimensions(file);

            console.log(`📤 Uploading original: ${file.name}`);
            const { path: originalPath, url: originalUrl } = await uploadOriginalToSupabase(file, classId);
            console.log(`✅ Original uploaded: ${originalPath}`);

            console.log(`🔧 Processing on server: ${file.name}`);
            const result = await processAndSavePhoto({
              classId,
              originalUrl,
              originalPath,
              width,
              height,
              fileSize: file.size,
              mimeType: file.type,
              alt: file.name.replace(/\.[^/.]+$/, ''),
            });

            if (result.success && result.photoId) {
              uploadedPhotoIds.push(result.photoId);
              console.log(`✅ Photo processed: ${result.photoId}`);

              setProgress((prev) => ({
                ...prev,
                overallProgress: Math.round(((index + 1) / files.length) * 100),
                uploadedPhotoIds: [...prev.uploadedPhotoIds, result.photoId],
              }));
            }
          } catch (error: any) {
            console.error(`Failed to upload ${file.name}:`, error);

            const uploadError: UploadError = {
              fileName: file.name,
              error: error.message || 'Неизвестная ошибка',
              canRetry: !error.message?.includes('слишком большой'),
            };

            uploadErrors.push(uploadError);
            setErrors((prev) => [...prev, uploadError]);
          }
        })
      );

      await Promise.allSettled(uploadTasks);

      try {
        await revalidateClassroomPhotos(classId, schoolId);
      } catch (error) {
        console.error('Revalidation failed:', error);
      }

      setIsUploading(false);

      return {
        success: uploadErrors.length === 0,
        uploadedCount: uploadedPhotoIds.length,
        failedCount: uploadErrors.length,
        uploadedPhotoIds,
        errors: uploadErrors,
      };
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