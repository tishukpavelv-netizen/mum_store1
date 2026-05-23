import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/products')
      ]);

      if (ordersRes.ok && productsRes.ok) {
        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();
        setOrders(ordersData);
        setProducts(productsData);
      } else {
        toast.error("Не удалось загрузить данные профиля");
      }
    } catch (err) {
      toast.error("Ошибка сети при загрузка данных");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto' }}>
      <div className="card" style={{ maxWidth: '100%', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px', padding: '30px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Мой профиль</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>{user.email} • {user.role === 'admin' ? 'Администратор' : 'Покупатель'}</p>
        </div>
      </div>

      <h3 style={{ marginBottom: '20px' }}>📦 Мои заказы</h3>
      
      {loading ? (
        <p>Загрузка истории...</p>
      ) : orders.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛍️</div>
          <p>Вы пока не сделали ни одного заказа.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Заказ #00{order.id}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                    {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--wb-purple)' }}>{order.total} ₽</div>
                  <div style={{ display: 'inline-block', padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>
                    {order.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items && Array.isArray(order.items) && order.items.map((item, idx) => {
                  // Ищем товар в актуальной базе (на случай если это старый заказ без слепка)
                  const currentProduct = products.find(p => p.id === item.id);
                  
                  // ИСПОЛЬЗУЕМ СЛЕПОК ДАННЫХ, если он есть (новые заказы), 
                  // иначе берем из базы (старые заказы), иначе заглушка
                  const itemTitle = item.title || (currentProduct ? currentProduct.title : 'Неизвестный товар (удален)');
                  const itemPrice = item.price || (currentProduct ? currentProduct.price : '???');
                  
                  let itemImg = item.image;
                  if (!itemImg) {
                    itemImg = currentProduct && currentProduct.image_urls && currentProduct.image_urls[0] 
                      ? currentProduct.image_urls[0] 
                      : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=100';
                  }

                  // Слегка затемняем удаленные из каталога товары для понимания
                  const isDeleted = !currentProduct && !item.title;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: isDeleted ? '#fff1f2' : '#f8f9fc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <img 
                        src={itemImg} 
                        alt="" 
                        style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '8px', background: '#e2e8f0' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: isDeleted ? '#be123c' : 'var(--text-main)' }}>
                          {itemTitle}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Количество: <strong style={{ color: 'var(--text-main)' }}>{item.quantity} шт.</strong>
                          {itemPrice !== '???' && ` • ${itemPrice} ₽ / шт.`}
                        </div>
                        {isDeleted && <div style={{ fontSize: '11px', color: '#be123c', marginTop: '4px' }}>Товар был снят с продажи</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};