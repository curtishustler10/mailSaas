import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/blocks - List all blocks for authenticated user's shops
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with their shops
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        shops: {
          include: {
            blocks: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Flatten blocks from all shops
    const blocks = user.shops.flatMap((shop) =>
      shop.blocks.map((block) => ({
        ...block,
        shopId: shop.id,
        shopDomain: shop.shopifyDomain,
      }))
    );

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocks - Create a new block
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, name, type, configJson } = body;

    if (!shopId || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, name, type' },
        { status: 400 }
      );
    }

    // Verify shop belongs to user
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create block
    const block = await prisma.block.create({
      data: {
        shopId,
        name,
        type,
        configJson: configJson || {},
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json(
      { error: 'Failed to create block' },
      { status: 500 }
    );
  }
}
