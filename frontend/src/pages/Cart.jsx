import { useContext } from 'react';
import { CartContext } from '../context/CartContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handlePayment = async () => {
    if (!user) return toast.error("Вы должны войти в систему для оплаты заказа!");
    if (cart.length === 0) return toast.error("Ваша корзина пуста!");
    
    const token = localStorage.getItem('token');
    
    // ИЗМЕНЕНИЕ: Теперь мы сохраняем "слепок" товара для истории
    const orderItems = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      title: item.title, // Сохраняем имя
      price: item.price, // Сохраняем цену на момент покупки
      image: item.image_urls && item.image_urls[0] ? item.image_urls[0] : null // Сохраняем главную картинку
    }));

    const paymentToast = toast.loading('Обработка заказа...');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ total, items: orderItems })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Заказ #00${data.orderId} успешно оформлен и оплачен!`, { id: paymentToast, duration: 5000 });
        clearCart(); 
      } else {
        toast.error(`Ошибка: ${data.error || "Не удалось совершить покупку"}`, { id: paymentToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка при обработке платежа сервером.", { id: paymentToast });
    }
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '20px', marginTop: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '26px', marginBottom: '20px' }}>Корзина</h2>
      
      {cart.length === 0 ? (
        <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>В корзине пока пусто. Самое время что-нибудь выбрать!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
          {cart.map((item) => (
            <li 
              key={item.id} 
              style={{ 
                borderBottom: '1px solid #f0f0f0', 
                padding: '20px 0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}
            >
              <div style={{ flex: '1', minWidth: '200px' }}>
                <span style={{ fontWeight: '600', fontSize: '16px' }}>{item.title}</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  {item.price} ₽ / шт. <span style={{ color: '#10b981' }}>(доступно: {item.stock} шт.)</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f4f6f8', padding: '6px 12px', borderRadius: '10px' }}>
                <button 
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', padding: '0 5px' }}
                >
                  −
                </button>
                <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', padding: '0 5px' }}
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <strong style={{ fontSize: '18px', minWidth: '90px', textAlign: 'right' }}>
                  {item.price * item.quantity} ₽
                </strong>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ef4444' }}
                  title="Удалить из корзины"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div style={{ marginTop: '35px', padding: '25px', background: '#f8f9fc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Детали заказа</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0' }}>
          <span style={{ color: 'var(--text-muted)' }}>Итого к оплате:</span>
          <strong style={{ fontSize: '24px', color: 'var(--wb-purple)' }}>{total} ₽</strong>
        </div>
        
        <button 
          onClick={handlePayment}
          className="btn-primary"
          style={{ 
            marginTop: '10px',
            background: (cart.length > 0 && user) ? 'var(--gradient-primary)' : '#cbd5e1', 
            cursor: (cart.length > 0 && user) ? 'pointer' : 'not-allowed' 
          }}
          disabled={cart.length === 0 || !user}
        >
          {!user ? "Войдите в аккаунт для оплаты" : "Оплатить заказ"}
        </button>
      </div>
    </div>
  );
};