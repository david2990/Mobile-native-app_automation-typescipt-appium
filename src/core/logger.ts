type Level = 'info' | 'warn' | 'error' | 'debug';

const ENABLED_DEBUG = Boolean(process.env.DEBUG_FRAMEWORK);

function emit(level: Level, scope: string, message: string): void {
  if (level === 'debug' && !ENABLED_DEBUG) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} [${scope}] ${message}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(scope: string) {
  return {
    info: (message: string) => emit('info', scope, message),
    warn: (message: string) => emit('warn', scope, message),
    error: (message: string) => emit('error', scope, message),
    debug: (message: string) => emit('debug', scope, message),
  };
}
