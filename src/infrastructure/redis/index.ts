import { createClient } from 'redis';
import { config } from '../../config';

const redisClient = createClient({
    url: config.redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Max Redis reconnection attempts reached');
                return false;
            }
            return retries * 50;
        },
        connectTimeout: 10000,
    },
});

redisClient.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err?.message || err);
    console.log('⚠️  Application will start without Redis. Restart once Redis is available.');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
    console.log('✅ Redis ready to serve requests');
});

export { redisClient };
