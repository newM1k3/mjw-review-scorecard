import PocketBase from 'pocketbase';
import type { ScorecardResult } from '../types';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://immersive-kit.pockethost.io');
pb.autoCancellation(false);

export interface ScorecardPayload {
  id: string;          // stable UUID generated at first save
  result: ScorecardResult;
  analyzedAt: string;  // ISO timestamp
}

export interface SavedScorecardMeta {
  id: string;          // PocketBase record ID
  externalId: string;
  overallRating: number;
  totalAnalyzed: number;
  savedAt: string;
  payload: ScorecardPayload;
}

export async function saveProject(payload: ScorecardPayload): Promise<string> {
  if (!pb.authStore.isValid) {
    throw new Error('Must be signed in to save scorecards');
  }

  const userId = pb.authStore.record?.id ?? '';

  try {
    const existing = await pb.collection('review_scorecard_projects').getFirstListItem(
      `external_id = "${payload.id}" && user_id = "${userId}"`,
      { requestKey: null }
    );
    await pb.collection('review_scorecard_projects').update(existing.id, { payload });
    return existing.id;
  } catch {
    const record = await pb.collection('review_scorecard_projects').create({
      external_id: payload.id,
      user_id: userId,
      payload,
      archived: false,
    });
    return record.id;
  }
}

export async function loadProjects(): Promise<SavedScorecardMeta[]> {
  if (!pb.authStore.isValid) return [];

  const userId = pb.authStore.record?.id ?? '';

  try {
    const records = await pb.collection('review_scorecard_projects').getList(1, 20, {
      filter: `user_id = "${userId}" && (archived = false || archived = null)`,
      sort: '-updated',
      requestKey: null,
    });

    return records.items.map((r) => {
      const p = r['payload'] as ScorecardPayload;
      return {
        id: r.id,
        externalId: r['external_id'] as string,
        overallRating: p?.result?.overallRating ?? 0,
        totalAnalyzed: p?.result?.totalAnalyzed ?? 0,
        savedAt: r['updated'] as string,
        payload: p,
      };
    });
  } catch {
    return [];
  }
}
