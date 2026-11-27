import { useEffect, useState } from 'react';

const KEY = 'crm-items-v1';

export function useItems() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Не удалось прочитать данные', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Не удалось сохранить данные', e);
    }
  }, [items]);

  const addItem = (item) =>
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID?.() || String(Date.now() + Math.random()) }]);

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  return { items, addItem, updateItem, removeItem };
}
