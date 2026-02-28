/**
 * Environment configuration validation and access.
 * Ensures all required environment variables are set and validated.
 */
import 'dotenv/config';

interface Config {
    nodeEnv: 'development' | 'production' | 'test';
    port: number;
    databaseUrl: string;
    sessionSecret: string;
    isProduction: boolean;
    isDevelopment: boolean;
}

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`[CONFIG] Required environment variable ${name} is not set`);
    }
    return value;
}

function getEnv(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

function getPort(): number {
    const port = parseInt(process.env.PORT || '5000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`[CONFIG] Invalid PORT: ${process.env.PORT}`);
    }
    return port;
}

export const config: Config = {
    nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
    port: getPort(),
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    sessionSecret: getEnv('SESSION_SECRET', 'change-me-in-development'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
};

// Validate production config
if (config.isProduction) {
    if (!process.env.SESSION_SECRET) {
        throw new Error('[CONFIG] SESSION_SECRET must be set in production');
    }
    if (config.sessionSecret.length < 32) {
        throw new Error('[CONFIG] SESSION_SECRET must be at least 32 characters in production');
    }
}

export default config;
