import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }


export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be greater than 0");
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * toUrl
 * Converts a relative API path to an absolute URL.
 *  - Leaves existing absolute http/https URLs untouched.
 *  - On the client, prefixes window.location.origin for relative paths.
 *  - On the server, falls back to NEXT_PUBLIC_BASE_URL or localhost.
 */
export function toUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  const host = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${host}${path}`;
}

// --- Structured logging (placeholder utility) ---

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown> | undefined;

function writeLog(level: LogLevel, message: string, meta?: LogMeta) {
  const entry = { ts: new Date().toISOString(), level, message, ...(meta ?? {}) } as const;
  (console[level] ?? console.log)(JSON.stringify(entry));
}

export const log = Object.assign(
  (level: LogLevel, message: string, meta?: LogMeta) => writeLog(level, message, meta),
  {
    debug: (message: string, meta?: LogMeta) => writeLog('debug', message, meta),
    info: (message: string, meta?: LogMeta) => writeLog('info', message, meta),
    warn: (message: string, meta?: LogMeta) => writeLog('warn', message, meta),
    error: (message: string, meta?: LogMeta) => writeLog('error', message, meta),
    with: (base: Record<string, unknown>) =>
      ({
        debug: (message: string, meta?: LogMeta) => writeLog('debug', message, { ...base, ...(meta ?? {}) }),
        info: (message: string, meta?: LogMeta) => writeLog('info', message, { ...base, ...(meta ?? {}) }),
        warn: (message: string, meta?: LogMeta) => writeLog('warn', message, { ...base, ...(meta ?? {}) }),
        error: (message: string, meta?: LogMeta) => writeLog('error', message, { ...base, ...(meta ?? {}) }),
      }),
  }
);

// --- Agent run trace helper ---

export type AgentRunTrace = {
  runId: string;
  agent: string;
  promptVersion: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string; // ISO
  completedAt?: string; // ISO
  durationMs?: number;
};

function genRunId() {
  try {
    type CryptoLike = { randomUUID?: () => string };
    const g = globalThis as unknown as { crypto?: CryptoLike };
    const maybeCrypto = g.crypto;
    if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') return maybeCrypto.randomUUID();
  } catch { /* ignore */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function startAgentRun(args: { agent: string; promptVersion: string; input: unknown; runId?: string; }): AgentRunTrace {
  const runId = args.runId ?? genRunId();
  const trace: AgentRunTrace = {
    runId,
    agent: args.agent,
    promptVersion: args.promptVersion,
    input: args.input,
    startedAt: new Date().toISOString(),
  };
  log.info('agent.run.start', { runId, agent: args.agent, promptVersion: args.promptVersion });
  return trace;
}

export function completeAgentRun(trace: AgentRunTrace, result: { output?: unknown; error?: unknown }) {
  const completedAt = new Date().toISOString();
  const durationMs = Date.parse(completedAt) - Date.parse(trace.startedAt);
  const final: AgentRunTrace = {
    ...trace,
    completedAt,
    durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
    output: result.output,
    error: result.error ? String(result.error) : undefined,
  };
  const level: LogLevel = result.error ? 'error' : 'info';
  log[level]('agent.run.end', {
    runId: final.runId,
    agent: final.agent,
    durationMs: final.durationMs,
    error: final.error,
  });
  return final;
}

export async function withAgentRun<T>(
  args: { agent: string; promptVersion: string; input: unknown; runId?: string },
  fn: () => Promise<T>
): Promise<{ trace: AgentRunTrace; result?: T; error?: unknown }> {
  const trace = startAgentRun(args);
  try {
    const result = await fn();
    return { trace: completeAgentRun(trace, { output: result }), result };
  } catch (error) {
    return { trace: completeAgentRun(trace, { error }), error };
  }
}