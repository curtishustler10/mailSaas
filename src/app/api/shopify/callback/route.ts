import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { exchangeCodeForToken, isValidShopDomain } from '@/lib/shopify';

/**
 * Handle Shopify OAuth callback
 * GET /api/shopify/callback?code=...&shop=...&state=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');

  // Validate required parameters
  if (!code || !shop) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Validate shop domain
  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 400 }
    );
  }

  // Get authenticated user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.redirect(
      new URL('/api/auth/signin', request.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(code, shop);

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
    await prisma.shop.upsert({
      where: { shopifyDomain: shop },
      update: {
        shopifyToken: accessToken,
        userId: user.id,
      },
      create: {
        shopifyDomain: shop,
        shopifyToken: accessToken,
        userId: user.id,
      },
    });

    // Redirect to shops page with success message
    return NextResponse.redirect(
      new URL('/shops?success=true', request.url)
    );
  } catch (error) {
    console.error('Error in Shopify OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/shops?error=oauth_failed', request.url)
    );
  }
}
