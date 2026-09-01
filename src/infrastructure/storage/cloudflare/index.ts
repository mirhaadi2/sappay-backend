import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../../../config';
import { cloudflareR2Client } from './client';

export const uploadToCloudflareR2 = async (buffer: Buffer, key: string, contentType: string) => {
    await cloudflareR2Client.send(
        new PutObjectCommand({
            Bucket: config.cloudflare.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }),
    );
    return key;
};

export const fetchFromCloudflareR2 = async (key: string) => {
    const result = await cloudflareR2Client.send(
        new GetObjectCommand({
            Bucket: config.cloudflare.bucket,
            Key: key,
        }),
    );

    return result.Body;
};

export const resolveCloudflareR2Urls = async (keys: string[]): Promise<string[]> => {
    if (!Array.isArray(keys) || keys.length === 0) return [];

    return Promise.all(
        keys.map(async (key) => {
            if (!key) return '';
            if (key.startsWith('http')) return key;

            try {
                const command = new GetObjectCommand({
                    Bucket: config.cloudflare.bucket,
                    Key: key,
                });

                return await getSignedUrl(cloudflareR2Client, command, { expiresIn: 3600 });
            } catch (err) {
                console.error(`Failed to sign URL for key: ${key}`, err);
                return '';
            }
        }),
    );
};

export const getCloudflareR2SignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: config.cloudflare.bucket,
        Key: key,
    });

    return await getSignedUrl(cloudflareR2Client, command, { expiresIn });
};

export const deleteFromCloudflareR2 = async (key: string) => {
    await cloudflareR2Client.send(
        new DeleteObjectCommand({
            Bucket: config.cloudflare.bucket,
            Key: key,
        }),
    );
    return true;
};

export const checkCloudflareR2FileExists = async (key: string): Promise<boolean> => {
    try {
        await cloudflareR2Client.send(
            new HeadObjectCommand({
                Bucket: config.cloudflare.bucket,
                Key: key,
            }),
        );
        return true;
    } catch (error) {
        return false;
    }
};

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
    const chunks: any[] = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }

    return Buffer.concat(chunks);
};

export { cloudflareR2Client };
