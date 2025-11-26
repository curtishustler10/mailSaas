import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getShopInfo, getProducts } from '@/lib/shopify-api';

/**
 * Test Shopify API connection
 * GET /api/shopify/test?shopId=xxx
 */
export async function GET(request: NextRequest) {
  // Get authenticated user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return NextResponse.json({ error: 'Missing shopId parameter' }, { status: 400 });
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the shop
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        userId: user.id,
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Test the connection by fetching shop info
    const shopInfo = await getShopInfo({
      shop: shop.shopifyDomain,
      accessToken: shop.shopifyToken,
    });

    // Fetch a few products as a test
    const products = await getProducts(
      {
        shop: shop.shopifyDomain,
        accessToken: shop.shopifyToken,
      },
      { limit: 5 }
    );

    return NextResponse.json({
      success: true,
      shop: {
        id: shopInfo.id,
        name: shopInfo.name,
        email: shopInfo.email,
        domain: shopInfo.domain,
        myshopify_domain: shopInfo.myshopify_domain,
        plan_name: shopInfo.plan_name,
        currency: shopInfo.currency,
      },
      products: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        vendor: p.vendor,
      })),
    });
  } catch (error: any) {
    console.error('Error testing Shopify connection:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to Shopify',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
