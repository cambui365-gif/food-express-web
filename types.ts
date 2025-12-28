export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ContactMethod {
  PHONE = 'Điện thoại',
  TELEGRAM = 'Telegram',
  FACEBOOK = 'Facebook',
  WECHAT = 'WeChat'
}

export interface Topping {
  id: string;
  name: string;
  price: number; // Price in USD
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Price in USD
  image: string;
  category: string;
  isAvailable: boolean;
  toppings?: Topping[];
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedToppings: Topping[];
  note?: string;
}

export interface ContactLink {
  id: string;
  platform: string; // Facebook, Zalo, etc.
  label: string;
  value: string; // The URL or Phone number
  isActive: boolean;
}

export interface SystemConfig {
  storeName: string;      // New: Brand Name
  storeAddress: string;   // New: Store Address
  storePhone: string;     // New: Store Phone for Receipt
  telegramUsername: string;
  exchangeRateKHR: number; // 1 USD = ? KHR
  exchangeRateVND: number; // 1 USD = ? VND
  bannerUrl: string;
  notificationText: string;
  kitchenNotificationText: string;
  contactLinks: ContactLink[];
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number; // Total in USD
  status: OrderStatus;
  createdAt: number;
  customerName?: string;
  contactMethod: ContactMethod;
  contactValue: string;
  deliveryAddress?: string; // New: Customer Address
  tableNumber?: string;
  cancelReason?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  topSelling: string;
}