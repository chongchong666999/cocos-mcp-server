/**
 * Global logger utility for cocos-mcp-server
 * Logs to file in logs/ directory
 */

import * as fs from 'fs';
import * as path from 'path';

class Logger {
    private _logFilePath: string;
    private _logStream: fs.WriteStream | null = null;
    private _isInitialized = false;

    constructor() {
        const extensionPath = path.join(__dirname, '..', '..');
        const logsDir = path.join(extensionPath, 'logs');

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        this._logFilePath = path.join(logsDir, 'mcp-server.log');
        this._logStream = fs.createWriteStream(this._logFilePath, { flags: 'a' });
        this._isInitialized = true;

        const separator = '\n' + '='.repeat(80) + '\n';
        this._logStream.write(separator);

        this.info('=== Logger initialized ===');
        this.info(`Session started at: ${new Date().toISOString()}`);
        this.info(`Log file: ${this._logFilePath}`);
    }

    private _formatMessage(level: string, ...args: any[]): string {
        const now = new Date();
        const utc9Time = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const timestamp = utc9Time.toISOString().replace('Z', '+09:00');

        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        return `[${timestamp}] [${level}] ${message}\n`;
    }

    private _write(level: string, ...args: any[]): void {
        if (!this._isInitialized || !this._logStream) {
            return;
        }

        const formattedMessage = this._formatMessage(level, ...args);
        this._logStream.write(formattedMessage);
    }

    public log(...args: any[]): void {
        this._write('LOG', ...args);
    }

    public info(...args: any[]): void {
        this._write('INFO', ...args);
    }

    public warn(...args: any[]): void {
        this._write('WARN', ...args);
    }

    public error(...args: any[]): void {
        this._write('ERROR', ...args);
    }

    public debug(...args: any[]): void {
        this._write('DEBUG', ...args);
    }

    public close(): void {
        if (this._logStream) {
            this._logStream.end();
            this._logStream = null;
        }
        this._isInitialized = false;
    }

    public getLogFilePath(): string {
        return this._logFilePath;
    }
}

let globalLogger: Logger | null = null;

export function initLogger(): Logger {
    if (!globalLogger) {
        globalLogger = new Logger();
    }
    return globalLogger;
}

export function getLogger(): Logger {
    if (!globalLogger) {
        globalLogger = initLogger();
    }
    return globalLogger;
}

export function closeLogger(): void {
    if (globalLogger) {
        globalLogger.close();
        globalLogger = null;
    }
}

export default {
    log: (...args: any[]) => getLogger().log(...args),
    info: (...args: any[]) => getLogger().info(...args),
    warn: (...args: any[]) => getLogger().warn(...args),
    error: (...args: any[]) => getLogger().error(...args),
    debug: (...args: any[]) => getLogger().debug(...args),
    getLogFilePath: () => getLogger().getLogFilePath(),
    close: () => closeLogger()
};
