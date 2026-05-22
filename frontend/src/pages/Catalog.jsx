import { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

const getImagesArray = (product) => {
  if (product.image_urls && product.image_urls.length > 0) {
    return product.image_urls;
  }
  // Заглушки, если картинок вообще нет
  const titleLower = product.title.toLowerCase();
  if (titleLower.includes('подушка')) return ['https://images.unsplash.com/photo-1629215160822-0d17e7ce71c6?w=600'];
  if (titleLower.includes('молокоотсос')) return ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600'];
  if (titleLower.includes('слинг')) return ['https://images.unsplash.com/photo-1522771930-78848d9287dd?w=600'];
  if (titleLower.includes('сумка')) return ['https://images.unsplash.com/photo-1555244406-38f32860b0ec?w=600'];
  return ['https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600'];
};

export const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeImgIdx, setActiveImgIdx] = useState(0); // Активная картинка в галерее
  
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext); 
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ошибка загрузки:", err));
  }, []);

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return product.title.toLowerCase().includes(query) || 
           (product.description && product.description.toLowerCase().includes(query));
  });

  // --- РЕЖИМ 1: ПОДРОБНОЕ ОПИСАНИЕ ТОВАРА (ГАЛЕРЕЯ С МИНИАТЮРАМИ WB) ---
  if (selectedProduct) {
    const productImages = getImagesArray(selectedProduct);
    const isAvailable = selectedProduct.stock > 0;

    return (
      <div style={{ background: 'white', padding: '30px', borderRadius: '20px', marginTop: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn-primary" 
          style={{ width: 'auto', marginBottom: '25px', padding: '10px 20px', background: '#333' }}
          onClick={() => { setSelectedProduct(null); setActiveImgIdx(0); }}
        >
          ← Назад в каталог
        </button>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Блок галереи WB */}
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Вертикальный ряд миниатюр */}
            {productImages.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {productImages.map((imgUrl, idx) => (
                  <img 
                    key={idx} src={imgUrl} alt="" 
                    style={{ 
                      width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                      border: activeImgIdx === idx ? '2px solid var(--wb-purple)' : '2px solid transparent',
                      opacity: activeImgIdx === idx ? 1 : 0.6
                    }}
                    onMouseEnter={() => setActiveImgIdx(idx)}
                    onClick={() => setActiveImgIdx(idx)}
                  />
                ))}
              </div>
            )}
            
            {/* Главное большое фото */}
            <div style={{ width: '340px', height: '450px', borderRadius: '12px', overflow: 'hidden', background: '#f8f9fc' }}>
              <img src={productImages[activeImgIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          
          {/* Информационный блок */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{selectedProduct.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Бренд: MomStore</p>
            
            <div style={{ fontSize: '14px', fontWeight: '600', color: isAvailable ? '#10b981' : '#ef4444', marginBottom: '15px' }}>
              {isAvailable ? `В наличии на складе: ${selectedProduct.stock} шт.` : 'Нет в наличии'}
            </div>

            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--wb-purple)', marginBottom: '25px' }}>
              {selectedProduct.price} ₽
            </div>
            
            <div style={{ marginBottom: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Описание товара</h3>
              <p style={{ lineHeight: '1.6', color: '#555', whiteSpace: 'pre-wrap' }}>
                {selectedProduct.description}
              </p>
            </div>

            <button 
              className="btn-primary"
              style={{ maxWidth: '300px', background: (user && isAvailable) ? 'var(--gradient-primary)' : '#cbd5e1', cursor: (user && isAvailable) ? 'pointer' : 'not-allowed' }}
              onClick={() => user ? addToCart(selectedProduct) : alert("Пожалуйста, авторизуйтесь.")}
              disabled={!user || !isAvailable}
            >
              {!user ? "Войдите для покупки" : !isAvailable ? "Нет в наличии" : "Добавить в корзину"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- РЕЖИМ 2: СЕТКА КАТАЛОГА ---
  return (
    <div>
      <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>
        {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Хиты продаж'}
      </h2>
      
      {filteredProducts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Ничего не найдено 😔</p>
      ) : (
        <div className="catalog-grid">
          {filteredProducts.map(product => {
            const productImages = getImagesArray(product);
            const isAvailable = product.stock > 0;

            return (
              <div key={product.id} className="product-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
                <div className="product-image-placeholder" style={{ padding: 0, background: 'transparent' }}>
                  <img src={productImages[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="product-price">{product.price} ₽</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: isAvailable ? '#10b981' : '#ef4444' }}>
                    {isAvailable ? `${product.stock} шт.` : 'Ожидается'}
                  </div>
                </div>

                <div className="product-title">
                  <strong>MomStore</strong> / {product.title}
                </div>
                
                <button 
                  className="btn-primary"
                  style={{ background: (user && isAvailable) ? 'var(--gradient-primary)' : '#cbd5e1', cursor: (user && isAvailable) ? 'pointer' : 'not-allowed' }}
                  disabled={!user || !isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  {!user ? "Нужен вход" : !isAvailable ? "Закончился" : "В корзину"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};