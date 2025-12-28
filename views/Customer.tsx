import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Search, X, Send, CheckCircle, Bell, Facebook, Phone, MessageCircle, HelpCircle, FileText, Printer, MapPin } from 'lucide-react';
import { Product, CartItem, Topping, Order, OrderStatus, ContactMethod } from '../types';
import { CONTACT_OPTIONS } from '../constants';
import { useStore } from '../services/store';

const CustomerView: React.FC = () => {
  const { products, categories, config, addOrder, formatPrice, orders } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tempToppings, setTempToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isOrderLookupOpen, setIsOrderLookupOpen] = useState(false);
  const [orderLookupId, setOrderLookupId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  
  // New Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>(ContactMethod.PHONE);
  const [contactValue, setContactValue] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Success State
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('customer_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('customer_cart', JSON.stringify(cart));
  }, [cart]);

  // If categories change or load, default to first or 'Phổ biến' if available, else 'all' logic
  const displayCategories = categories.map(c => c.name);

  const filteredProducts = products.filter(p => 
    p.isAvailable &&
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const newItem: CartItem = {
      ...selectedProduct,
      cartId: Math.random().toString(36).substr(2, 9),
      quantity,
      selectedToppings: tempToppings,
      note
    };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setTempToppings([]);
    setQuantity(1);
    setNote('');
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const cartTotalUSD = cart.reduce((sum, item) => {
    const toppingTotal = item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
    return sum + (item.price + toppingTotal) * item.quantity;
  }, 0);

  const generateTelegramUrl = (order: Order) => {
    const formatUSD = (val: number) => `$${val.toFixed(2)}`;
    
    const orderDetails = order.items.map((item, idx) => 
      `${idx + 1}. ${item.name} (x${item.quantity}) - ${formatUSD(item.price * item.quantity)}\n` +
      `${item.selectedToppings.length ? `   + ${item.selectedToppings.map(t => t.name).join(', ')}\n` : ''}` +
      `${item.note ? `   Note: ${item.note}\n` : ''}`
    ).join('');

    const message = 
      `🔥 ĐƠN HÀNG MỚI #${order.id.slice(-4).toUpperCase()}\n` +
      `--------------------------------\n` +
      `👤 Khách: ${order.customerName}\n` +
      `📞 LH: ${order.contactMethod} - ${order.contactValue}\n` +
      `${order.deliveryAddress ? `📍 Đ/C: ${order.deliveryAddress}\n` : ''}` +
      `--------------------------------\n` +
      orderDetails +
      `--------------------------------\n` +
      `💰 TỔNG CỘNG: ${formatUSD(order.totalAmount)}\n` +
      `⏰ Thời gian: ${new Date(order.createdAt).toLocaleString('vi-VN')}`;

    return `https://t.me/${config.telegramUsername}?text=${encodeURIComponent(message)}`;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !contactValue.trim()) {
      alert("Vui lòng nhập tên và thông tin liên hệ!");
      return;
    }
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      items: cart,
      totalAmount: cartTotalUSD,
      status: OrderStatus.PENDING,
      createdAt: Date.now(),
      customerName: customerName,
      contactMethod: contactMethod,
      contactValue: contactValue,
      deliveryAddress: deliveryAddress,
      tableNumber: 'Online'
    };

    addOrder(newOrder);
    setCart([]);
    setIsCartOpen(false);
    setSuccessOrder(newOrder);
  };

  const handleOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderLookupId.trim()) return;
    const found = orders.find(o => o.id.toLowerCase().endsWith(orderLookupId.toLowerCase()));
    setFoundOrder(found || null);
    if (!found) alert('Không tìm thấy đơn hàng với mã này!');
  };

  // Render Success Screen if order placed
  if (successOrder) {
    const telegramLink = generateTelegramUrl(successOrder);
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="bg-green-100 p-6 rounded-full mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mb-8 max-w-xs">
          Đơn hàng <strong>#{successOrder.id.slice(-4).toUpperCase()}</strong> đã được ghi nhận. Vui lòng gửi thông tin cho CSKH để xác nhận thanh toán.
        </p>
        
        <a 
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-sm py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mb-4 transition-transform active:scale-95"
        >
          <Send size={24} /> Gửi CSKH (Telegram)
        </a>

        <button 
          onClick={() => {
            setSuccessOrder(null);
            setCustomerName('');
            setContactValue('');
            setDeliveryAddress('');
          }}
          className="text-gray-500 hover:text-gray-800 underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const formattedTotal = formatPrice(cartTotalUSD);
  const currentItemTotal = selectedProduct ? formatPrice( (selectedProduct.price + tempToppings.reduce((a,b) => a+b.price, 0)) * quantity ) : null;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen flex flex-col relative">
      
      {/* 1. Marquee (Sticky Top) */}
      {config.notificationText && (
        <div className="sticky top-0 z-50 bg-yellow-100 text-yellow-800 text-sm py-2 overflow-hidden whitespace-nowrap border-b border-yellow-200 shadow-sm h-9">
           <div className="animate-marquee inline-block px-4 font-medium">
             <Bell size={14} className="inline mr-2 mb-0.5" />
             {config.notificationText}
           </div>
        </div>
      )}

      {/* 2. Banner (Normal Scroll) */}
      {config.bannerUrl && (
        <div className="w-full h-40 md:h-56 overflow-hidden relative">
          <img src={config.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
            <h1 className="text-white font-bold text-2xl drop-shadow-md">{config.storeName}</h1>
          </div>
        </div>
      )}

      {/* 3. Header Search & Categories (Sticky below Marquee) */}
      <div 
        className={`bg-white p-4 sticky z-40 shadow-sm border-b border-gray-100 transition-all ${config.notificationText ? 'top-9' : 'top-0'}`}
      >
        <div className="flex items-center gap-2">
           <div className="flex-1 flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <Search size={20} className="text-gray-400" />
            <input 
              className="bg-transparent outline-none flex-1 text-gray-800"
              placeholder="Tìm món ăn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsOrderLookupOpen(true)}
            className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
            title="Tra cứu đơn hàng"
          >
            <FileText size={20} />
          </button>
        </div>
        
        <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-2">
          <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.name 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {filteredProducts.map(product => {
          const priceStr = formatPrice(product.price);
          return (
            <div 
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setQuantity(1);
                setTempToppings([]);
              }}
              className="bg-white p-3 rounded-xl shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg bg-gray-200" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-green-700">{priceStr.usd}</span>
                    <span className="text-[10px] text-gray-500">{priceStr.khr} / {priceStr.vnd}</span>
                  </div>
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Contact Button */}
      <button 
        onClick={() => setIsContactOpen(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-30 hover:bg-blue-700 hover:scale-110 transition-all"
        title="Liên hệ"
      >
        <HelpCircle size={24} />
      </button>

      {/* Contact Modal (Replaces Footer) */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsContactOpen(false)}>
           <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center border-b pb-2">
               <h3 className="font-bold text-lg">Liên hệ hỗ trợ</h3>
               <button onClick={() => setIsContactOpen(false)}><X size={20}/></button>
             </div>
             <div className="grid grid-cols-1 gap-3">
              {config.contactLinks.filter(l => l.isActive).map(link => (
                <a 
                  key={link.id} 
                  href={link.value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  {link.platform === 'Facebook' && <Facebook size={24} className="text-blue-600"/>}
                  {link.platform === 'Zalo' && <MessageCircle size={24} className="text-blue-500"/>}
                  {link.platform === 'Telegram' && <Send size={24} className="text-sky-500"/>}
                  {link.platform === 'WeChat' && <MessageCircle size={24} className="text-green-600"/>}
                  {link.platform === 'Hotline' && <Phone size={24} className="text-red-500"/>}
                  <div>
                     <div className="font-bold text-sm">{link.label}</div>
                     <div className="text-xs text-gray-500 truncate">{link.value}</div>
                  </div>
                </a>
              ))}
            </div>
             <div className="text-center text-xs text-gray-400 pt-2">© 2024 {config.storeName}</div>
           </div>
        </div>
      )}

      {/* Order Lookup Modal (BILL STYLE) */}
      {isOrderLookupOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-xl w-full max-w-sm p-0 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
               <h3 className="font-bold text-lg">Tra cứu đơn hàng</h3>
               <button onClick={() => { setIsOrderLookupOpen(false); setFoundOrder(null); setOrderLookupId(''); }}><X size={20}/></button>
             </div>
             
             {!foundOrder ? (
               <div className="p-6">
                 <form onSubmit={handleOrderLookup} className="space-y-3">
                   <p className="text-sm text-gray-600">Nhập 4 số cuối hoặc mã đơn hàng đầy đủ để xem hóa đơn.</p>
                   <input 
                     type="text" 
                     value={orderLookupId}
                     onChange={e => setOrderLookupId(e.target.value)}
                     placeholder="VD: 9A2B"
                     className="w-full border rounded-lg p-3 text-center uppercase font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                   <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Kiểm tra</button>
                 </form>
               </div>
             ) : (
                <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                  {/* Bill UI Simulation */}
                   <div className="bg-white shadow-md p-4 mx-auto w-full font-mono text-sm border-t-8 border-blue-500 relative">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 uppercase">{config.storeName}</h2>
                        <p className="text-xs text-gray-500">HÓA ĐƠN THANH TOÁN</p>
                        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
                      </div>

                      <div className="space-y-1 mb-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mã đơn:</span>
                          <span className="font-bold">#{foundOrder.id.slice(-4).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ngày:</span>
                          <span>{new Date(foundOrder.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Khách:</span>
                          <span className="font-bold">{foundOrder.customerName}</span>
                        </div>
                        {foundOrder.deliveryAddress && (
                           <div className="flex justify-between">
                            <span className="text-gray-500">Đ/C:</span>
                            <span className="font-bold text-right w-2/3 truncate">{foundOrder.deliveryAddress}</span>
                          </div>
                        )}
                         <div className="flex justify-between">
                          <span className="text-gray-500">Trạng thái:</span>
                          <span className={`font-bold ${foundOrder.status === OrderStatus.COMPLETED ? 'text-green-600' : 'text-orange-500'}`}>{foundOrder.status}</span>
                        </div>
                      </div>

                      <table className="w-full text-left mb-4 border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="py-2">Món</th>
                            <th className="py-2 text-right">SL</th>
                            <th className="py-2 text-right">$$</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foundOrder.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-dashed border-gray-100">
                              <td className="py-2 pr-2">
                                <div className="font-medium">{item.name}</div>
                                {item.selectedToppings.length > 0 && (
                                  <div className="text-[10px] text-gray-500">
                                    + {item.selectedToppings.map(t => t.name).join(', ')}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 text-right align-top">{item.quantity}</td>
                              <td className="py-2 text-right align-top">
                                ${(item.price * item.quantity + item.selectedToppings.reduce((acc, t) => acc + t.price, 0) * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="space-y-2 pt-2">
                         <div className="flex justify-between font-bold text-lg text-gray-800">
                           <span>TỔNG CỘNG:</span>
                           <span>{formatPrice(foundOrder.totalAmount).usd}</span>
                         </div>
                         <div className="flex justify-between text-xs text-gray-500">
                           <span>(Quy đổi KHR)</span>
                           <span>{formatPrice(foundOrder.totalAmount).khr}</span>
                         </div>
                         <div className="flex justify-between text-xs text-gray-500">
                           <span>(Quy đổi VND)</span>
                           <span>{formatPrice(foundOrder.totalAmount).vnd}</span>
                         </div>
                      </div>

                      <div className="text-center mt-8 text-xs text-gray-400">
                        <p>Cảm ơn quý khách đã ủng hộ!</p>
                      </div>
                   </div>

                   <button 
                    onClick={() => { setFoundOrder(null); }}
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-bold mt-4 shadow-sm hover:bg-gray-300"
                   >
                     Tra cứu đơn khác
                   </button>
                </div>
             )}
           </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white w-full md:w-[500px] rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="relative h-48 md:h-56 shrink-0">
              <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                <span className="font-bold text-lg text-green-700">{formatPrice(selectedProduct.price).usd}</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{selectedProduct.description}</p>
              
              {selectedProduct.toppings && selectedProduct.toppings.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Thêm</h3>
                  <div className="space-y-2">
                    {selectedProduct.toppings.map(topping => (
                      <label key={topping.id} className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                            checked={tempToppings.some(t => t.id === topping.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempToppings([...tempToppings, topping]);
                              } else {
                                setTempToppings(tempToppings.filter(t => t.id !== topping.id));
                              }
                            }}
                          />
                          <span>{topping.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">+${topping.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Ghi chú</h3>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Ví dụ: Ít đá, nhiều đường..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 border-t bg-white shrink-0">
              <div className="flex items-center justify-center gap-6 mb-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 active:scale-95 transition-all flex flex-col items-center justify-center leading-tight"
              >
                <span>Thêm vào giỏ</span>
                <span className="text-xs font-normal opacity-90">{currentItemTotal?.full}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Cart Bar (Sticky Bottom) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-100 to-transparent z-10">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-green-500 text-white p-3 rounded-xl shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <ShoppingCart size={20} />
              </div>
              <span className="font-bold">{cart.reduce((a, b) => a + b.quantity, 0)} món</span>
            </div>
            <span className="font-bold text-lg">{formattedTotal.usd}</span>
          </button>
        </div>
      )}

      {/* Full Cart Drawer (Checkout) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-in-right">
          <div className="p-4 border-b flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold">Giỏ hàng & Thanh toán</h2>
            <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* List Items */}
            {cart.map(item => (
              <div key={item.cartId} className="flex gap-3 border-b border-dashed pb-4 last:border-0">
                <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                  {item.selectedToppings.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      + {item.selectedToppings.map(t => t.name).join(', ')}
                    </p>
                  )}
                  {item.note && <p className="text-xs italic text-gray-500">"{item.note}"</p>}
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-semibold text-green-600">
                      ${((item.price + item.selectedToppings.reduce((a,b)=>a+b.price, 0)) * item.quantity).toFixed(2)}
                    </span>
                    <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-gray-50 space-y-3 shadow-inner">
            <h3 className="font-bold text-gray-700">Thông tin liên hệ</h3>
            <input 
              type="text" 
              placeholder="Tên của bạn"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            
            <div className="flex gap-2">
              <select 
                className="p-3 border rounded-lg bg-white w-1/3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                value={contactMethod}
                onChange={e => setContactMethod(e.target.value as ContactMethod)}
              >
                {CONTACT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder={CONTACT_OPTIONS.find(o => o.value === contactMethod)?.placeholder}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={contactValue}
                onChange={e => setContactValue(e.target.value)}
              />
            </div>
            
            {/* New: Delivery Address */}
            <div className="flex items-start gap-2">
               <MapPin className="text-gray-400 mt-3" size={20} />
               <textarea 
                  placeholder="Địa chỉ giao hàng (Tùy chọn)"
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none h-20"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
               />
            </div>

            <div className="bg-white p-3 rounded-lg border border-dashed border-green-500 mt-2">
              <div className="flex justify-between font-bold text-lg text-green-700">
                <span>Tổng USD:</span>
                <span>{formattedTotal.usd}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Tổng KHR:</span>
                <span>{formattedTotal.khr}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Tổng VND:</span>
                <span>{formattedTotal.vnd}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Xác nhận đặt hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;