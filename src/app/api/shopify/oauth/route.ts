import { NextRequest, NextResponse } from 'next/server';
import { getShopifyAuthUrl, isValidShopDomain } from '@/lib/shopify';

/**
 * Initiate Shopify OAuth flow
 * GET /api/shopify/oauth?shop=mystore.myshopify.com
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  // Validate shop domain format
  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop domain. Must be in format: yourstore.myshopify.com' },
      { status: 400 }
    );
  }

  try {
    // Generate Shopify OAuth URL
    const authUrl = getShopifyAuthUrl(shop);

    // Redirect to Shopify authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Shopify OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
