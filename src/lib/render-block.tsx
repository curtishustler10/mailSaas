import { Block, Shop, BlockType } from '@prisma/client';
import { getProductInventory } from './shopify';

export type BlockWithShop = Block & {
  shop: Shop;
};

export type RenderContext = {
  block: BlockWithShop;
  now: Date;
  query: Record<string, string | string[] | undefined>;
};

export async function BlockImage(props: RenderContext): Promise<JSX.Element> {
  const { block, now, query } = props;

  switch (block.type) {
    case BlockType.COUNTDOWN:
      return <CountdownBlock block={block} now={now} query={query} />;
    case BlockType.HERO:
      return <HeroBlock block={block} now={now} query={query} />;
    case BlockType.STOCK:
      return await StockBlock({ block, now, query });
    case BlockType.RECOMMENDATION:
      return <RecommendationBlock block={block} now={now} query={query} />;
    default:
      return <DefaultBlock block={block} />;
  }
}

function CountdownBlock({ block, now }: { block: BlockWithShop; now: Date; query: any }) {
  const config = block.configJson as any;
  const title = config.title || 'Limited Time Offer';
  const endAt = config.endAt ? new Date(config.endAt) : null;

  let timeLeftText = 'Ended';
  let endText = '';
  if (endAt && endAt > now) {
    const diff = endAt.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      timeLeftText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      timeLeftText = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      timeLeftText = `${minutes}m ${seconds}s`;
    } else {
      timeLeftText = `${seconds}s`;
    }
    endText = `Ends ${endAt.toLocaleDateString()} at ${endAt.toLocaleTimeString()}`;
  }

  const backgroundColor = config.backgroundColor || '#FF6B6B';
  const textColor = config.textColor || '#FFFFFF';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor,
        color: textColor,
        padding: '40px',
      }}
    >
      <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', display: 'flex' }}>
        {title}
      </div>
      <div style={{ fontSize: '72px', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex' }}>
        {timeLeftText}
      </div>
      {endText && (
        <div style={{ fontSize: '24px', marginTop: '20px', opacity: 0.9, display: 'flex' }}>
          {endText}
        </div>
      )}
    </div>
  );
}

function HeroBlock({ block }: { block: BlockWithShop; now: Date; query: any }) {
  const config = block.configJson as any;
  const title = config.title || 'Welcome';
  const subtitle = config.subtitle || '';
  const backgroundColor = config.backgroundColor || '#4A90E2';
  const textColor = config.textColor || '#FFFFFF';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor,
        color: textColor,
        padding: '60px',
      }}
    >
      <div
        style={{
          fontSize: '64px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          display: 'flex',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '32px',
            textAlign: 'center',
            opacity: 0.9,
            display: 'flex',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

async function StockBlock({ block }: { block: BlockWithShop; now: Date; query: any }) {
  const config = block.configJson as any;
  const lowStockThreshold = config.lowStockThreshold || 5;
  const backgroundColor = config.backgroundColor || '#F5F5F5';
  const textColor = config.textColor || '#333333';

  // Fetch real inventory from Shopify if productId is provided
  let stockCount = 0;
  let productName = config.productName || 'Product';

  if (config.productId) {
    try {
      stockCount = await getProductInventory(
        block.shop.shopifyDomain,
        block.shop.shopifyToken,
        config.productId
      );
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Fall back to manual count if API fails
      stockCount = config.stockCount || 0;
    }
  } else {
    // Use manual stock count if no productId
    stockCount = config.stockCount || 0;
  }

  // Determine which copy to display
  const copy = config.copy || {
    inStock: 'In stock – ships today',
    lowStock: 'Only a few left!',
    outOfStock: 'Sold out',
  };

  let displayCopy = copy.inStock;
  let statusColor = '#4CAF50';

  if (stockCount === 0) {
    displayCopy = copy.outOfStock;
    statusColor = '#FF6B6B';
  } else if (stockCount <= lowStockThreshold) {
    displayCopy = copy.lowStock;
    statusColor = '#FFA500';
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor,
        color: textColor,
        padding: '40px',
      }}
    >
      <div style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '30px', display: 'flex' }}>
        {productName}
      </div>
      <div
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: statusColor,
          marginBottom: '20px',
          display: 'flex',
        }}
      >
        {stockCount}
      </div>
      <div style={{ fontSize: '32px', fontWeight: '600', color: statusColor, display: 'flex' }}>
        {displayCopy}
      </div>
    </div>
  );
}

function RecommendationBlock({ block }: { block: BlockWithShop; now: Date; query: any }) {
  const config = block.configJson as any;
  const title = config.title || 'Recommended for You';
  const products = config.products || [];
  const backgroundColor = config.backgroundColor || '#FFFFFF';
  const textColor = config.textColor || '#333333';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor,
        color: textColor,
        padding: '40px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center',
          display: 'flex',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {products.slice(0, 3).map((product: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: '#F5F5F5',
              borderRadius: '10px',
              width: '250px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '10px',
                textAlign: 'center',
                display: 'flex',
              }}
            >
              {product.name || `Product ${index + 1}`}
            </div>
            {product.price && (
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#4CAF50',
                  display: 'flex',
                }}
              >
                ${product.price}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultBlock({ block }: { block: BlockWithShop }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        color: '#333333',
        padding: '40px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'flex',
        }}
      >
        {block.name}
      </div>
      <div
        style={{
          fontSize: '32px',
          opacity: 0.7,
          display: 'flex',
        }}
      >
        Type: {block.type}
      </div>
    </div>
  );
}
