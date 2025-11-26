import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { BlockImage } from '@/lib/render-block';
import { generateCacheKey, getCachedRender, setCachedRender } from '@/lib/cache';

// Use Node.js runtime since Prisma doesn't work on Edge
export const runtime = 'nodejs';

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Render a block as a PNG image
 * GET /api/render/[blockId]?preview=1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  try {
    const { blockId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Convert searchParams to plain object for RenderContext
    const query: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      const existing = query[key];
      if (existing === undefined) {
        query[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        query[key] = [existing, value];
      }
    });

    // Load block with shop
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: { shop: true },
    });

    if (!block) {
      return new Response('Block not found', { status: 404 });
    }

    // Track render event (optional, skip in preview mode)
    const isPreview = searchParams.get('preview') === '1';

    // Generate stable cache key based on blockId, updatedAt, and query params
    const cacheKey = generateCacheKey(blockId, block.updatedAt, query);
    console.log(`[Render] Generated cache key: ${cacheKey}`);

    // Check cache (skip in preview mode)
    if (!isPreview) {
      const cachedImage = await getCachedRender(blockId, cacheKey);
      if (cachedImage) {
        console.log(`[Render] Returning cached image for block ${blockId}`);

        // Track render event for cached images
        const userAgent = request.headers.get('user-agent') || undefined;
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');

        prisma.renderEvent
          .create({
            data: {
              blockId: block.id,
              userAgent,
              ipHash: ip ? hashIP(ip) : undefined,
            },
          })
          .catch((err) => console.error('Failed to log render event:', err));

        // Return cached image with proper headers
        return new Response(cachedImage, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
            'Pragma': 'public',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        });
      }
    }

    // Cache miss or preview mode - generate image
    console.log(`[Render] Cache miss for block ${blockId}, generating image...`);

    if (!isPreview) {
      // Get client info for analytics
      const userAgent = request.headers.get('user-agent') || undefined;
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');

      // Create render event asynchronously (don't wait)
      prisma.renderEvent
        .create({
          data: {
            blockId: block.id,
            userAgent,
            ipHash: ip ? hashIP(ip) : undefined,
          },
        })
        .catch((err) => console.error('Failed to log render event:', err));
    }

    // Render the block image
    const now = new Date();
    const element = await BlockImage({
      block,
      now,
      query,
    });

    const imageResponse = new ImageResponse(element, {
      width: 1200,
      height: 630,
    });

    // Convert ImageResponse to Buffer for caching
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Cache the generated image (skip in preview mode)
    if (!isPreview) {
      await setCachedRender(blockId, cacheKey, imageBuffer, 3600); // 1 hour TTL
    }

    // Return the generated image
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': isPreview
          ? 'no-cache, no-store, must-revalidate, max-age=0'
          : 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        'Pragma': isPreview ? 'no-cache' : 'public',
        'Expires': isPreview ? '0' : undefined,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('Error rendering block:', error);
    return new Response(`Error rendering block: ${error.message}`, {
      status: 500,
    });
  }
}

/**
 * Simple IP hashing for privacy
 */
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
