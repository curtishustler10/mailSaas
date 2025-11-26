import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Query all blocks
    const blocks = await prisma.block.findMany({
      include: {
        shop: true,
        renderEvents: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: blocks.length,
      blocks,
    });
  } catch (error) {
    console.error('Error querying blocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
