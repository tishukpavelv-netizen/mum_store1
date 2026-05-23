import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        toast.success("Успешная регистрация! Теперь вы можете войти.");
        navigate('/login');
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка регистрации");
      }
    } catch (err) {
      toast.error("Ошибка соединения с сервером");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div className="card" style={{ width: '100%', padding: '50px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>✨</div>
        <h2 style={{ marginBottom: '30px', color: 'var(--text-main)' }}>Создать аккаунт</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" placeholder="Укажите Email" required
            className="input-field" style={{ margin: 0 }}
            value={email} onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" placeholder="Придумайте пароль" required
            className="input-field" style={{ margin: 0 }}
            value={password} onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Зарегистрироваться</button>
        </form>

        <p style={{ marginTop: '25px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--wb-purple)', fontWeight: 'bold', textDecoration: 'none' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
};