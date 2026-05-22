import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        alert("Успешная регистрация! Теперь вы можете войти.");
        navigate('/login');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Регистрация</h2>
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
        <button type="submit" className="btn-primary">Зарегистрироваться</button>
      </form>
    </div>
  );
};