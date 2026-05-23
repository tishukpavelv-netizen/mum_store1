import { createContext, useState } from 'react';
import toast from 'react-hot-toast'; // ДОБАВЛЕНО

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
          toast.error(`Разместить больше нельзя. На складе осталось всего: ${product.stock} шт.`);
          return prevCart;
        }
        // Уведомление, если товар уже был, но мы увеличили его количество
        toast.success(`Ещё одна "${product.title}" добавлена в корзину!`);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      // Если товара вообще нет на складе
      if (product.stock <= 0) {
        toast.error("Извините, этого товара нет в наличии.");
        return prevCart;
      }

      // Уведомление при первом добавлении (как на вашем скриншоте)
      toast.success(`"${product.title}" добавлен в корзину!`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
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
              toast.error(`Невозможно добавить больше. Доступный остаток: ${item.stock} шт.`);
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
    toast.success("Товар удален из корзины"); // Добавлено приятное уведомление
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};