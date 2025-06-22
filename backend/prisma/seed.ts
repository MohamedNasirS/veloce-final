import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: 'product-1',
        name: 'Digital Art NFT #001',
        description: 'A beautiful digital artwork featuring abstract patterns and vibrant colors. This unique piece represents the fusion of technology and creativity.',
        seller: '0x742d35Cc6634C0532925a3b8D404fAbCe4649681',
        tokenId: 1001,
      },
    }),
    prisma.product.create({
      data: {
        id: 'product-2',
        name: 'Rare Gaming Collectible',
        description: 'Limited edition gaming item with special attributes. Perfect for collectors and gaming enthusiasts.',
        seller: '0x8ba1f109551bD432803012645Hac136c30C6213',
        tokenId: 1002,
      },
    }),
    prisma.product.create({
      data: {
        id: 'product-3',
        name: 'Virtual Real Estate Plot',
        description: 'Prime virtual land in the metaverse. Great location with high foot traffic and development potential.',
        seller: '0x1234567890123456789012345678901234567890',
        tokenId: 1003,
      },
    }),
  ]);

  console.log('✅ Created products:', products.length);

  // Create sample auctions
  const auctions = await Promise.all([
    prisma.auction.create({
      data: {
        id: 'auction-1',
        productId: 'product-1',
        initialPrice: '0.5',
        isListed: true,
      },
    }),
    prisma.auction.create({
      data: {
        id: 'auction-2',
        productId: 'product-2',
        initialPrice: '1.2',
        isListed: true,
      },
    }),
    prisma.auction.create({
      data: {
        id: 'auction-3',
        productId: 'product-3',
        initialPrice: '2.0',
        isListed: false, // This one is not active
      },
    }),
  ]);

  console.log('✅ Created auctions:', auctions.length);

  // Create sample bids
  const bids = await Promise.all([
    prisma.bid.create({
      data: {
        id: 'bid-1',
        auctionId: 'auction-1',
        bidder: '0x9876543210987654321098765432109876543210',
        value: '0.6',
      },
    }),
    prisma.bid.create({
      data: {
        id: 'bid-2',
        auctionId: 'auction-1',
        bidder: '0x1111222233334444555566667777888899990000',
        value: '0.75',
      },
    }),
    prisma.bid.create({
      data: {
        id: 'bid-3',
        auctionId: 'auction-2',
        bidder: '0x9876543210987654321098765432109876543210',
        value: '1.5',
      },
    }),
    prisma.bid.create({
      data: {
        id: 'bid-4',
        auctionId: 'auction-1',
        bidder: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333',
        value: '0.9',
      },
    }),
  ]);

  console.log('✅ Created bids:', bids.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });