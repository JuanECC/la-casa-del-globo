import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION = 'clients';

export const getClients = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addClient = async (client) => {
  return addDoc(collection(db, COLLECTION), client);
};

export const updateClient = async (id, client) => {
  const ref = doc(db, COLLECTION, id);
  return updateDoc(ref, client);
};

export const deleteClient = async (id) => {
  const ref = doc(db, COLLECTION, id);
  return deleteDoc(ref);
};