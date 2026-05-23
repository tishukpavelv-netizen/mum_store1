import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data))
      .catch(err => console.error("Ошибка загрузки товаров для поиска", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(val.trim().length > 0);

    // Мгновенно обновляем каталог, если мы на главной странице
    if (location.pathname === '/') {
      navigate(val.trim() ? `/?q=${encodeURIComponent(val)}` : '/', { replace: true });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  const handlePreviewClick = (title) => {
    setSearchQuery(title);
    setShowDropdown(false);
    navigate(`/?q=${encodeURIComponent(title)}`);
  };

  const searchResults = allProducts
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5); // Показываем максимум 5 подсказок

  return (
    <nav className="nav">
      <div className="container nav-inner">
        
        <Link to="/" className="nav-logo">
          <div className="logo-icon">🍼</div>
          MomStore
        </Link>

        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <form 
            className={`search-form ${isSearchOpen ? 'active' : ''}`} 
            onSubmit={handleSearchSubmit}
          >
            <button 
              type="button" 
              className="search-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Поиск"
            >
              🔍
            </button>
            <input 
              type="text" 
              className={`nav-search ${isSearchOpen ? 'expanded' : ''}`} 
              placeholder="Искать товары..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { 
                setIsSearchOpen(true); 
                if (searchQuery.trim().length > 0) setShowDropdown(true); 
              }}
            />
          </form>

          {showDropdown && isSearchOpen && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((product) => (
                <div 
                  key={product.id} 
                  className="search-dropdown-item"
                  onClick={() => handlePreviewClick(product.title)}
                >
                  <img 
                    src={product.image_urls && product.image_urls[0] ? product.image_urls[0] : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=100'} 
                    alt={product.title} 
                  />
                  <div className="search-dropdown-info">
                    <div className="search-dropdown-title">{product.title}</div>
                    <div className="search-dropdown-price">{product.price} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-links">
          {user && user.role === 'admin' && (
            <Link to="/admin">
              <span style={{fontSize: '22px'}}>⚙️</span> Админка
            </Link>
          )}
          
          <Link to="/cart" style={{ position: 'relative' }}>
            <span style={{fontSize: '22px'}}>🛒</span>
            Корзина
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '10px',
                background: '#ff0000', color: 'white',
                borderRadius: '50%', padding: '2px 6px',
                fontSize: '11px', fontWeight: 'bold'
              }}>
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/profile">
                <span style={{fontSize: '22px'}}>👤</span> Профиль
              </Link>
              <button onClick={handleLogout}>
                <span style={{fontSize: '22px'}}>🚪</span> Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <span style={{fontSize: '22px'}}>🔑</span> Вход
              </Link>
              <Link to="/register">
                <span style={{fontSize: '22px'}}>📝</span> Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};