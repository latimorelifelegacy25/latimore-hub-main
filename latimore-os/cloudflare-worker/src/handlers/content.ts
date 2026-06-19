/**
 * Content Click Tracking Handler
 * POST /api/events/content-click
 */

import type { Env } from '../index';
import { createSupabaseClient } from '../lib/supabase';
import { jsonResponse, errorResponse } from '../lib/response';

interface ContentClickPayload {
  post_id?: string;
  platform?: string;
  click_type?: string; // 'cta', 'link', 'bio_link', 'story_swipe'
  utm_source?: string;
  utm_campaign?: string;
  contact_id?: string;
}

export async function handleContentClick(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  let payload: ContentClickPayload;
  try {
    payload = await request.json() as ContentClickPayload;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  if (!payload.post_id && !payload.platform) {
    return errorResponse(400, 'Missing post_id or platform');
  }

  const db = createSupabaseClient(env);

  // Update content post click count
  if (payload.post_id) {
    ctx.waitUntil(
      (async () => {
        const { data: post } = await db
          .from('content_posts')
          .select('id, clicks')
          .eq('id', payload.post_id)
          .single();

        if (post) {
          const p = post as { id: string; clicks: number };
          await db.from('content_posts')
            .update({ clicks: (p.clicks || 0) + 1 })
            .eq('id', p.id);
        }
      })()
    );
  }

  return jsonResponse({ success: true });
}