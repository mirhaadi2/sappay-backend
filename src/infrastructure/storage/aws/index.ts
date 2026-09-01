import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../../../config';
import { awsS3Client } from './client';

export const uploadToAwsS3 = async (
    bucket: string,
    buffer: Buffer,
    key: string,
    contentType: string,
) => {
    await awsS3Client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }),
    );
    return key;
};

export const fetchFromAwsS3 = async (bucket: string, key: string) => {
    const result = await awsS3Client.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        }),
    );

    return result.Body;
};

export const getAwsS3SignedUrl = async (
    bucket: string,
    key: string,
    expiresIn = 3600,
): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    return await getSignedUrl(awsS3Client, command, { expiresIn });
};

export const deleteFromAwsS3 = async (bucket: string, key: string) => {
    await awsS3Client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }),
    );
    return true;
};

export const checkAwsS3FileExists = async (bucket: string, key: string): Promise<boolean> => {
    try {
        await awsS3Client.send(
            new HeadObjectCommand({
                Bucket: bucket,
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

export { awsS3Client };
