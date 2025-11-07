export type Customer = {
  customerID: number;
  email: string;
  name: string;
  phone: string;
  shippingAddress: string;
  totalOrders: number;
};

export type Card = {
  cardID: number;
  setName: string;
  cardNumber: string;
  name: string;
  variant: 'Standard' | 'ReverseHolo' | 'FullArt' | 'AltArt' | 'Promo';
  year: number | null;
};

export type Listing = {
  listingID: number;
  cardID: number;
  price: number;
  type: 'raw' | 'graded';
  cardCondition: 'M' | 'NM' | 'LP' | 'MP' | 'HP' | 'D' | null;
  quantityAvailable: number;
  status: 'active' | 'sold_out' | 'hidden';
};

export type GradingCompany = {
  companyID: number;
  name: string;
  gradeScale: '10' | '100';
  url: string;
};

export type GradeSlab = {
  slabID: number;        // equals listingID for graded listings
  companyID: number;
  grade: number;         // decimal(3,1)
};

export type Order = {
  orderID: number;
  customerID: number;
  orderDate: string;     // ISO-ish string
  status: 'pending' | 'paid' | 'shipped' | 'canceled' | 'refunded';
  subtotal: number;
  tax: number;
  total: number;
};

export type OrderItem = {
  orderID: number;
  listingID: number;
  quantity: number;
  unitPrice: number;
};

