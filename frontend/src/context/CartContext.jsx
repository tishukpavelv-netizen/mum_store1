import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Добавление товара с проверкой остатка в БД
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Если в корзине уже лежит максимум того, что есть на складе
        if (existingItem.quantity >= product.stock) {
          alert(`Разместить больше нельзя. На складе осталось всего: ${product.stock} шт.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      // Если товара вообще нет на складе
      if (product.stock <= 0) {
        alert("Извините, этого товара нет в наличии.");
        return prevCart;
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
    alert(`"${product.title}" добавлен в корзину!`);
  };

  // Изменение количества через кнопки +/- с проверкой лимита склада
  const updateQuantity = (productId, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + amount;
            
            // Если пытаемся нажать "+" выше доступного на складе
            if (amount > 0 && newQty > item.stock) {
              alert(`Невозможно добавить больше. Доступный остаток: ${item.stock} шт.`);
              return item;
            }
            
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};