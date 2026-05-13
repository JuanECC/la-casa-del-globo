import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';

const COLLECTION = 'customOrders';

export const getOrders = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addOrder = async (order) => {
  return addDoc(collection(db, COLLECTION), order);
};

export const updateOrder = async (id, order) => {
  const ref = doc(db, COLLECTION, id);
  return updateDoc(ref, order);
};

export const deleteOrder = async (id) => {
  const ref = doc(db, COLLECTION, id);
  return deleteDoc(ref);
};
export const completeOrder = async (orderId, paymentData) => {
  const orderRef = doc(db, COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    // 1. Leer el pedido
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error('El pedido no existe');
    const order = orderSnap.data();

    if (!order.items || order.items.length === 0) {
      throw new Error('El pedido no tiene productos asociados');
    }

    // 2. Leer todos los productos involucrados (solo lecturas)
    const productSnapshots = [];
    for (const item of order.items) {
      const productRef = doc(db, 'products', item.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) throw new Error(`Producto ${item.name} no encontrado`);
      productSnapshots.push({ item, ref: productRef, data: snap.data() });
    }

    // 3. Verificar stock suficiente (sin escribir)
    for (const { item, data } of productSnapshots) {
      const currentStock = data.stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${currentStock}, Necesario: ${item.quantity}`);
      }
    }

    // 4. Ahora sí, todas las escrituras
    // Descontar stock
    for (const { item, ref, data } of productSnapshots) {
      const newStock = (data.stock || 0) - item.quantity;
      transaction.update(ref, { stock: newStock });
    }

    // Actualizar pedido como entregado
    transaction.update(orderRef, {
      status: 'entregado',
      completedAt: new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived || 0,
      change: paymentData.change || 0,
    });

    // Crear venta
    const saleData = {
      items: order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: (item.quantity || 0) * (item.unitPrice || 0),
        newStock: 0
      })),
      subtotal: order.total || 0,
      discount: 0,
      total: order.total || 0,
      paymentMethod: paymentData.paymentMethod,
      cashReceived: paymentData.cashReceived || 0,
      change: paymentData.change || 0,
      userId: paymentData.userId,
      userEmail: paymentData.userEmail,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
      ticketNumber: `PED-${orderId.slice(0, 6)}`,
      clientName: order.clientName,
      phone: order.phone,
      orderId: orderId,
    };

    const salesRef = collection(db, 'sales');
    const newSaleRef = doc(salesRef);
    transaction.set(newSaleRef, saleData);
  });

  return { success: true };
};