// Android 8.1.0 (Oreo / Chrome 60-70) Essential Runtime Polyfills & Error Interceptor

// 1. Global Error & Warning Logger for Tablet Diagnostics
export interface AppLogEntry {
  id: string;
  timestamp: string;
  type: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
}

const MAX_LOGS = 50;
const appLogs: AppLogEntry[] = [];
const logListeners: Array<(logs: AppLogEntry[]) => void> = [];

export function getAppLogs(): AppLogEntry[] {
  return [...appLogs];
}

export function clearAppLogs(): void {
  appLogs.length = 0;
  notifyLogListeners();
}

export function subscribeToLogs(listener: (logs: AppLogEntry[]) => void): () => void {
  logListeners.push(listener);
  listener(getAppLogs());
  return () => {
    const idx = logListeners.indexOf(listener);
    if (idx !== -1) logListeners.splice(idx, 1);
  };
}

function notifyLogListeners() {
  const current = getAppLogs();
  logListeners.forEach((fn) => {
    try {
      fn(current);
    } catch {
      // ignore
    }
  });
}

function addLog(type: 'error' | 'warn' | 'info', message: string, stack?: string) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const entry: AppLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timeStr,
    type,
    message: String(message),
    stack,
  };
  appLogs.unshift(entry);
  if (appLogs.length > MAX_LOGS) {
    appLogs.pop();
  }
  notifyLogListeners();
}

// Intercept window errors & rejections
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    addLog('error', event.message || 'Bilinmeyen JavaScript Hatası', event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || (typeof reason === 'string' ? reason : 'Promise Rejection');
    addLog('error', `Unhandled Promise: ${msg}`, reason?.stack);
  });

  // Intercept console.error
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    // Filter out harmless HMR or websocket warnings
    if (!msg.includes('vite') && !msg.includes('websocket')) {
      addLog('error', msg);
    }
  };

  // Intercept console.warn
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (!msg.includes('vite') && !msg.includes('websocket')) {
      addLog('warn', msg);
    }
  };
}

// 2. GlobalThis Polyfill
if (typeof (window as any).globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// 3. structuredClone Polyfill (Android 8.1 WebView lacks structuredClone)
if (typeof (window as any).structuredClone === 'undefined') {
  (window as any).structuredClone = function <T>(obj: T): T {
    if (obj === undefined) return undefined as any;
    return JSON.parse(JSON.stringify(obj));
  };
}

// 4. Array.prototype.at Polyfill
if (!(Array.prototype as any).at) {
  (Array.prototype as any).at = function (this: any[], n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// 5. Array.prototype.flat & flatMap
if (!(Array.prototype as any).flat) {
  (Array.prototype as any).flat = function (this: any[], depth = 1) {
    return depth > 0
      ? this.reduce(
          (acc: any, val: any) =>
            acc.concat(Array.isArray(val) ? (val as any).flat(depth - 1) : val),
          []
        )
      : this.slice();
  };
}

if (!(Array.prototype as any).flatMap) {
  (Array.prototype as any).flatMap = function (this: any[], callback: any, thisArg: any) {
    return (this.map(callback, thisArg) as any).flat();
  };
}

// 6. Object.fromEntries Polyfill
if (!Object.fromEntries) {
  (Object as any).fromEntries = function (entries: any) {
    const obj: Record<string, any> = {};
    for (const pair of entries) {
      if (Object(pair) !== pair) {
        throw new TypeError('iterable for fromEntries should yield objects');
      }
      const [k, v] = pair;
      obj[k] = v;
    }
    return obj;
  };
}

// 7. Object.hasOwn Polyfill
if (!(Object as any).hasOwn) {
  (Object as any).hasOwn = function (obj: any, prop: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// 8. String.prototype.replaceAll Polyfill
if (!(String.prototype as any).replaceAll) {
  (String.prototype as any).replaceAll = function (this: string, str: any, newStr: any) {
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }
    return this.replace(
      new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      newStr
    );
  };
}

// 9. Promise.allSettled Polyfill
if (!Promise.allSettled) {
  (Promise as any).allSettled = function (promises: any[]) {
    return Promise.all(
      promises.map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (reason) => ({ status: 'rejected' as const, reason })
        )
      )
    );
  };
}

// 10. queueMicrotask Polyfill
if (typeof window !== 'undefined' && typeof window.queueMicrotask !== 'function') {
  window.queueMicrotask = function (fn: () => void) {
    Promise.resolve()
      .then(fn)
      .catch((e) =>
        setTimeout(() => {
          throw e;
        }, 0)
      );
  };
}

export {};
