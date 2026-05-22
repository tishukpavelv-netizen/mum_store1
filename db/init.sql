CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_urls TEXT[], -- ИСПРАВЛЕНО: теперь это массив строк (TEXT[]), как и ожидает бэкенд
    stock INTEGER NOT NULL DEFAULT 0 
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Оплачен',
    items JSONB, -- ДОБАВЛЕНО: поле для хранения состава заказа (массива купленных товаров)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестовые товары с указанием количества на складе
INSERT INTO products (title, description, price, stock) VALUES 
('Подушка для беременных', 'Удобная U-образная подушка для комфортного сна', 2500, 12),
('Молокоотсос электронный', 'Бесшумный, 2 фазы сцеживания', 4500, 5),
('Слинг-шарф', 'Натуральный хлопок, подходит с рождения', 1800, 2),
('Сумка в роддом', 'Прозрачная моющаяся сумка (готовый набор)', 3200, 0);