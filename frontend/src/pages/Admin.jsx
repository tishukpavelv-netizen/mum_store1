import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const Admin = () => {
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('add'); // 'add' или 'manage'
  const [products, setProducts] = useState([]);
  
  // Поля формы
  const [editingId, setEditingId] = useState(null); 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState(['']); 

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  // Управление массивом картинок
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => setImages([...images, '']);
  const removeImageField = (index) => setImages(images.filter((_, i) => i !== index));

  // Сохранение / Изменение
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const cleanImages = images.filter(url => url.trim() !== '');

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, price: Number(price), stock: Number(stock), image_urls: cleanImages })
      });
      
      if (res.ok) {
        alert(editingId ? "Товар успешно обновлен!" : "Товар успешно добавлен!");
        resetForm();
        setActiveTab('manage');
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка при сохранении");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // УДАЛЕНИЕ ТОВАРА (Теперь с выводом ошибок сервера)
  const handleDelete = async (id) => {
    if (!window.confirm("Вы точно хотите удалить этот товар с концами?")) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Если сервер удалил, убираем товар из списка на экране
        setProducts(products.filter(p => p.id !== id));
        alert("Товар успешно удален с витрины.");
      } else {
        // Если сервер вернул ошибку (например, 401 или 403)
        const errData = await res.json();
        alert(`Не удалось удалить: ${errData.error || "Ошибка сервера"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети. Не удалось связаться с бэкендом.");
    }
  };

  // Включение режима редактирования
  const startEdit = (product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price);
    setStock(product.stock);
    setImages(product.image_urls && product.image_urls.length > 0 ? product.image_urls : ['']);
    setActiveTab('add');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('');
    setImages(['']);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto' }}>
      {/* Навигация панели */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button 
          className="btn-primary" 
          style={{ background: activeTab === 'add' ? 'var(--gradient-primary)' : '#cbd5e1', width: 'auto' }}
          onClick={() => { setActiveTab('add'); if(!editingId) resetForm(); }}
        >
          {editingId ? "📝 Редактирование" : "➕ Добавить товар"}
        </button>
        <button 
          className="btn-primary" 
          style={{ background: activeTab === 'manage' ? 'var(--gradient-primary)' : '#cbd5e1', width: 'auto' }}
          onClick={() => { setActiveTab('manage'); resetForm(); }}
        >
          📋 Управление витриной ({products.length})
        </button>
      </div>

      {/* ВКЛАДКА 1: ФОРМА */}
      {activeTab === 'add' && (
        <div className="card" style={{ maxWidth: '100%', margin: 0 }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--wb-purple)' }}>
            {editingId ? `Редактирование товара #${editingId}` : "Новая карточка товара"}
          </h2>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Название" required className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea placeholder="Описание" required className="input-field" style={{ minHeight: '80px', fontFamily: 'inherit' }} value={description} onChange={e => setDescription(e.target.value)} />
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="number" placeholder="Цена (₽)" required className="input-field" value={price} onChange={e => setPrice(e.target.value)} />
              <input type="number" placeholder="Количество на склад" required className="input-field" value={stock} onChange={e => setStock(e.target.value)} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Ссылки на фотографии:</label>
              {images.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="text" placeholder={`Ссылка на фото #${idx + 1}`} className="input-field" style={{ margin: 0 }}
                    value={url} onChange={e => handleImageChange(idx, e.target.value)} 
                  />
                  {images.length > 1 && (
                    <button type="button" onClick={() => removeImageField(idx)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0 15px', borderRadius: '12px', cursor: 'pointer' }}>❌</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addImageField} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '5px' }}>
                + Добавить еще ссылку на фото
              </button>
            </div>

            <button type="submit" className="btn-primary">{editingId ? "Сохранить изменения" : "Выкатить на маркетплейс"}</button>
          </form>
        </div>
      )}

      {/* ВКЛАДКА 2: ТАБЛИЦА ТОВАРОВ */}
      {activeTab === 'manage' && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '20px' }}>Все товары в базе данных</h2>
          {products.length === 0 ? <p>Товары отсутствуют.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', height: '40px', color: 'var(--text-muted)' }}>
                    <th>Фото</th>
                    <th>Название</th>
                    <th>Цена</th>
                    <th>Склад</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5', height: '60px' }}>
                      <td>
                        <img 
                          src={p.image_urls && p.image_urls[0] ? p.image_urls[0] : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=100'} 
                          alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginTop: '5px' }} 
                        />
                      </td>
                      <td style={{ fontWeight: '600' }}>{p.title}</td>
                      <td>{p.price} ₽</td>
                      <td style={{ color: p.stock > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{p.stock} шт.</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => startEdit(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Изменить</button>
                          <button onClick={() => handleDelete(p.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};