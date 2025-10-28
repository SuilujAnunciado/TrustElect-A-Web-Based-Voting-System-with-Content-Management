
const generateUniqueCode = (receiptId) => {
  if (!receiptId) return 'N/A';
  
  console.log('Generating unique code from receipt ID:', receiptId);
  
  let hash = 0;
  for (let i = 0; i < receiptId.length; i++) {
    const char = receiptId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const absHash = Math.abs(hash);
  const base36 = absHash.toString(36).toUpperCase();
  
  let code = base36.substring(0, 6);
  if (code.length < 6) {
    const padded = (absHash * 31).toString(36).toUpperCase();
    code = (code + padded).substring(0, 6);
  }
  
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (code.length < 6) {
    const randomIndex = Math.abs(hash + code.length) % alphanumeric.length;
    code += alphanumeric[randomIndex];
  }
  
  const finalCode = code.substring(0, 6);
  console.log('Generated unique code:', finalCode);
  
  return finalCode;
};

module.exports = {
  generateUniqueCode
};
