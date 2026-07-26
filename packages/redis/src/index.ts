import {Redis} from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl,{
    maxRetriesPerRequest:null,
})

export const redisPub = new Redis(redisUrl, {
    maxRetriesPerRequest:null,
})

export const redisSub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
})

export * from './schema.js'

export const STREAM = {
    USER_REGISTRATION: 'stream:user_registration',
} as const



export interface UserRegistrationPayload {
    userId:    string,
    email:     string,
    timestamp: string;
}