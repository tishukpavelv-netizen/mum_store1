import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Считаем ОБЩЕЕ количество предметов в корзине (сумма всех quantity)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        
        <Link to="/" className="nav-logo">
          <div className="logo-icon">🍼</div>
          MomStore
        </Link>

        {/* Раскрывающийся поиск */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

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