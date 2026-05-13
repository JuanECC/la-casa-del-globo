 import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION = 'products';

export const getProducts = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProduct = async (product) => {
  return addDoc(collection(db, COLLECTION), product);
};

export const updateProduct = async (id, product) => {
  const ref = doc(db, COLLECTION, id);
  return updateDoc(ref, product);
};

export const deleteProduct = async (id) => {
  const ref = doc(db, COLLECTION, id);
  return deleteDoc(ref);
};