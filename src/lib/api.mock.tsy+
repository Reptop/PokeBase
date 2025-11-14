import type { Card, Customer, GradingCompany, GradeSlab, Listing, Order, OrderItem } from '../types';

let _id = 2000;
const nextId = () => ++_id;

const db = {
  customers: [
    { customerID: 1, email: 'benardo@example.com', name: 'Bernardo Mendes', phone: '541-555-0101', shippingAddress: '33 Pallet Town, Kanto', totalOrders: 2 },
    { customerID: 2, email: 'misty@example.com', name: 'Misty', phone: '541-555-0102', shippingAddress: '44 Cerulean Gym, Kanto', totalOrders: 1 },
    { customerID: 3, email: 'brock.s@example.com', name: 'Brock Harrison', phone: '541-555-0103', shippingAddress: '77 Pewter City, Kanto', totalOrders: 1 },
  ] as Customer[],
  cards: [
    { cardID: 1, setName: 'Base Set', cardNumber: '4/102', name: 'Charizard', variant: 'Standard', year: 1999 },
    { cardID: 2, setName: 'Neo Genesis', cardNumber: '60/64', name: 'Pikachu', variant: 'Standard', year: 1999 },
    { cardID: 3, setName: 'Evolving Skies', cardNumber: '215/203', name: 'Rayquaza VMAX', variant: 'FullArt', year: 2021 },
    { cardID: 4, setName: 'Promo', cardNumber: 'SWSH150', name: 'Umbreon', variant: 'Promo', year: 2022 },
  ] as Card[],
  listings: [
    { listingID: 1, cardID: 1, price: 149.99, type: 'raw', cardCondition: 'NM', quantityAvailable: 2, status: 'active' },
    { listingID: 2, cardID: 2, price: 12.50, type: 'raw', cardCondition: 'LP', quantityAvailable: 5, status: 'active' },
    { listingID: 3, cardID: 1, price: 289.00, type: 'graded', cardCondition: null, quantityAvailable: 1, status: 'active' },
    { listingID: 4, cardID: 3, price: 340.00, type: 'graded', cardCondition: null, quantityAvailable: 1, status: 'active' },
    { listingID: 5, cardID: 4, price: 24.99, type: 'raw', cardCondition: 'NM', quantityAvailable: 3, status: 'hidden' },
  ] as Listing[],
  gradingCompanies: [
    { companyID: 1, name: 'PSA', gradeScale: '10', url: 'https://www.psacard.com' },
    { companyID: 2, name: 'BGS', gradeScale: '10', url: 'https://www.beckett.com/grading' },
    { companyID: 3, name: 'CGC', gradeScale: '100', url: 'https://www.cgccards.com' },
  ] as GradingCompany[],
  gradeSlabs: [
    { slabID: 3, companyID: 1, grade: 9.0 },
    { slabID: 4, companyID: 2, grade: 9.5 },
  ] as GradeSlab[],
  orders: [
    { orderID: 1001, customerID: 1, orderDate: '2025-10-30 10:15:00', status: 'paid', subtotal: 438.99, tax: 0.00, total: 438.99 },
    { orderID: 1002, customerID: 2, orderDate: '2025-10-30 11:02:00', status: 'pending', subtotal: 12.50, tax: 0.00, total: 12.50 },
  ] as Order[],
  orderItems: [
    { orderID: 1001, listingID: 1, quantity: 1, unitPrice: 149.99 },
    { orderID: 1001, listingID: 3, quantity: 1, unitPrice: 289.00 },
    { orderID: 1002, listingID: 2, quantity: 1, unitPrice: 12.50 },
  ] as OrderItem[],
};

const sleep = (ms = 200) => new Promise(res => setTimeout(res, ms));

export const api = {
  // Customers
  async listCustomers(): Promise<Customer[]> { await sleep(); return [...db.customers]; },
  async createCustomer(payload: Omit<Customer, 'customerID'>): Promise<{ customerID: number }> {
    await sleep(); const customerID = nextId(); db.customers.push({ customerID, ...payload }); return { customerID };
  },
  async updateCustomer(customerID: number, patch: Partial<Customer>): Promise<void> {
    await sleep(); const i = db.customers.findIndex(c => c.customerID === customerID); if (i >= 0) db.customers[i] = { ...db.customers[i], ...patch };
  },
  async deleteCustomer(customerID: number): Promise<void> {
    await sleep(); db.customers = db.customers.filter(c => c.customerID !== customerID);
  },

  // Cards
  async listCards(): Promise<Card[]> { await sleep(); return [...db.cards]; },

  // Listings (+ joined card)
  async listListings(): Promise<(Listing & { card: Card | null })[]> {
    await sleep();
    return db.listings.map(l => ({ ...l, card: db.cards.find(c => c.cardID === l.cardID) ?? null }));
  },

  // Grading Companies
  async listGradingCompanies(): Promise<GradingCompany[]> { await sleep(); return [...db.gradingCompanies]; },

  // Grade slab by listing
  async getSlabForListing(listingID: number): Promise<(GradeSlab & { company: GradingCompany | null }) | null> {
    await sleep();
    const slab = db.gradeSlabs.find(g => g.slabID === listingID);
    if (!slab) return null;
    const company = db.gradingCompanies.find(gc => gc.companyID === slab.companyID) ?? null;
    return { ...slab, company };
  },

  // Orders (+ joined customer)
  async listOrders(): Promise<(Order & { customer: Customer | null })[]> {
    await sleep();
    return db.orders.map(o => ({ ...o, customer: db.customers.find(c => c.customerID === o.customerID) ?? null }));
  },

  // Order items (+ joined listing)
  async listOrderItems(orderID: number): Promise<(OrderItem & { listing: Listing | null })[]> {
    await sleep();
    return db.orderItems
      .filter(oi => oi.orderID === orderID)
      .map(oi => ({ ...oi, listing: db.listings.find(l => l.listingID === oi.listingID) ?? null }));
  },
};
