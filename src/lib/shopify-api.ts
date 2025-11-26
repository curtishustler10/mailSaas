/**
 * Shopify API helper functions for making authenticated requests
 */

export interface ShopifyApiOptions {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

/**
 * Make an authenticated request to the Shopify Admin API
 */
export async function shopifyRequest<T = any>(
  options: ShopifyApiOptions,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const { shop, accessToken, apiVersion = '2024-01' } = options;

  const url = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get shop information
 */
export async function getShopInfo(options: ShopifyApiOptions) {
  const data = await shopifyRequest(options, 'shop.json');
  return data.shop;
}

/**
 * Get products with optional filters
 */
export async function getProducts(
  options: ShopifyApiOptions,
  params?: {
    limit?: number;
    page_info?: string;
    status?: 'active' | 'archived' | 'draft';
  }
) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.page_info) queryParams.append('page_info', params.page_info);
  if (params?.status) queryParams.append('status', params.status);

  const endpoint = `products.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const data = await shopifyRequest(options, endpoint);
  return data.products;
}

/**
 * Get a single product by ID
 */
export async function getProduct(options: ShopifyApiOptions, productId: string | number) {
  const data = await shopifyRequest(options, `products/${productId}.json`);
  return data.product;
}

/**
 * Create a new product
 */
export async function createProduct(options: ShopifyApiOptions, product: any) {
  const data = await shopifyRequest(options, 'products.json', 'POST', { product });
  return data.product;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  options: ShopifyApiOptions,
  productId: string | number,
  product: any
) {
  const data = await shopifyRequest(options, `products/${productId}.json`, 'PUT', { product });
  return data.product;
}

/**
 * Delete a product
 */
export async function deleteProduct(options: ShopifyApiOptions, productId: string | number) {
  await shopifyRequest(options, `products/${productId}.json`, 'DELETE');
}
