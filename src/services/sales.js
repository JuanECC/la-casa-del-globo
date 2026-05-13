import { db } from '../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export const createSale = async (saleData) => {
  // Agregar la venta
  const saleRef = await addDoc(collection(db, 'sales'), saleData);
  
  // Actualizar stock de cada producto
  for (const item of saleData.items) {
    const productRef = doc(db, 'products', item.productId);
    await updateDoc(productRef, {
      stock: item.newStock
    });
  }
  
  return saleRef.id;
};