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

export const resolveR2Urls = async (keys: string[]): Promise<string[]> => {
  if (!Array.isArray(keys) || keys.length === 0) return [];

  return Promise.all(
    keys.map(async (key) => {
      if (!key) return "";
      if (key.startsWith("http")) return key;

      try {
        // Generate the signed URL locally (No network request made here)
        const command = new GetObjectCommand({
          Bucket: config.cloudflare.bucket,
          Key: key,
        });
        
        // expiresIn: 3600 (1 hour) - adjust based on your caching strategy
        return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      } catch (err) {
        console.error(`Failed to sign URL for key: ${key}`, err);
        return "";
      }
    })
  );
};

/**
 * Generate a secure, time-limited Signed URL for the B2C/Admin portals
 * Default expiry is 1 hour (3600 seconds)
 */
export const getR2SignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
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