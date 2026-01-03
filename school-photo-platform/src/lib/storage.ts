import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Use service role to bypass RLS for uploads
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'school-photos';

/**
 * Upload file to Supabase Storage
 * @param fileBuffer - The file buffer to upload
 * @param path - The storage path (e.g., 'originals/classId/uuid.jpg')
 * @param contentType - MIME type of the file
 * @returns Upload metadata including path and size
 */
export async function uploadFile(
  fileBuffer: Buffer,
  path: string,
  contentType: string
): Promise<{
  path: string;
  fullPath: string;
  size:  number;
}> {
  try {
    const { data, error } = await supabase. storage
      .from(BUCKET_NAME)
      .upload(path, fileBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    if (! data) {
      throw new Error('Upload succeeded but no data returned');
    }

    return {
      path:  data.path,
      fullPath: data.fullPath,
      size: fileBuffer.length,
    };
  } catch (error:  any) {
    console.error('Error uploading file to Supabase:', error);
    throw new Error(error. message || 'Failed to upload file to storage');
  }
}

/**
 * Get public URL for a file in storage
 * @param path - The storage path (e.g., 'watermarked/classId/uuid. jpg')
 * @returns Full public URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  if (!data || !data.publicUrl) {
    throw new Error('Failed to generate public URL');
  }

  return data.publicUrl;
}

/**
 * Delete a file from storage
 * @param path - The storage path to delete
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage. from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error deleting file from Supabase:', error);
    throw new Error(error.message || 'Failed to delete file from storage');
  }
}

/**
 * Get signed URL for private files (e.g., originals)
 * @param path - The storage path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  path: string,
  expiresIn:  number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabase. storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Supabase signed URL error:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data || !data.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    return data.signedUrl;
  } catch (error: any) {
    console.error('Error creating signed URL:', error);
    throw new Error(error.message || 'Failed to create signed URL');
  }
}

export default supabase;