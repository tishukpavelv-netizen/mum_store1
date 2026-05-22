import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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
        // Сохраняем токен и обновляем контекст
        localStorage.setItem('token', data.token);
        login(data.user);
        navigate('/'); // Перекидываем на главную
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вход</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" placeholder="Email" required
          className="input-field"
          value={email} onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Пароль" required
          className="input-field"
          value={password} onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="btn-primary">Войти</button>
      </form>
    </div>
  );
};