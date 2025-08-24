export const generateOrderNumber = () => {
  const now = Date.now().toString(); // timestamp
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${now}-${rand}`;
};