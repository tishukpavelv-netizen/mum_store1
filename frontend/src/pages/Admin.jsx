import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Admin = () => {
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('add'); 
  const [products, setProducts] = useState([]);
  
  const [editingId, setEditingId] = useState(null); 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState(['']); 
  const [localFiles, setLocalFiles] = useState([]); 

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => toast.error("Ошибка загрузки товаров"));
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => setImages([...images, '']);
  const removeImageField = (index) => setImages(images.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const cleanImages = images.filter(url => url.trim() !== '');

    let uploadedUrls = [];
    
    if (localFiles.length > 0) {
      const formData = new FormData();
      localFiles.forEach(file => formData.append('photos', file));
      
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrls = uploadData.urls;
        } else {
          return toast.error("Ошибка при загрузке фотографий");
        }
      } catch (error) {
        return toast.error("Ошибка сети при загрузке фото");
      }
    }

    const finalImages = [...cleanImages, ...uploadedUrls];
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, price: Number(price), stock: Number(stock), image_urls: finalImages })
      });
      
      if (res.ok) {
        toast.success(editingId ? "Товар успешно обновлен!" : "Товар успешно добавлен!");
        resetForm();
        setActiveTab('manage');
      } else {
        const err = await res.json();
        toast.error(err.error || "Ошибка при сохранении");
      }
    } catch (err) {
      toast.error("Ошибка сети при сохранении товара");
    }
  };

  // --- ИСПРАВЛЕНО: КРАСИВОЕ УВЕДОМЛЕНИЕ ДЛЯ УДАЛЕНИЯ ---
  const confirmDelete = (id) => {
    toast(
      (t) => (
        <div style={{ padding: '5px' }}>
          <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '15px' }}>Вы точно хотите удалить этот товар?</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                executeDelete(id);
              }}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Да, удалить
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)}
              style={{ background: '#f1f5f9', color: 'var(--text-main)', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Отмена
            </button>
          </div>
        </div>
      ),
      { 
        duration: 8000, 
        position: 'top-center',
        style: { border: '1px solid #f87171' } // Добавляем красную рамку для акцента
      }
    );
  };

  // Сама логика удаления, которая вызывается, если нажали "Да"
  const executeDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        toast.success("Товар успешно удален с витрины.");
      } else {
        const errData = await res.json();
        toast.error(`Не удалось удалить: ${errData.error || "Ошибка сервера"}`);
      }
    } catch (err) {
      toast.error("Ошибка сети. Не удалось связаться с бэкендом.");
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price);
    setStock(product.stock);
    setImages(product.image_urls && product.image_urls.length > 0 ? product.image_urls : ['']);
    setLocalFiles([]);
    setActiveTab('add');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('');
    setImages(['']);
    setLocalFiles([]);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto' }}>
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

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fc', borderRadius: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Загрузить локальные фотографии:</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={e => setLocalFiles(Array.from(e.target.files))} 
                className="input-field" 
                style={{ background: 'white', cursor: 'pointer', padding: '10px' }}
              />
              {localFiles.length > 0 && (
                <p style={{ fontSize: '13px', color: '#10b981', marginTop: '5px' }}>Выбрано файлов: {localFiles.length}</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Или вставьте ссылки из интернета:</label>
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
                          {/* ИСПРАВЛЕНО ЗДЕСЬ: вызываем функцию confirmDelete вместо старой handleDelete */}
                          <button onClick={() => confirmDelete(p.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Удалить</button>
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