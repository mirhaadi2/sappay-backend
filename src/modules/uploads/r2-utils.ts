import { r2Client } from './r2';
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from '../../config';
import { Readable } from 'stream';

/**
 * Upload file to R2
 */
export const uploadToR2 = async (buffer: Buffer, key: string, contentType: string) => {
  await r2Client.send(new PutObjectCommand({
    Bucket: config.cloudflare.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return key;
};

/**
 * Fetch file from R2 (returns stream)
 */
export const fetchFromR2 = async (key: string) => {
  const result = await r2Client.send(new GetObjectCommand({
    Bucket: config.cloudflare.bucket,
    Key: key,
  }));
  return result.Body; // Returns the Readable stream
};

const sanitizeImageKeys = (keys: any[]): string[] => {
  if (!Array.isArray(keys)) return [];
  return keys
    .filter((key) => typeof key === 'string' && key.trim().length > 0)
    .map((key) => key.trim());
};

const tryPublicUrl = (key: string): string | null => {
  if (!config.cloudflare.publicUrl) return null;
  const normalized = config.cloudflare.publicUrl.replace(/\/+$/, '');
  return `${normalized}/${key}`;
};

export const resolveR2Url = async (key: string): Promise<string> => {
  if (!key || typeof key !== 'string') return "";
  const trimmedKey = key.trim();
  if (!trimmedKey) return "";
  if (trimmedKey.startsWith("http://") || trimmedKey.startsWith("https://")) return trimmedKey;

  const publicUrl = tryPublicUrl(trimmedKey);
  if (publicUrl) return publicUrl;

  try {
    const command = new GetObjectCommand({
      Bucket: config.cloudflare.bucket,
      Key: trimmedKey,
    });
    return await getSignedUrl(r2Client, command, { expiresIn: 604800 });
  } catch (err) {
    console.error(`Failed to sign URL for key: ${trimmedKey}`, err);
    return "";
  }
};

export const resolveR2Urls = async (keys: string[]): Promise<string[]> => {
  const sanitizedKeys = sanitizeImageKeys(keys);
  if (sanitizedKeys.length === 0) return [];

  return Promise.all(sanitizedKeys.map(resolveR2Url));
};

/**
 * Generate a secure, time-limited Signed URL for the B2C/Admin portals
 * Default expiry is 7 days (604800 seconds) to avoid browser display breakage
 */
export const getR2SignedUrl = async (key: string, expiresIn = 604800): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: config.cloudflare.bucket,
    Key: key,
  });
  
  // This generates the actual signed URL using your R2 credentials
  return await getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Delete file from R2
 */
export const deleteFromR2 = async (key: string) => {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: config.cloudflare.bucket,
    Key: key,
  }));
  return true;
};

/**
 * Check if a file exists (Useful for preventing duplicate uploads)
 */
export const checkFileExists = async (key: string): Promise<boolean> => {
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: config.cloudflare.bucket,
      Key: key,
    }));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Utility: Convert R2 Stream to Buffer 
 * (Essential if you plan to use 'sharp' for image resizing later)
 */
export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};