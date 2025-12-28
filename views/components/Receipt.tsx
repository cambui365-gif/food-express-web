import React from 'react';
import { Order } from '../types';
import { useStore } from '../services/store';

interface ReceiptProps {
  order: Order | null;
}

const Receipt: React.FC<ReceiptProps> = ({ order }) => {
  const { formatPrice, config } = useStore();

  if (!order) return null;

  const prices = formatPrice(order.totalAmount);

  return (
    <div id="printable-receipt" className="hidden print:block fixed top-0 left-0 w-full h-full bg-white z-[9999]">
      <div className="w-[80mm] mx-auto p-2 font-mono text-xs text-black leading-tight">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold uppercase">{config.storeName}</h2>
          <p className="whitespace-pre-wrap px-4">{config.storeAddress}</p>
          <p className="mt-1 font-bold">Hotline: {config.storePhone}</p>
          <div className="border-b-2 border-dashed border-black my-2"></div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-bold mb-1">HÓA ĐƠN THANH TOÁN</p>
          <p><strong>Mã ĐH:</strong> #{order.id.slice(-4).toUpperCase()}</p>
          <p><strong>Ngày:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          
          <div className="mt-2 border border-gray-300 p-1 rounded">
             {order.customerName && <p><strong>Khách:</strong> {order.customerName}</p>}
             {order.contactValue && <p><strong>LH:</strong> {order.contactValue}</p>}
             {order.deliveryAddress && (
               <p className="mt-1 border-t border-dashed border-gray-300 pt-1">
                 <strong>Đ/C:</strong> {order.deliveryAddress}
               </p>
             )}
          </div>
        </div>

        <div className="border-b-2 border-dashed border-black my-2"></div>

        <table className="w-full text-left mb-4">
          <thead>
            <tr>
              <th className="pb-2">Món</th>
              <th className="pb-2 text-right">SL</th>
              <th className="pb-2 text-right">$$</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="pb-2 pr-2">
                  <div className="font-bold">{item.name}</div>
                  {item.selectedToppings.length > 0 && (
                    <div className="text-[10px] text-gray-600">
                      + {item.selectedToppings.map(t => t.name).join(', ')}
                    </div>
                  )}
                  {item.note && <div className="text-[10px] italic">({item.note})</div>}
                </td>
                <td className="pb-2 text-right">{item.quantity}</td>
                <td className="pb-2 text-right">
                  ${(item.price * item.quantity + item.selectedToppings.reduce((acc, t) => acc + t.price, 0) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-b-2 border-dashed border-black my-2"></div>

        <div className="flex justify-between font-bold text-lg">
          <span>TỔNG USD:</span>
          <span>{prices.usd}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Quy đổi KHR:</span>
          <span>{prices.khr}</span>
        </div>
         <div className="flex justify-between text-sm mt-1">
          <span>Quy đổi VND:</span>
          <span>{prices.vnd}</span>
        </div>

        <div className="text-center text-[10px] mt-6 italic">
          <p>Cảm ơn quý khách đã ủng hộ!</p>
          <p>Hẹn gặp lại!</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;