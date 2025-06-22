export interface Product {
  id: string;
  name: string;
  description: string;
  tokenId?: number;
  seller: string;
  auction?: Auction;
}

export interface Auction {
  id: string;
  product?: Product;
  productId: string;
  initialPrice: string;
  isListed: boolean;
  createdAt: string;
  updateAt: string;
  bids: Bid[];
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  value: string;
  auction?: Auction;
}

export interface CreateBidDto {
  auctionId: string;
  bidder: string;
  value: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  seller: string;
  tokenId?: number;
}

export interface CreateAuctionDto {
  productId: string;
  initialPrice: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}