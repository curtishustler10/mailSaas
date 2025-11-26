import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/blocks/[id] - Get a single block
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const block = await prisma.block.findFirst({
      where: {
        id: params.id,
        shop: {
          user: {
            email: session.user.email,
          },
        },
      },
      include: {
        shop: true,
      },
    });

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error fetching block:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blocks/[id] - Update a block
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, configJson } = body;

    // Verify block belongs to user
    const existingBlock = await prisma.block.findFirst({
      where: {
        id: params.id,
        shop: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Block not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update block
    const block = await prisma.block.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(configJson !== undefined && { configJson }),
      },
    });

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json(
      { error: 'Failed to update block' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blocks/[id] - Delete a block
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify block belongs to user
    const existingBlock = await prisma.block.findFirst({
      where: {
        id: params.id,
        shop: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Block not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete block
    await prisma.block.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json(
      { error: 'Failed to delete block' },
      { status: 500 }
    );
  }
}
