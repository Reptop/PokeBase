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

// This will be called after order item changes
function recomputeOrderTotals(orderID: number) {
  const order = db.orders.find(o => o.orderID === orderID);
  if (!order) return;

  const items = db.orderItems.filter(oi => oi.orderID === orderID);

  const subtotal = items.reduce(
    (sum, oi) => sum + oi.unitPrice * oi.quantity,
    0
  );

  // In your seed data tax is 0.00; you can keep that or apply a rate.
  const tax = 0; // or e.g. subtotal * 0.08

  // helper to round to 2 decimals
  const round2 = (n: number) => Math.round(n * 100) / 100;

  order.subtotal = round2(subtotal);
  order.tax = round2(tax);
  order.total = round2(order.subtotal + order.tax);
}

export const api = {
  // Customers
  async listCustomers(): Promise<Customer[]> {
    await sleep();
    return [...db.customers];
  },

  async createCustomer(payload: Omit<Customer, 'customerID'>): Promise<{ customerID: number }> {
    await sleep();
    const customerID = nextId();
    db.customers.push({ customerID, ...payload });
    return { customerID };
  }
  ,
  async updateCustomer(customerID: number, patch: Partial<Customer>): Promise<void> {
    await sleep();
    const i = db.customers.findIndex(c => c.customerID === customerID);
    if (i >= 0) db.customers[i] = { ...db.customers[i], ...patch };
  },

  async deleteCustomer(customerID: number): Promise<void> {
    await sleep();
    db.customers = db.customers.filter(c => c.customerID !== customerID);
  },

  // Listings (+ joined card)
  async listListings(): Promise<(Listing & { card: Card | null })[]> {
    await sleep();
    return db.listings.map(l => ({
      ...l,
      card: db.cards.find(c => c.cardID === l.cardID) ?? null,
    }));
  },

  async createListing(payload: Omit<Listing, 'listingID'>): Promise<{ listingID: number }> {
    await sleep();
    const listingID = nextId();
    db.listings.push({ listingID, ...payload });
    return { listingID };
  },

  async updateListing(listingID: number, patch: Partial<Listing>): Promise<void> {
    await sleep();
    const i = db.listings.findIndex(l => l.listingID === listingID);
    if (i >= 0) {
      db.listings[i] = { ...db.listings[i], ...patch };
    }
  },

  async deleteListing(listingID: number): Promise<void> {
    await sleep();

    // Remove the listing itself
    db.listings = db.listings.filter(l => l.listingID !== listingID);

    // Remove grade slab tied to this listing (slabID = listingID)
    db.gradeSlabs = db.gradeSlabs.filter(gs => gs.slabID !== listingID);

    // Remove orderItems rows that reference this listing (M:N join cleanup)
    db.orderItems = db.orderItems.filter(oi => oi.listingID !== listingID);
  },

  // Cards
  async listCards(): Promise<Card[]> {
    await sleep();
    return [...db.cards];
  },
  async createCard(payload: Omit<Card, 'cardID'>): Promise<{ cardID: number }> {
    await sleep();
    const cardID = nextId();
    db.cards.push({ cardID, ...payload });
    return { cardID };
  },
  async updateCard(cardID: number, patch: Partial<Card>): Promise<void> {
    await sleep();
    const i = db.cards.findIndex(c => c.cardID === cardID);
    if (i >= 0) {
      db.cards[i] = { ...db.cards[i], ...patch };
    }
  },
  async deleteCard(cardID: number): Promise<void> {
    await sleep();

    // Remove the card itself
    db.cards = db.cards.filter(c => c.cardID !== cardID);

    // Optional: mimic ON DELETE CASCADE for related data

    // 1) Find listings for this card
    const removedListingIDs = db.listings
      .filter(l => l.cardID === cardID)
      .map(l => l.listingID);

    // 2) Remove those listings
    db.listings = db.listings.filter(l => l.cardID !== cardID);

    // 3) Remove grade slabs tied to those listings (slabID = listingID)
    db.gradeSlabs = db.gradeSlabs.filter(gs => !removedListingIDs.includes(gs.slabID));

    // 4) Remove orderItems for those listings
    db.orderItems = db.orderItems.filter(oi => !removedListingIDs.includes(oi.listingID));
  },

  // Grading Companies
  async listGradingCompanies(): Promise<GradingCompany[]> {
    await sleep();
    return [...db.gradingCompanies];
  },

  async listGradeSlabs(): Promise<(GradeSlab & { company: GradingCompany | null })[]> {
    await sleep();
    return db.gradeSlabs.map(slab => {
      const company =
        db.gradingCompanies.find(gc => gc.companyID === slab.companyID) ?? null;
      return { ...slab, company };
    });
  },

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
    return db.orders.map(o => ({
      ...o,
      customer: db.customers.find(c => c.customerID === o.customerID) ?? null,
    }));
  },

  async createOrder(payload: Omit<Order, 'orderID'>): Promise<{ orderID: number }> {
    await sleep();
    const orderID = nextId(); // e.g. 2001, 2002, ...
    db.orders.push({ orderID, ...payload });
    return { orderID };
  },

  async updateOrder(orderID: number, patch: Partial<Order>): Promise<void> {
    await sleep();
    const i = db.orders.findIndex(o => o.orderID === orderID);
    if (i >= 0) {
      db.orders[i] = { ...db.orders[i], ...patch };
    }
  },

  async deleteOrder(orderID: number): Promise<void> {
    await sleep();
    // remove order
    db.orders = db.orders.filter(o => o.orderID !== orderID);
    // also remove its join rows
    db.orderItems = db.orderItems.filter(oi => oi.orderID !== orderID);
  },


  // Create or update a slab for this listing (1:1 via shared key)
  async upsertGradeSlabForListing(
    listingID: number,
    payload: { companyID: number; grade: number }
  ): Promise<void> {
    await sleep();
    const idx = db.gradeSlabs.findIndex(gs => gs.slabID === listingID);
    if (idx >= 0) {
      db.gradeSlabs[idx] = { slabID: listingID, ...payload };
    } else {
      db.gradeSlabs.push({ slabID: listingID, ...payload });
    }
  },

  async deleteGradeSlabForListing(listingID: number): Promise<void> {
    await sleep();
    db.gradeSlabs = db.gradeSlabs.filter(gs => gs.slabID !== listingID);
  },

  // --- OrderItems CRUD --- 

  async createOrderItem(payload: OrderItem): Promise<void> {
    await sleep();
    const existing = db.orderItems.find(
      oi => oi.orderID === payload.orderID && oi.listingID === payload.listingID,
    );

    if (existing) {
      existing.quantity = payload.quantity;
      existing.unitPrice = payload.unitPrice;
    } else {
      db.orderItems.push({ ...payload });
    }

    recomputeOrderTotals(payload.orderID);
  },

  async updateOrderItem(
    orderID: number,
    listingID: number,
    patch: Partial<OrderItem>,
  ): Promise<void> {
    await sleep();
    const i = db.orderItems.findIndex(
      oi => oi.orderID === orderID && oi.listingID === listingID,
    );

    if (i >= 0) {
      db.orderItems[i] = { ...db.orderItems[i], ...patch };
    }

    recomputeOrderTotals(orderID);
  },

  async deleteOrderItem(orderID: number, listingID: number): Promise<void> {
    await sleep();
    db.orderItems = db.orderItems.filter(
      oi => !(oi.orderID === orderID && oi.listingID === listingID),
    );

    recomputeOrderTotals(orderID);
  },

  // Order items (+ joined listing)
  async listOrderItems(orderID: number): Promise<(OrderItem & { listing: Listing | null })[]> {
    await sleep();
    return db.orderItems
      .filter(oi => oi.orderID === orderID)
      .map(oi => ({
        ...oi,
        listing: db.listings.find(l => l.listingID === oi.listingID) ?? null,
      }));
  },
};
