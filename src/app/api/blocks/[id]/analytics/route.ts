import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Get analytics data for a block
 * GET /api/blocks/[id]/analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verify user owns this block
    const block = await prisma.block.findUnique({
      where: { id },
      include: {
        shop: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    if (block.shop.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total renders
    const totalRenders = await prisma.renderEvent.count({
      where: { blockId: id },
    });

    // Get renders in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const last24HoursRenders = await prisma.renderEvent.count({
      where: {
        blockId: id,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Get renders grouped by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rendersByDate = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::bigint as count
      FROM "RenderEvent"
      WHERE "blockId" = ${id}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    // Convert BigInt to number for JSON serialization
    const rendersByDateFormatted = rendersByDate.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));

    return NextResponse.json({
      totalRenders,
      last24HoursRenders,
      rendersByDate: rendersByDateFormatted,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
