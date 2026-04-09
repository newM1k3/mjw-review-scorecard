import type { ScorecardResult } from '../types';

export function encodeResultToHash(result: ScorecardResult): string {
  const jsonString = JSON.stringify(result);
  return btoa(jsonString);
}

export function decodeHashToResult(hash: string): ScorecardResult | null {
  try {
    const jsonString = atob(hash);
    const result = JSON.parse(jsonString);
    return result as ScorecardResult;
  } catch (error) {
    console.error('Failed to decode hash:', error);
    return null;
  }
}

export function setResultInUrl(result: ScorecardResult): string {
  const encoded = encodeResultToHash(result);
  window.location.hash = encoded;
  return window.location.href;
}

export function getResultFromUrl(): ScorecardResult | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return decodeHashToResult(hash);
}
