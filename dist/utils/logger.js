"use strict";
/**
 * Global logger utility for cocos-mcp-server
 * Logs to file in logs/ directory
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = initLogger;
exports.getLogger = getLogger;
exports.closeLogger = closeLogger;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Logger {
    constructor() {
        this._logStream = null;
        this._isInitialized = false;
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
    _formatMessage(level, ...args) {
        const now = new Date();
        const utc9Time = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const timestamp = utc9Time.toISOString().replace('Z', '+09:00');
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                }
                catch (_a) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        return `[${timestamp}] [${level}] ${message}\n`;
    }
    _write(level, ...args) {
        if (!this._isInitialized || !this._logStream) {
            return;
        }
        const formattedMessage = this._formatMessage(level, ...args);
        this._logStream.write(formattedMessage);
    }
    log(...args) {
        this._write('LOG', ...args);
    }
    info(...args) {
        this._write('INFO', ...args);
    }
    warn(...args) {
        this._write('WARN', ...args);
    }
    error(...args) {
        this._write('ERROR', ...args);
    }
    debug(...args) {
        this._write('DEBUG', ...args);
    }
    close() {
        if (this._logStream) {
            this._logStream.end();
            this._logStream = null;
        }
        this._isInitialized = false;
    }
    getLogFilePath() {
        return this._logFilePath;
    }
}
let globalLogger = null;
function initLogger() {
    if (!globalLogger) {
        globalLogger = new Logger();
    }
    return globalLogger;
}
function getLogger() {
    if (!globalLogger) {
        globalLogger = initLogger();
    }
    return globalLogger;
}
function closeLogger() {
    if (globalLogger) {
        globalLogger.close();
        globalLogger = null;
    }
}
exports.default = {
    log: (...args) => getLogger().log(...args),
    info: (...args) => getLogger().info(...args),
    warn: (...args) => getLogger().warn(...args),
    error: (...args) => getLogger().error(...args),
    debug: (...args) => getLogger().debug(...args),
    getLogFilePath: () => getLogger().getLogFilePath(),
    close: () => closeLogger()
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZGSCxnQ0FLQztBQUVELDhCQUtDO0FBRUQsa0NBS0M7QUE5R0QsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFNLE1BQU07SUFLUjtRQUhRLGVBQVUsR0FBMEIsSUFBSSxDQUFDO1FBQ3pDLG1CQUFjLEdBQUcsS0FBSyxDQUFDO1FBRzNCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVqRCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQzFCLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFFM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMs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Q0FBQyxTQUFTLEVBQUUsQ0FBQyxjQUFjLEVBQUU7SUFDbEQsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRTtDQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHbG9iYWwgbG9nZ2VyIHV0aWxpdHkgZm9yIGNvY29zLW1jcC1zZXJ2ZXJcbiAqIExvZ3MgdG8gZmlsZSBpbiBsb2dzLyBkaXJlY3RvcnlcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jbGFzcyBMb2dnZXIge1xuICAgIHByaXZhdGUgX2xvZ0ZpbGVQYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfbG9nU3RyZWFtOiBmcy5Xcml0ZVN0cmVhbSB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX2lzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBjb25zdCBleHRlbnNpb25QYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJy4uJyk7XG4gICAgICAgIGNvbnN0IGxvZ3NEaXIgPSBwYXRoLmpvaW4oZXh0ZW5zaW9uUGF0aCwgJ2xvZ3MnKTtcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nc0RpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhsb2dzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xvZ0ZpbGVQYXRoID0gcGF0aC5qb2luKGxvZ3NEaXIsICdtY3Atc2VydmVyLmxvZycpO1xuICAgICAgICB0aGlzLl9sb2dTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0aGlzLl9sb2dGaWxlUGF0aCwgeyBmbGFnczogJ2EnIH0pO1xuICAgICAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSAnXFxuJyArICc9Jy5yZXBlYXQoODApICsgJ1xcbic7XG4gICAgICAgIHRoaXMuX2xvZ1N0cmVhbS53cml0ZShzZXBhcmF0b3IpO1xuXG4gICAgICAgIHRoaXMuaW5mbygnPT09IExvZ2dlciBpbml0aWFsaXplZCA9PT0nKTtcbiAgICAgICAgdGhpcy5pbmZvKGBTZXNzaW9uIHN0YXJ0ZWQgYXQ6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfWApO1xuICAgICAgICB0aGlzLmluZm8oYExvZyBmaWxlOiAke3RoaXMuX2xvZ0ZpbGVQYXRofWApO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Zvcm1hdE1lc3NhZ2UobGV2ZWw6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCB1dGM5VGltZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgKyAoOSAqIDYwICogNjAgKiAxMDAwKSk7XG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IHV0YzlUaW1lLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgnWicsICcrMDk6MDAnKTtcblxuICAgICAgICBjb25zdCBtZXNzYWdlID0gYXJncy5tYXAoYXJnID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcsIG51bGwsIDIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKGFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhhcmcpO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG5cbiAgICAgICAgcmV0dXJuIGBbJHt0aW1lc3RhbXB9XSBbJHtsZXZlbH1dICR7bWVzc2FnZX1cXG5gO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3dyaXRlKGxldmVsOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5faXNJbml0aWFsaXplZCB8fCAhdGhpcy5fbG9nU3RyZWFtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JtYXR0ZWRNZXNzYWdlID0gdGhpcy5fZm9ybWF0TWVzc2FnZShsZXZlbCwgLi4uYXJncyk7XG4gICAgICAgIHRoaXMuX2xvZ1N0cmVhbS53cml0ZShmb3JtYXR0ZWRNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9nKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3dyaXRlKCdMT0cnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5mbyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLl93cml0ZSgnSU5GTycsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyB3YXJuKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3dyaXRlKCdXQVJOJywgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgcHVibGljIGVycm9yKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3dyaXRlKCdFUlJPUicsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLl93cml0ZSgnREVCVUcnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9sb2dTdHJlYW0pIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ1N0cmVhbS5lbmQoKTtcbiAgICAgICAgICAgIHRoaXMuX2xvZ1N0cmVhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRMb2dGaWxlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9nRmlsZVBhdGg7XG4gICAgfVxufVxuXG5sZXQgZ2xvYmFsTG9nZ2VyOiBMb2dnZXIgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMb2dnZXIoKTogTG9nZ2VyIHtcbiAgICBpZiAoIWdsb2JhbExvZ2dlcikge1xuICAgICAgICBnbG9iYWxMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4gICAgfVxuICAgIHJldHVybiBnbG9iYWxMb2dnZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2dnZXIoKTogTG9nZ2VyIHtcbiAgICBpZiAoIWdsb2JhbExvZ2dlcikge1xuICAgICAgICBnbG9iYWxMb2dnZXIgPSBpbml0TG9nZ2VyKCk7XG4gICAgfVxuICAgIHJldHVybiBnbG9iYWxMb2dnZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZUxvZ2dlcigpOiB2b2lkIHtcbiAgICBpZiAoZ2xvYmFsTG9nZ2VyKSB7XG4gICAgICAgIGdsb2JhbExvZ2dlci5jbG9zZSgpO1xuICAgICAgICBnbG9iYWxMb2dnZXIgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGxvZzogKC4uLmFyZ3M6IGFueVtdKSA9PiBnZXRMb2dnZXIoKS5sb2coLi4uYXJncyksXG4gICAgaW5mbzogKC4uLmFyZ3M6IGFueVtdKSA9PiBnZXRMb2dnZXIoKS5pbmZvKC4uLmFyZ3MpLFxuICAgIHdhcm46ICguLi5hcmdzOiBhbnlbXSkgPT4gZ2V0TG9nZ2VyKCkud2FybiguLi5hcmdzKSxcbiAgICBlcnJvcjogKC4uLmFyZ3M6IGFueVtdKSA9PiBnZXRMb2dnZXIoKS5lcnJvciguLi5hcmdzKSxcbiAgICBkZWJ1ZzogKC4uLmFyZ3M6IGFueVtdKSA9PiBnZXRMb2dnZXIoKS5kZWJ1ZyguLi5hcmdzKSxcbiAgICBnZXRMb2dGaWxlUGF0aDogKCkgPT4gZ2V0TG9nZ2VyKCkuZ2V0TG9nRmlsZVBhdGgoKSxcbiAgICBjbG9zZTogKCkgPT4gY2xvc2VMb2dnZXIoKVxufTtcbiJdfQ==