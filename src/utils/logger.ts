import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getLogFile = (level: LogLevel): string => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `${level}-${date}.log`);
};

const formatLog = (entry: LogEntry): string => {
  return JSON.stringify({
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    context: entry.context,
  });
};

const writeLog = (level: LogLevel, message: string, context?: Record<string, any>) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  const logFile = getLogFile(level);
  const logLine = formatLog(entry) + '\n';

  // Write to file
  fs.appendFileSync(logFile, logLine);

  // Also console log in development
  if (process.env.NODE_ENV !== 'production') {
    const colorMap: Record<LogLevel, string> = {
      info: '\x1b[36m',    // cyan
      warn: '\x1b[33m',    // yellow
      error: '\x1b[31m',   // red
      debug: '\x1b[35m',   // magenta
    };
    const resetColor = '\x1b[0m';
    console.log(
      `${colorMap[level]}[${entry.timestamp}] ${level.toUpperCase()}: ${message}${resetColor}`,
      context ? context : ''
    );
  }
};

export const logger = {
  info: (message: string, context?: Record<string, any>) => writeLog('info', message, context),
  warn: (message: string, context?: Record<string, any>) => writeLog('warn', message, context),
  error: (message: string, context?: Record<string, any>) => writeLog('error', message, context),
  debug: (message: string, context?: Record<string, any>) => writeLog('debug', message, context),
};

export default logger;
