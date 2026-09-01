import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../../../config';

export const awsS3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});
