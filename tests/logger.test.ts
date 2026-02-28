import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../server/logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should log debug messages', () => {
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
        logger.debug('Test debug message', { key: 'value' });
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        logger.info('Test info message');
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        logger.warn('Test warn message');
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        logger.error('Test error message');
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in log messages', () => {
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        logger.info('Test message', { userId: '123', action: 'login' });
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Test message'),
            expect.stringContaining('123'),
            expect.stringContaining('login')
        );
    });

    it('should log HTTP requests', () => {
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        logger.logRequest('GET', '/api/students', 200, 150);
        expect(consoleSpy).toHaveBeenCalled();
    });
});
