import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { Product, OrderStatus, Category, Topping, SystemConfig, ContactLink, Order, CartItem, ContactMethod } from '../types';
import { CONTACT_OPTIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Trash2, Edit2, Save, X, DollarSign, ShoppingBag, Layers, Coffee, Settings, Image as ImageIcon, Bell, Globe, Facebook, MessageCircle, Phone, Send, Search, FileText, ChefHat, Printer, MinusCircle, PlusCircle, Store, MapPin, Volume2, VolumeX } from 'lucide-react';
import Receipt from '../components/Receipt';

// Simple "Ding" sound base64
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7c1/0z83ghO3scTuRZkS5Ea07Fhdh1U/MJAAAGkAVjlfL+aLEjPO6CtDQLYLsNBWKyGhVidHWyumFHQWOk8JCLCsKMBkIiIKLfvoVOporK6kX/scFCwQCA1HY0IABnLPBj6QDlKK5C8kSQaC4yFK2At3Rn+b/gK7rzLxfp50IfQAAmUbz/0lckHe/rgSVKBApYaJoirr/9R2fvmfus9+k/vn/t3/3//7/6/7/+7/+9/4b99/9///+5/9//+/3//9/7//9////";

const AdminView: React.FC = () => {
  const { 
    products, 
    orders, 
    categories,
    config,
    addProduct, 
    updateProduct, 
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateConfig,
    formatPrice,
    updateOrder
  } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'stats' | 'categories' | 'settings' | 'orders'>('stats');
  
  // Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Topping State (inside Product Modal)
  const [productToppings, setProductToppings] = useState<Topping[]>([]);
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState('');

  // Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');

  // Config State
  const [tempConfig, setTempConfig] = useState<SystemConfig>(config);

  // Order Search State
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  
  // Order Editing State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [productToAddId, setProductToAddId] = useState('');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersLength = useRef(orders.length);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  // Check for new orders to play sound
  useEffect(() => {
    // If we have MORE orders than before
    if (orders.length > prevOrdersLength.current) {
      // Check if the newest order is PENDING
      const newestOrder = orders[0]; // orders are usually unshifted to top
      if (newestOrder && newestOrder.status === OrderStatus.PENDING) {
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
      }
    }
    prevOrdersLength.current = orders.length;
  }, [orders, soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  // Sync state with store config
  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  // Statistics Calculation
  const totalRevenue = orders
    .filter(o => o.status !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;

  const revenueByDate = orders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += order.totalAmount;
    } else {
      acc.push({ date, amount: order.totalAmount });
    }
    return acc;
  }, []).slice(-7); // Last 7 days

  // Filtered Orders for Admin
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    o.contactValue.includes(orderSearchTerm)
  );

  // Reset toppings when opening modal
  useEffect(() => {
    if (editingProduct) {
      setProductToppings(editingProduct.toppings || []);
    } else {
      setProductToppings([]);
    }
  }, [editingProduct, isProductModalOpen]);

  // Handlers
  const handleAddTopping = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!newToppingName.trim() || !newToppingPrice) return;
    const newTopping: Topping = {
      id: Math.random().toString(36).substr(2, 9),
      name: newToppingName,
      price: Number(newToppingPrice)
    };
    setProductToppings([...productToppings, newTopping]);
    setNewToppingName('');
    setNewToppingPrice('');
  };

  const removeTopping = (id: string) => {
    setProductToppings(productToppings.filter(t => t.id !== id));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
      image: formData.get('image') as string || `https://picsum.photos/300/300?random=${Math.random()}`,
      isAvailable: formData.get('isAvailable') === 'on',
      toppings: productToppings // Save the dynamic toppings
    };

    if (editingProduct) updateProduct(newProduct);
    else addProduct(newProduct);
    
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, catNameInput);
    } else {
      addCategory(catNameInput);
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCatNameInput('');
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setIsCategoryModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(tempConfig);
    alert("Đã lưu cấu hình!");
  };

  const handleContactChange = (idx: number, field: keyof ContactLink, value: any) => {
    const newLinks = [...tempConfig.contactLinks];
    newLinks[idx] = { ...newLinks[idx], [field]: value };
    setTempConfig({ ...tempConfig, contactLinks: newLinks });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'text-yellow-600 bg-yellow-100';
      case OrderStatus.CONFIRMED: return 'text-blue-600 bg-blue-100';
      case OrderStatus.PREPARING: return 'text-orange-600 bg-orange-100';
      case OrderStatus.COMPLETED: return 'text-green-600 bg-green-100';
      case OrderStatus.CANCELLED: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // --- Order Editing Handlers ---
  const handleOpenOrderEdit = (order: Order) => {
    setEditingOrder(JSON.parse(JSON.stringify(order))); // Deep copy
    setIsOrderModalOpen(true);
    setProductToAddId('');
  };

  const handleSaveOrder = () => {
    if (editingOrder) {
      // Recalculate total amount
      const total = editingOrder.items.reduce((sum, item) => {
         const toppingTotal = item.selectedToppings.reduce((tSum, t) => tSum + t.price, 0);
         return sum + (item.price + toppingTotal) * item.quantity;
      }, 0);
      
      const orderToSave = { ...editingOrder, totalAmount: total };
      updateOrder(orderToSave);
      setIsOrderModalOpen(false);
      setEditingOrder(null);
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (!editingOrder) return;
    if (newQty < 0) return;
    
    const newItems = [...editingOrder.items];
    if (newQty === 0) {
      // If 0, remove item
      newItems.splice(index, 1);
    } else {
      newItems[index].quantity = newQty;
    }
    setEditingOrder({ ...editingOrder, items: newItems });
  };
  
  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    if (!editingOrder) return;
    if (newPrice < 0) return;
    const newItems = [...editingOrder.items];
    newItems[index].price = newPrice; // Directly modify the price of this specific item line
    setEditingOrder({ ...editingOrder, items: newItems });
  };

  const handleAddProductToOrder = () => {
    if (!editingOrder || !productToAddId) return;
    const product = products.find(p => p.id === productToAddId);
    if (!product) return;

    const newItem: CartItem = {
      ...product,
      cartId: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      selectedToppings: [], // Default no toppings
      note: 'Thêm bởi Admin'
    };
    
    setEditingOrder({
      ...editingOrder,
      items: [...editingOrder.items, newItem]
    });
    setProductToAddId(''); // Reset selector
  };

  const handlePrintOrder = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold text-gray-800">Quản trị hệ thống</h1>
            {/* Sound Toggle Button */}
            <button 
              onClick={toggleSound}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all ${
                soundEnabled ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
              {soundEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}
            </button>
        </div>
       
        <div className="flex bg-white rounded-lg shadow p-1 w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${activeTab === 'stats' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Thống kê
          </button>
           <button 
             onClick={() => setActiveTab('orders')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Đơn hàng
          </button>
          <button 
             onClick={() => setActiveTab('categories')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${activeTab === 'categories' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Danh mục
          </button>
          <button 
             onClick={() => setActiveTab('products')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${activeTab === 'products' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Sản phẩm
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Cấu hình
          </button>
        </div>
      </div>

      {/* --- STATS TAB --- */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 mb-1">Doanh thu tổng ($)</p>
                  <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign /></div>
              </div>
            </div>
            {/* ... other stat boxes ... */}
             <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 mb-1">Đơn hoàn thành</p>
                  <h3 className="text-2xl font-bold text-gray-900">{completedOrders}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><ShoppingBag /></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 mb-1">Danh mục món</p>
                  <h3 className="text-2xl font-bold text-gray-900">{categories.length}</h3>
                </div>
                <div className="bg-orange-100 p-3 rounded-full text-orange-600"><Layers /></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Biểu đồ doanh thu ($)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDate}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- ORDERS TAB (New) --- */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-2">
            <Search className="text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm theo Mã đơn / Tên khách / SĐT..."
              className="flex-1 outline-none text-gray-700"
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Mã Đơn</th>
                  <th className="p-4 font-semibold text-gray-700">Ngày tạo</th>
                  <th className="p-4 font-semibold text-gray-700">Khách hàng</th>
                  <th className="p-4 font-semibold text-gray-700">Trạng thái</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Tổng tiền ($)</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                   <tr><td colSpan={6} className="p-8 text-center text-gray-500">Không tìm thấy đơn hàng nào.</td></tr>
                )}
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 text-gray-900">
                    <td className="p-4 font-mono font-medium">#{order.id.slice(-4).toUpperCase()}</td>
                    <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.contactValue}</div>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${getStatusColor(order.status)}`}>
                         {order.status}
                       </span>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatPrice(order.totalAmount).usd}
                    </td>
                    <td className="p-4 text-right">
                       <button 
                         onClick={() => handleOpenOrderEdit(order)}
                         className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                         title="Chỉnh sửa đơn hàng"
                       >
                         <Edit2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CATEGORIES TAB --- */}
      {activeTab === 'categories' && (
        <div className="animate-fade-in">
           {/* ... existing categories table code ... */}
           <button 
            onClick={() => { setEditingCategory(null); setCatNameInput(''); setIsCategoryModalOpen(true); }}
            className="mb-4 bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
          >
            <Plus size={20} /> Thêm danh mục
          </button>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-2xl border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Tên danh mục</th>
                  <th className="p-4 text-center font-semibold text-gray-700">Số lượng món</th>
                  <th className="p-4 text-right font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50 text-gray-900">
                    <td className="p-4 font-medium">{cat.name}</td>
                    <td className="p-4 text-center">
                      {products.filter(p => p.category === cat.name).length}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditCategory(cat)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Xóa danh mục này? Các món ăn thuộc danh mục sẽ không hiển thị đúng!')) deleteCategory(cat.id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="animate-fade-in">
          {/* ... existing products table code ... */}
           <button 
            onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
            className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Plus size={20} /> Thêm món mới
          </button>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">Hình ảnh</th>
                    <th className="p-4 font-semibold text-gray-700">Tên món</th>
                    <th className="p-4 font-semibold text-gray-700">Giá ($)</th>
                    <th className="p-4 font-semibold text-gray-700">Danh mục</th>
                    <th className="p-4 font-semibold text-gray-700">Trạng thái</th>
                    <th className="p-4 text-right font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50 text-gray-900">
                      <td className="p-4">
                        <img src={product.image} alt="" className="w-12 h-12 rounded object-cover border" />
                      </td>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4">${product.price.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap text-gray-700 border">{product.category}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.isAvailable ? 'Đang bán' : 'Hết hàng'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Xóa món này?')) deleteProduct(product.id); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
             <div className="flex items-center gap-2 mb-6 border-b pb-4">
               <Settings className="text-gray-600" />
               <h2 className="text-xl font-bold text-gray-800">Hệ thống & Tỷ giá</h2>
             </div>
             
             <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* BRAND INFO SECTION */}
               <div className="bg-blue-50 p-4 rounded-lg space-y-3 mb-4">
                 <h3 className="font-bold flex items-center gap-2 text-blue-800"><Store size={18}/> Thông tin Thương hiệu</h3>
                 <div>
                   <label className="block text-sm font-medium mb-1 text-gray-700">Tên Cửa hàng (Brand Name)</label>
                   <input 
                     type="text" 
                     value={tempConfig.storeName}
                     onChange={(e) => setTempConfig({...tempConfig, storeName: e.target.value})}
                     className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1 text-gray-700">Địa chỉ (Hiển thị trên Bill)</label>
                   <input 
                     type="text" 
                     value={tempConfig.storeAddress}
                     onChange={(e) => setTempConfig({...tempConfig, storeAddress: e.target.value})}
                     className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1 text-gray-700">SĐT Cửa hàng (Hotline Bill)</label>
                   <input 
                     type="text" 
                     value={tempConfig.storePhone}
                     onChange={(e) => setTempConfig({...tempConfig, storePhone: e.target.value})}
                     className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Telegram CSKH Username</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                   <input 
                     type="text" 
                     value={tempConfig.telegramUsername} 
                     onChange={(e) => setTempConfig({...tempConfig, telegramUsername: e.target.value.replace('@', '')})}
                     className="w-full pl-8 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">1 USD = ? KHR (Riel)</label>
                    <input 
                      type="number"
                      value={tempConfig.exchangeRateKHR}
                      onChange={(e) => setTempConfig({...tempConfig, exchangeRateKHR: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">1 USD = ? VND (Đồng)</label>
                    <input 
                      type="number"
                      value={tempConfig.exchangeRateVND}
                      onChange={(e) => setTempConfig({...tempConfig, exchangeRateVND: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
               </div>

               <hr className="my-4"/>

               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2"><ImageIcon size={16}/> Link Ảnh Banner (Đầu trang)</label>
                 <input 
                   type="text"
                   value={tempConfig.bannerUrl}
                   onChange={(e) => setTempConfig({...tempConfig, bannerUrl: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="https://..."
                 />
                 {tempConfig.bannerUrl && <img src={tempConfig.bannerUrl} alt="Preview" className="h-20 w-full object-cover mt-2 rounded border" />}
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2"><Bell size={16}/> Thông báo chạy (Khách)</label>
                 <textarea 
                   value={tempConfig.notificationText}
                   onChange={(e) => setTempConfig({...tempConfig, notificationText: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-16"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center gap-2"><ChefHat size={16}/> Thông báo nội bộ (Bếp)</label>
                 <textarea 
                   value={tempConfig.kitchenNotificationText}
                   onChange={(e) => setTempConfig({...tempConfig, kitchenNotificationText: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none h-16 bg-yellow-50"
                   placeholder="Thông báo dành riêng cho nhân viên bếp..."
                 />
               </div>
               
               <button type="submit" className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                 Lưu tất cả cấu hình
               </button>
             </form>
           </div>

           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
             <div className="flex items-center gap-2 mb-6 border-b pb-4">
               <Globe className="text-gray-600" />
               <h2 className="text-xl font-bold text-gray-800">Liên hệ Chân trang (Footer)</h2>
             </div>
             
             <div className="space-y-4">
               {tempConfig.contactLinks.map((link, idx) => (
                 <div key={link.id} className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50">
                   <div className="w-8 flex justify-center">
                     {link.platform === 'Facebook' && <Facebook size={20} className="text-blue-600"/>}
                     {link.platform === 'Zalo' && <MessageCircle size={20} className="text-blue-500"/>}
                     {link.platform === 'Telegram' && <Send size={20} className="text-sky-500"/>}
                     {link.platform === 'WeChat' && <MessageCircle size={20} className="text-green-600"/>}
                     {link.platform === 'Hotline' && <Phone size={20} className="text-red-500"/>}
                   </div>
                   <div className="flex-1 space-y-1">
                     <input 
                       value={link.label}
                       onChange={(e) => handleContactChange(idx, 'label', e.target.value)}
                       className="w-full text-xs font-bold border-b bg-transparent outline-none pb-1"
                       placeholder="Nhãn hiển thị"
                     />
                     <input 
                       value={link.value}
                       onChange={(e) => handleContactChange(idx, 'value', e.target.value)}
                       className="w-full text-sm text-gray-600 border-b bg-transparent outline-none pb-1"
                       placeholder="Link hoặc Số ĐT"
                     />
                   </div>
                   <input 
                      type="checkbox" 
                      checked={link.isActive}
                      onChange={(e) => handleContactChange(idx, 'isActive', e.target.checked)}
                      className="w-5 h-5"
                   />
                 </div>
               ))}
               <p className="text-xs text-gray-500 italic">* Tích chọn để hiển thị ở nút liên hệ của khách.</p>
             </div>
           </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 text-gray-900 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg my-8 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg">{editingProduct ? 'Sửa món ăn' : 'Thêm món mới'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-500 hover:text-black"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-4">
                {/* ... fields ... */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tên món</label>
                  <input required name="name" defaultValue={editingProduct?.name} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium mb-1">Giá ($ USD)</label>
                    <input required name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="w-full border border-gray-300 rounded-lg p-2" />
                   </div>
                   {/* ... category select ... */}
                   <div>
                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                    <select name="category" defaultValue={editingProduct?.category || categories[0]?.name} className="w-full border border-gray-300 rounded-lg p-2">
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                   </div>
                </div>
                {/* ... desc, image ... */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <textarea name="description" defaultValue={editingProduct?.description} className="w-full border border-gray-300 rounded-lg p-2 h-20"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Hình ảnh</label>
                  <input name="image" defaultValue={editingProduct?.image} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
                
                {/* Updated "Topping thêm" label to "Thêm" */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Coffee size={18} /> Cấu hình "Thêm" (Topping)
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="Tên (VD: Thêm cơm)" 
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                      value={newToppingName}
                      onChange={e => setNewToppingName(e.target.value)}
                    />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Giá ($)" 
                      className="w-24 border border-gray-300 rounded-lg p-2 text-sm"
                      value={newToppingPrice}
                      onChange={e => setNewToppingPrice(e.target.value)}
                    />
                    <button type="button" onClick={handleAddTopping} className="bg-gray-800 text-white px-3 rounded-lg hover:bg-black"><Plus size={16} /></button>
                  </div>
                  {/* ... topping list ... */}
                   <div className="bg-gray-50 rounded-lg p-2 space-y-2 border border-gray-200">
                    {productToppings.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100">
                        <span className="text-sm font-medium">{t.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-green-600 font-bold">+${t.price}</span>
                           <button type="button" onClick={() => removeTopping(t.id)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="isAvailable" defaultChecked={editingProduct ? editingProduct.isAvailable : true} id="avail" className="w-4 h-4 text-green-500 rounded" />
                  <label htmlFor="avail" className="font-medium">Đang kinh doanh (Còn hàng)</label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t bg-gray-50 shrink-0">
              <button type="submit" form="productForm" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                <Save size={18} className="inline mr-2" /> Lưu món ăn
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Category Modal - same as before */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 text-gray-900">
           <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-scale-up shadow-2xl">
             {/* ... content same as before ... */}
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-black"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                <input required autoFocus value={catNameInput} onChange={e => setCatNameInput(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700"><Save size={18} className="inline mr-2" /> Lưu lại</button>
            </form>
           </div>
        </div>
      )}

      {/* --- ADMIN ORDER EDIT MODAL --- */}
      {isOrderModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 text-gray-900 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-2xl flex flex-col max-h-[90vh]">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                 <h3 className="font-bold text-lg">Chi tiết đơn hàng #{editingOrder.id.slice(-4).toUpperCase()}</h3>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(editingOrder.status)}`}>{editingOrder.status}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePrintOrder(editingOrder)}
                  className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300 text-sm font-medium"
                >
                   <Printer size={16}/> In Bill
                </button>
                <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-500 hover:text-black"><X size={20} /></button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
               {/* CUSTOMER INFO EDIT SECTION */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="col-span-2 md:col-span-2 font-bold text-blue-800 border-b border-blue-200 pb-2 mb-2">
                    Thông tin khách hàng
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Tên khách hàng</label>
                    <input 
                      type="text" 
                      className="w-full border rounded p-2 text-sm"
                      value={editingOrder.customerName}
                      onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Phương thức liên hệ</label>
                    <div className="flex gap-2">
                       <select 
                         className="border rounded p-2 text-sm w-1/3"
                         value={editingOrder.contactMethod}
                         onChange={(e) => setEditingOrder({...editingOrder, contactMethod: e.target.value as ContactMethod})}
                       >
                         {CONTACT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                       </select>
                       <input 
                        type="text" 
                        className="flex-1 border rounded p-2 text-sm"
                        value={editingOrder.contactValue}
                        onChange={(e) => setEditingOrder({...editingOrder, contactValue: e.target.value})}
                      />
                    </div>
                  </div>
                   <div className="col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Địa chỉ giao hàng</label>
                    <textarea 
                      className="w-full border rounded p-2 text-sm h-16 resize-none"
                      value={editingOrder.deliveryAddress || ''}
                      onChange={(e) => setEditingOrder({...editingOrder, deliveryAddress: e.target.value})}
                      placeholder="Chưa có địa chỉ..."
                    />
                  </div>
               </div>

               {/* Items Table */}
               <div>
                 <h4 className="font-bold mb-2 flex items-center gap-2"><ShoppingBag size={18}/> Danh sách món (Sửa được)</h4>
                 <div className="border rounded-lg overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="p-3">Món ăn</th>
                          <th className="p-3 text-center">SL</th>
                          <th className="p-3 text-right">Đơn giá ($)</th>
                          <th className="p-3 text-right">Thành tiền</th>
                          <th className="p-3 text-center">Xóa</th>
                        </tr>
                     </thead>
                     <tbody>
                       {editingOrder.items.map((item, idx) => (
                         <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                           <td className="p-3">
                             <div className="font-medium">{item.name}</div>
                             {item.selectedToppings.length > 0 && (
                               <div className="text-xs text-gray-500">+ {item.selectedToppings.map(t => t.name).join(', ')}</div>
                             )}
                             {item.note && <div className="text-xs italic text-red-500">{item.note}</div>}
                           </td>
                           <td className="p-3 text-center">
                             <div className="flex items-center justify-center gap-2">
                               <button onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)} className="text-gray-400 hover:text-red-500"><MinusCircle size={16}/></button>
                               <span className="w-6 text-center font-bold">{item.quantity}</span>
                               <button onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)} className="text-gray-400 hover:text-green-500"><PlusCircle size={16}/></button>
                             </div>
                           </td>
                           <td className="p-3 text-right">
                              <input 
                                type="number" 
                                step="0.1" 
                                value={item.price}
                                onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value))}
                                className="w-16 border rounded p-1 text-right"
                              />
                           </td>
                           <td className="p-3 text-right font-medium">
                             ${((item.price + item.selectedToppings.reduce((a,b)=>a+b.price, 0)) * item.quantity).toFixed(2)}
                           </td>
                           <td className="p-3 text-center">
                              <button onClick={() => handleUpdateItemQuantity(idx, 0)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* Add New Item */}
               <div className="flex gap-2 items-end border-t pt-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Thêm món vào đơn này</label>
                    <select 
                      className="w-full border rounded-lg p-2"
                      value={productToAddId}
                      onChange={(e) => setProductToAddId(e.target.value)}
                    >
                      <option value="">-- Chọn món --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleAddProductToOrder}
                    disabled={!productToAddId}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300"
                  >
                    Thêm món
                  </button>
               </div>
               
               <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                 <span className="font-bold">Tạm tính (Sau khi lưu):</span>
                 <span className="text-xl font-bold text-blue-600">
                   ${editingOrder.items.reduce((sum, item) => sum + (item.price + item.selectedToppings.reduce((a,b)=>a+b.price,0)) * item.quantity, 0).toFixed(2)}
                 </span>
               </div>

            </div>
            <div className="p-4 border-t bg-gray-50 shrink-0 flex gap-4">
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveOrder}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-2"
              >
                <Save size={18} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden Receipt for Admin Printing */}
      <Receipt order={printingOrder} />
    </div>
  );
};

export default AdminView;