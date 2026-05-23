import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        toast.success(`С возвращением, ${data.user.email}!`);
        navigate('/');
      } else {
        toast.error(data.error || "Ошибка входа");
      }
    } catch (err) {
      toast.error("Ошибка соединения с сервером");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div className="card" style={{ width: '100%', padding: '50px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
        <h2 style={{ marginBottom: '30px', color: 'var(--text-main)' }}>Вход в аккаунт</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" placeholder="Ваш Email" required
            className="input-field" style={{ margin: 0 }}
            value={email} onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" placeholder="Пароль" required
            className="input-field" style={{ margin: 0 }}
            value={password} onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Войти</button>
        </form>

        <p style={{ marginTop: '25px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Еще нет аккаунта? <Link to="/register" style={{ color: 'var(--wb-purple)', fontWeight: 'bold', textDecoration: 'none' }}>Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  );
};