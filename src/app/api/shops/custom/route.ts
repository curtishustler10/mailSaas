import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidShopDomain } from '@/lib/shopify';

/**
 * Add a custom Shopify app with direct access token
 * POST /api/shops/custom
 * Body: { shopDomain: string, accessToken: string }
 */
export async function POST(request: NextRequest) {
  // Get authenticated user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { shopDomain, accessToken } = body;

    // Validate required fields
    if (!shopDomain || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: shopDomain and accessToken' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!isValidShopDomain(shopDomain)) {
      return NextResponse.json(
        { error: 'Invalid shop domain. Must be in format: yourstore.myshopify.com' },
        { status: 400 }
      );
    }

    // Validate access token format (should start with shpat_ for admin tokens)
    if (!accessToken.startsWith('shpat_') && !accessToken.startsWith('shpca_')) {
      return NextResponse.json(
        { error: 'Invalid access token format. Should start with shpat_ or shpca_' },
        { status: 400 }
      );
    }

    // Verify the token works by making a test API call to Shopify
    const shopifyResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid access token or shop domain. Could not connect to Shopify.' },
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or update the shop
    const shop = await prisma.shop.upsert({
      where: { shopifyDomain: shopDomain },
      update: {
        shopifyToken: accessToken,
        userId: user.id,
      },
      create: {
        shopifyDomain: shopDomain,
        shopifyToken: accessToken,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        shopifyDomain: shop.shopifyDomain,
        createdAt: shop.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding custom shop:', error);
    return NextResponse.json(
      { error: 'Failed to add shop' },
      { status: 500 }
    );
  }
}
