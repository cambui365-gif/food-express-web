import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { Order, OrderStatus } from '../types';
import { Clock, Printer, CheckCircle, ChefHat, XCircle, Phone, MessageCircle, Search, Bell, Volume2, VolumeX } from 'lucide-react';
import Receipt from '../components/Receipt';

// Simple "Ding" sound base64 to avoid external dependencies
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7c1/0z83ghO3scTuRZkS5Ea07Fhdh1U/MJAAAGkAVjlfL+aLEjPO6CtDQLYLsNBWKyGhVidHWyumFHQWOk8JCLCsKMBkIiIKLfvoVOporK6kX/scFCwQCA1HY0IABnLPBj6QDlKK5C8kSQaC4yFK2At3Rn+b/gK7rzLxfp50IfQAAmUbz/0lckHe/rgSVKBApYaJoirr/9R2fvmfus9+k/vn/t3/3//7/6/7/+7/+9/4b99/9///+5/9//+/3//9/7//9////";

const StaffView: React.FC = () => {
  const { orders, updateOrderStatus, cancelOrder, formatPrice, config } = useStore();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    // Try playing silent sound to unlock audio context on mobile
    if (!soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  // Filter and Sort orders
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status === OrderStatus.PENDING && b.status !== OrderStatus.PENDING) return -1;
    if (a.status !== OrderStatus.PENDING && b.status === OrderStatus.PENDING) return 1;
    return b.createdAt - a.createdAt;
  });

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 300); 
  };

  const handleCancel = (orderId: string) => {
    const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:");
    if (reason && reason.trim()) {
      cancelOrder(orderId, reason);
    } else if (reason !== null) {
      alert("Bạn phải nhập lý do để hủy đơn!");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 animate-pulse'; // Pulse for pending
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-800';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const nextStatus = (current: OrderStatus) => {
    const flow = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.COMPLETED];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      
      {/* Sticky Kitchen Notification (Marquee) */}
      {config.kitchenNotificationText && (
        <div className="sticky top-0 z-50 bg-red-600 text-white text-lg font-bold py-3 overflow-hidden whitespace-nowrap shadow-md border-b-2 border-red-800 no-print flex items-center justify-between pr-4">
           <div className="animate-marquee inline-block px-4 flex-1">
             <Bell size={20} className="inline mr-2 mb-1 text-yellow-300" />
             {config.kitchenNotificationText}
           </div>
        </div>
      )}

      <div className="p-4 no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ChefHat /> Bếp - {config.storeName}
            </h1>
            
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

          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Tìm mã đơn..." 
                 className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="bg-white px-4 py-2 rounded-lg shadow text-sm whitespace-nowrap flex items-center">
              Đang xử lý: <span className="font-bold text-orange-500 ml-1">{orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedOrders.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">Không tìm thấy đơn hàng nào.</div>
          )}
          {sortedOrders.map(order => (
            <div key={order.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-500 ${order.status === OrderStatus.PENDING ? 'ring-2 ring-yellow-400 shadow-yellow-200' : ''}`}>
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">#{order.id.slice(-4).toUpperCase()}</span>
                  <span className="text-xs text-gray-500 block">{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto max-h-60">
                <div className="mb-2 text-sm bg-blue-50 p-2 rounded">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <span className="truncate">{order.customerName}</span>
                  </div>
                  <div className="text-blue-700 text-xs mt-1 flex items-center gap-1">
                    {order.contactMethod}: <span className="font-mono">{order.contactValue}</span>
                  </div>
                  {order.deliveryAddress && (
                    <div className="text-gray-600 text-xs mt-1 border-t border-blue-200 pt-1">
                      📍 {order.deliveryAddress}
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm border-b border-dashed pb-2 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                      </div>
                      {item.selectedToppings.length > 0 && (
                        <div className="text-xs text-gray-500 pl-4">
                          + {item.selectedToppings.map(t => t.name).join(', ')}
                        </div>
                      )}
                      {item.note && <div className="text-xs text-red-500 italic pl-4">Note: {item.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
              
              {order.status === OrderStatus.CANCELLED && order.cancelReason && (
                <div className="px-3 py-2 bg-red-50 text-red-700 text-xs italic border-t border-red-100">
                  Lý do hủy: {order.cancelReason}
                </div>
              )}

              <div className="p-3 bg-gray-50 border-t space-y-2">
                 <div className="flex justify-between items-center text-sm font-bold mb-2">
                   <span>Tổng tiền:</span>
                   <span>{formatPrice(order.totalAmount).usd}</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handlePrint(order)}
                    className="flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Printer size={16} /> In Bill
                  </button>
                  
                  {nextStatus(order.status) && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, nextStatus(order.status)!)}
                      className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {order.status === OrderStatus.PENDING ? 'Xác nhận' : 
                       order.status === OrderStatus.CONFIRMED ? 'Chế biến' : 'Hoàn tất'}
                    </button>
                  )}
                 </div>

                 {order.status === OrderStatus.PENDING && (
                    <button 
                      onClick={() => handleCancel(order.id)}
                      className="w-full text-red-500 text-xs hover:underline mt-1"
                    >
                      Hủy đơn hàng
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hidden Receipt Component for Printing */}
      <Receipt order={printingOrder} />
    </div>
  );
};

export default StaffView;