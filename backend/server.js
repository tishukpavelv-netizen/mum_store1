const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: "Неверный или просроченный токен" });
    req.user = user; 
    next();
  });
};

// --- РОУТЫ ---

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role',
      [email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: "Email уже занят" });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      let adminResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      let adminId;
      if (adminResult.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await pool.query(
          "INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin') RETURNING id",
          [email, hashedPassword]
        );
        adminId = newAdmin.rows[0].id;
      } else {
        adminId = adminResult.rows[0].id;
      }
      const token = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
      return res.json({ token, user: { id: adminId, email: email, role: 'admin' } });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Неверный пароль" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить все товары
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ДОБАВИТЬ ТОВАР (Админ)
app.post('/api/products', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Нет прав" });
  const { title, description, price, stock, image_urls } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (title, description, price, stock, image_urls) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, price, stock, image_urls || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ИЗМЕНИТЬ ТОВАР (Админ)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Нет прав" });
  const { id } = req.params;
  const { title, description, price, stock, image_urls } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET title=$1, description=$2, price=$3, stock=$4, image_urls=$5 WHERE id=$6 RETURNING *',
      [title, description, price, stock, image_urls || [], id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Товар не найден" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// УДАЛИТЬ ТОВАР (Админ)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Нет прав" });
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Товар не найден" });
    res.json({ message: "Товар успешно удален", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ОФОРМЛЕНИЕ И ОПЛАТА ЗАКАЗА (ИСПРАВЛЕНО)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { total, items } = req.body; 
  try {
    await pool.query('BEGIN');
    
    // Сохраняем заказ, включая сериализованный JSON-массив товаров в поле items
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total, items) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, total, JSON.stringify(items)]
    );
    const orderId = orderResult.rows[0].id;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const prodCheck = await pool.query('SELECT stock FROM products WHERE id = $1', [item.id]);
        
        // ЗАЩИТА: Проверяем, существует ли вообще запись о товаре в БД
        if (prodCheck.rows.length === 0) {
          throw new Error(`Один из товаров в вашей корзине (ID: ${item.id}) был удален администратором. Пожалуйста, очистите корзину.`);
        }

        if (prodCheck.rows[0].stock < item.quantity) {
          throw new Error("Недостаточно товара на складе!");
        }
        
        await pool.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      }
    }
    await pool.query('COMMIT');
    res.status(201).json({ message: "Успешно", orderId });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));