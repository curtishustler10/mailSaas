import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BlockType } from '@prisma/client';
import { getProducts } from '@/lib/shopify-api';

/**
 * Create a test STOCK block with real Shopify product
 * POST /api/blocks/test-stock
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shops: true },
    });

    if (!user || user.shops.length === 0) {
      return NextResponse.json(
        { error: 'No shops found. Please connect a shop first.' },
        { status: 400 }
      );
    }

    const shop = user.shops[0];

    // Fetch first product from Shopify
    const products = await getProducts(
      {
        shop: shop.shopifyDomain,
        accessToken: shop.shopifyToken,
      },
      { limit: 1 }
    );

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products found in your Shopify store.' },
        { status: 400 }
      );
    }

    const product = products[0];
    const productId = `gid://shopify/Product/${product.id}`;

    // Create a STOCK block with real product
    const block = await prisma.block.create({
      data: {
        name: `Stock Block - ${product.title}`,
        type: BlockType.STOCK,
        shopId: shop.id,
        configJson: {
          productId,
          productName: product.title,
          lowStockThreshold: 5,
          copy: {
            inStock: 'In stock – ships today',
            lowStock: 'Only a few left!',
            outOfStock: 'Sold out',
          },
          backgroundColor: '#F5F5F5',
          textColor: '#333333',
        },
      },
    });

    return NextResponse.json({
      success: true,
      block: {
        id: block.id,
        name: block.name,
        type: block.type,
        configJson: block.configJson,
        product: {
          id: product.id,
          title: product.title,
          vendor: product.vendor,
        },
        renderUrl: `/api/render/${block.id}?preview=1`,
      },
    });
  } catch (error: any) {
    console.error('Error creating test stock block:', error);
    return NextResponse.json(
      { error: 'Failed to create test block', details: error.message },
      { status: 500 }
    );
  }
}
