import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../../../config';

const r2Endpoint = `https://${config.cloudflare.accountId}.r2.cloudflarestorage.com`;

export const cloudflareR2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
        accessKeyId: config.cloudflare.accessKeyId,
        secretAccessKey: config.cloudflare.secretAccessKey,
    },
});
