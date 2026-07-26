export type CustomerEvent = {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  date: string;
  location: string;
  price: number;
  quota: number;
  sold: number;
  image: string;
  status: string;
};

export type CustomerOrder = {
  id: string;
  number: string;
  event: CustomerEvent;
  quantity: number;
  total: number;
  status: string;
  payment: string;
  createdAt: string;
  expiresAt?: string;
};

export type CustomerTicket = {
  id: string;
  code: string;
  event: CustomerEvent;
  type: string;
  attendee: string;
  status: string;
  checkedIn: boolean;
  qrValue: string;
};

export type CustomerVoucher = {
  id: string;
  code: string;
  type: string;
  value: number;
  minimum: number;
  maxDiscount?: number;
  status: string;
  validUntil: string;
};

export type CustomerNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type CustomerProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "customer";
  status: string;
  avatar_url: string | null;
};

export type CustomerSnapshot = {
  mode: "demo" | "supabase";
  profile: CustomerProfile;
  events: CustomerEvent[];
  orders: CustomerOrder[];
  tickets: CustomerTicket[];
  vouchers: CustomerVoucher[];
  notifications: CustomerNotification[];
};
