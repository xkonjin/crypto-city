/**
 * Type-Safe Utility Types
 * Issue #242: Eliminate 'any' Types and Improve Type Safety
 * 
 * Provides strict type utilities to replace 'any' usage
 */

/**
 * Make all properties required and non-nullable
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: DeepRequired<NonNullable<T[K]>>;
};

/**
 * Make all properties optional
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Extract keys of a specific type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type-safe event handler
 */
export type EventHandler<T = unknown> = (event: T) => void;

/**
 * Type-safe async function
 */
export type AsyncFunction<T = void, Args extends unknown[] = []> = (
  ...args: Args
) => Promise<T>;

/**
 * Type-safe callback
 */
export type Callback<T = void, Args extends unknown[] = []> = (...args: Args) => T;

/**
 * JSON-serializable types
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

/**
 * Type guard for checking if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for checking if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Type-safe Object.fromEntries
 */
export function typedFromEntries<K extends string | number | symbol, V>(
  entries: [K, V][]
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/**
 * Assert that a value is never (exhaustiveness checking)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Type-safe localStorage wrapper
 */
export const typedStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove(key: string): void {
    localStorage.removeItem(key);
  },
};

/**
 * Type-safe fetch wrapper
 */
export async function typedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Type-safe array filter to remove nullish values
 */
export function filterDefined<T>(
  array: (T | null | undefined)[]
): T[] {
  return array.filter(isDefined);
}
