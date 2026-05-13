import { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '../services/clients';
import { Phone, Mail, ShoppingBag, Search, UserPlus } from 'lucide-react';

const initialForm = {
  name: '',
  phone: '',
  email: '',
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientData = {
      ...form,
      totalPurchases: editingId ? undefined : 0,
      createdAt: new Date().toISOString(),
    };
    if (editingId) {
      const { totalPurchases, createdAt, ...updateData } = clientData;
      await updateClient(editingId, updateData);
      setEditingId(null);
    } else {
      await addClient(clientData);
    }
    setForm(initialForm);
    loadClients();
  };

  const handleEdit = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este cliente?')) {
      await deleteClient(id);
      loadClients();
    }
  };

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-texto-suave flex items-center gap-2">
        <UserPlus size={30} /> Clientes
      </h2>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-texto-suave mb-1 ml-1">Nombre *</label>
            <input type="text" placeholder="Nombre completo" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="input-pastel" required />
          </div>
          <div>
            <label className="block text-xs text-texto-suave mb-1 ml-1">Teléfono</label>
            <input type="text" placeholder="5551234567" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="input-pastel" />
          </div>
          <div>
            <label className="block text-xs text-texto-suave mb-1 ml-1">Email</label>
            <input type="email" placeholder="cliente@email.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="input-pastel" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-rosa-oscuro hover:bg-rosa text-white px-6 py-2 rounded-full transition-colors shadow-md">
            {editingId ? 'Guardar cambios' : 'Agregar cliente'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}
              className="bg-gray-200 hover:bg-gray-300 text-texto-suave px-6 py-2 rounded-full transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input type="text" placeholder="Buscar cliente..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none text-texto-suave" />
      </div>

      {/* Tabla de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center text-gray-400">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center text-gray-400">No hay clientes registrados</p>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-texto-suave text-lg">{c.name}</h3>
                <span className="bg-rosa/20 text-rosa-oscuro text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ShoppingBag size={12} /> {c.totalPurchases || 0}
                </span>
              </div>
              <div className="space-y-2 text-sm text-texto-suave">
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" /> {c.phone}
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" /> {c.email}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-rosa/10">
                <button onClick={() => handleEdit(c)} className="text-rosa-oscuro hover:underline text-xs">
                  Editar
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:underline text-xs">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}