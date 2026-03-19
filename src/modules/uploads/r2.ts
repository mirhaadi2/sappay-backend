import { S3Client } from "@aws-sdk/client-s3";
import { config } from '../../config';

// Cloudflare R2 requires a specific endpoint format:
// https://<ACCOUNT_ID>.r2.cloudflarestorage.com
const r2Endpoint = `https://${config.cloudflare.accountId}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: "auto", // R2 is region-less, but the SDK requires a string
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: config.cloudflare.accessKeyId,
    secretAccessKey: config.cloudflare.secretAccessKey,
  },
});