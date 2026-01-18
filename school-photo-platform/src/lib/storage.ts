import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Admin client (service role) — игнорирует RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'school-photos';

/**
 * Upload file (admin client). Does NOT overwrite by default.
 */
export async function uploadFile(
  fileBuffer: Buffer,
  path: string,
  contentType: string
): Promise<{
  path: string;
  fullPath: string;
  size: number;
}> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned');
  }

  return {
    path: data.path,
    fullPath: data.fullPath,
    size: fileBuffer.length,
  };
}

/**
 * Upload file with optional upsert.
 */
export async function uploadFileDirect(
  path: string,
  buffer: Buffer,
  contentType: string,
  upsert: boolean = false
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, buffer, {
    contentType,
    upsert,
  });

  if (error) {
    throw new Error(`Failed to upload ${path}: ${error.message}`);
  }
}

/**
 * Get public URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  if (!data || !data.publicUrl) {
    throw new Error('Failed to generate public URL');
  }
  return data.publicUrl;
}

/**
 * Delete file
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Signed URL (for private access)
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, expiresIn);
  if (error) {
    console.error('Supabase signed URL error:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
  if (!data || !data.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }
  return data.signedUrl;
}

export default supabase;