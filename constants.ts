import { Product, OrderStatus, Role, Category, ContactMethod, SystemConfig } from './types';

// Initial Categories for first load
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Phổ biến' },
  { id: 'c2', name: 'Món chính' },
  { id: 'c3', name: 'Đồ ăn vặt' },
  { id: 'c4', name: 'Đồ uống' },
  { id: 'c5', name: 'Tráng miệng' }
];

// Products now priced in USD (approximate conversion for demo)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Trà Sữa Trân Châu Đường Đen',
    description: 'Trà sữa đậm vị kết hợp trân châu đường đen nấu chậm.',
    price: 2.5, // $2.5
    category: 'Đồ uống',
    image: 'https://picsum.photos/300/300?random=1',
    isAvailable: true,
    toppings: [
      { id: 't1', name: 'Trân châu đen', price: 0.5 },
      { id: 't2', name: 'Pudding trứng', price: 0.7 }
    ]
  },
  {
    id: 'p2',
    name: 'Cơm Gà Xối Mỡ',
    description: 'Đùi gà góc tư chiên giòn, cơm chiên dương châu.',
    price: 4.0, // $4.0
    category: 'Món chính',
    image: 'https://picsum.photos/300/300?random=2',
    isAvailable: true,
    toppings: [
       { id: 't3', name: 'Thêm Cơm', price: 0.5 },
       { id: 't4', name: 'Thêm Canh', price: 0.2 }
    ]
  },
  {
    id: 'p3',
    name: 'Bún Bò Huế',
    description: 'Hương vị chuẩn Huế, có chả cua và giò heo.',
    price: 4.5, // $4.5
    category: 'Món chính',
    image: 'https://picsum.photos/300/300?random=3',
    isAvailable: true,
    toppings: []
  },
  {
    id: 'p4',
    name: 'Khoai Tây Chiên',
    description: 'Khoai tây chiên giòn rắc phô mai.',
    price: 2.0,
    category: 'Đồ ăn vặt',
    image: 'https://picsum.photos/300/300?random=4',
    isAvailable: true,
    toppings: []
  },
  {
    id: 'p5',
    name: 'Bánh Plan',
    description: 'Bánh plan cốt dừa béo ngậy.',
    price: 1.0,
    category: 'Tráng miệng',
    image: 'https://picsum.photos/300/300?random=5',
    isAvailable: true,
    toppings: []
  },
  {
    id: 'p6',
    name: 'Trà Đào Cam Sả',
    description: 'Thanh mát giải nhiệt mùa hè.',
    price: 2.5,
    category: 'Đồ uống',
    image: 'https://picsum.photos/300/300?random=6',
    isAvailable: true,
    toppings: [
       { id: 't5', name: 'Thạch đào', price: 0.5 },
       { id: 't6', name: 'Trân châu trắng', price: 0.5 }
    ]
  }
];

export const ROLES = [
  { id: Role.CUSTOMER, label: 'Khách hàng', icon: 'User' },
  { id: Role.STAFF, label: 'Nhân viên', icon: 'ChefHat' },
  { id: Role.ADMIN, label: 'Quản lý', icon: 'BarChart' },
];

export const CONTACT_OPTIONS = [
  { value: ContactMethod.PHONE, label: 'Số điện thoại', placeholder: 'Nhập SĐT của bạn' },
  { value: ContactMethod.TELEGRAM, label: 'Telegram', placeholder: 'Nhập Username (@abc)' },
  { value: ContactMethod.FACEBOOK, label: 'Facebook', placeholder: 'Link Profile hoặc Tên FB' },
  { value: ContactMethod.WECHAT, label: 'WeChat', placeholder: 'WeChat ID' },
];

export const DEFAULT_CONFIG: SystemConfig = {
  storeName: 'FoodExpress',
  storeAddress: '123 Đường Ẩm Thực, Quận 1, TP.HCM',
  storePhone: '1900 1234',
  telegramUsername: 'SupportFoodExpress',
  exchangeRateKHR: 4100, // 1 USD = 4100 Riel
  exchangeRateVND: 25000, // 1 USD = 25000 VND
  bannerUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  notificationText: 'Chào mừng quý khách đến với FoodExpress! Giảm giá 10% cho đơn hàng trên $20.',
  kitchenNotificationText: 'Lưu ý: Kiểm tra kỹ ghi chú của khách hàng trước khi chế biến.',
  contactLinks: [
    { id: 'cl1', platform: 'Facebook', label: 'Fanpage', value: 'https://facebook.com', isActive: true },
    { id: 'cl2', platform: 'Zalo', label: 'Zalo OA', value: 'https://zalo.me', isActive: true },
    { id: 'cl3', platform: 'Telegram', label: 'Channel', value: 'https://t.me/channel', isActive: true },
    { id: 'cl4', platform: 'Hotline', label: 'Hotline', value: 'tel:19001234', isActive: true },
  ]
};