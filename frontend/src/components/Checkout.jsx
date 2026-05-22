import React from 'react';

export const Checkout = ({ cartTotal }) => {
    const handlePayment = () => {
        // Требование: заглушка платежной системы
        alert("ВНИМАНИЕ: Здесь находится кнопка для подключения платежной системы (например, Stripe или YooKassa). Платежи пока не настроены.");
        
        // Тут будет fetch запрос на /api/orders
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Оформление заказа</h2>
            <p>Итого к оплате: {cartTotal} руб.</p>
            <button 
                onClick={handlePayment}
                style={{ background: '#4CAF50', color: 'white', padding: '10px 20px', cursor: 'pointer' }}
            >
                Оплатить заказ
            </button>
        </div>
    );
};