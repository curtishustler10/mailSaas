/**
 * Shopify OAuth helper functions
 */

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_products';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';

/**
 * Generate Shopify OAuth authorization URL
 * @param shopDomain - The shop's myshopify.com domain (e.g., "mystore.myshopify.com")
 * @returns Authorization URL to redirect the user to
 */
export function getShopifyAuthUrl(shopDomain: string, grant_options?: string[]): string {
  const redirectUri = `${APP_URL}/api/shopify/callback`;
  const nonce = generateNonce();

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce,
  });

  // Add grant_options for online/offline access
  if (grant_options && grant_options.length > 0) {
    params.append('grant_options[]', grant_options.join(','));
  }

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param code - Authorization code from Shopify callback
 * @param shop - Shop domain
 * @returns Access token
 */
export async function exchangeCodeForToken(
  code: string,
  shop: string
): Promise<string> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Validate Shopify shop domain format
 * @param shop - Shop domain to validate
 * @returns True if valid
 */
export function isValidShopDomain(shop: string): boolean {
  const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopDomainRegex.test(shop);
}

/**
 * Get product inventory from Shopify
 * @param shopDomain - Shop domain
 * @param accessToken - Shop access token
 * @param productId - Shopify product GID (e.g., "gid://shopify/Product/123456789")
 * @returns Total inventory quantity across all variants
 */
export async function getProductInventory(
  shopDomain: string,
  accessToken: string,
  productId: string
): Promise<number> {
  // Extract numeric ID from GID
  const numericId = productId.includes('/')
    ? productId.split('/').pop()
    : productId;

  try {
    // Fetch product with variants
    console.log(`[getProductInventory] Fetching inventory for product ${productId} from ${shopDomain}`);
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products/${numericId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}: ${response.status}`);
      return 0;
    }

    const data = await response.json();
    const product = data.product;

    // Sum inventory across all variants
    let totalInventory = 0;
    if (product.variants && Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        // Use inventory_quantity if available
        if (typeof variant.inventory_quantity === 'number') {
          totalInventory += variant.inventory_quantity;
          console.log(`[getProductInventory] Variant ${variant.id}: ${variant.inventory_quantity} units`);
        }
      }
    }

    console.log(`[getProductInventory] Total inventory for ${productId}: ${totalInventory}`);
    return totalInventory;
  } catch (error) {
    console.error(`Error fetching inventory for ${productId}:`, error);
    return 0;
  }
}

/**
 * Generate a random nonce for OAuth state parameter
 * @returns Random nonce string
 */
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
