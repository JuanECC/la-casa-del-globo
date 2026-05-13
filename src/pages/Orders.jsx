import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { getOrders, addOrder, updateOrder, deleteOrder, completeOrder } from '../services/orders';
import { getClients, addClient } from '../services/clients';
import { getProducts } from '../services/products';
import { useAuth } from '../hooks/useAuth';
import {
  Calendar, Phone, Clock, Search, Mail, X, AlertTriangle,
  Plus, Minus, Package, ShoppingCart, Banknote, CreditCard, Smartphone,
  Pencil, Trash2, CheckCircle, Eye, ArrowLeft
} from 'lucide-react';
import Ticket from '../components/pos/Ticket';

const EVENT_TYPES = [
  'cumpleaños', 'aniversario', 'graduación', 'baby shower',
  'boda', 'sorpresa', 'otro'
];

const STATUSES = ['pendiente', 'en proceso', 'entregado', 'cancelado'];

const paymentIcons = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Smartphone,
};

const initialForm = {
  clientId: '',
  clientName: '',
  phone: '',
  email: '',
  eventType: 'cumpleaños',
  eventDate: '',
  eventTime: '',
  address: '',
  description: '',
  items: [],
  advance: '',
  remaining: '',
  total: '',
  status: 'pendiente',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  // Panel derecho de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // nueva categoría

  // Modal de cobro
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Ticket
  const [lastSale, setLastSale] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketWidth, setTicketWidth] = useState('58mm');
  const ticketRef = useRef();

  // Modal de detalle de productos
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  // Modal de eliminar
  const [modal, setModal] = useState({ show: false, type: '', orderId: null, orderName: '' });

  useEffect(() => {
    loadOrders();
    loadClients();
    loadProducts();
  }, []);

  // ---------------- Carga de datos (con normalización de tipos) ----------------
  const loadOrders = async () => {
    setLoading(true);
    const data = await getOrders();
    const normalized = data.map(order => ({
      ...order,
      items: (order.items || []).map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        subtotal: Number(item.subtotal) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      })),
      total: Number(order.total) || 0,
      advance: Number(order.advance) || 0,
      remaining: Number(order.remaining) || 0,
    }));
    setOrders(normalized);
    setLoading(false);
  };

  const loadClients = async () => {
    const data = await getClients();
    setClients(data);
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setAllProducts(data);
  };

  // ---------------- Impresión del ticket ----------------
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${lastSale?.ticketNumber || 'pedido'}`,
  });

  // ---------------- Buscador de productos (para el panel derecho) ----------------
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();

  const searchProducts = (term) => {
    setProductSearchTerm(term);
    if (!term.trim()) {
      setFilteredProducts([]);
      return;
    }
    const results = allProducts.filter(p =>
      p.name?.toLowerCase().includes(term.toLowerCase()) ||
      p.sku?.toLowerCase().includes(term.toLowerCase()) ||
      p.brand?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(results);
  };

  // Obtener productos filtrados por búsqueda y categoría
  const getFilteredProducts = () => {
    let results = allProducts;
    const term = productSearchTerm.toLowerCase();
    if (term) {
      results = results.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      );
    }
    if (selectedCategory) {
      results = results.filter(p => p.category === selectedCategory);
    }
    return results;
  };

  const addItemToOrder = (product) => {
    const items = [...(form.items || [])];
    const existingIndex = items.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      items[existingIndex].quantity += 1;
      items[existingIndex].subtotal = items[existingIndex].quantity * items[existingIndex].unitPrice;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        sku: product.sku || '',
        quantity: 1,
        unitPrice: product.salePrice,
        subtotal: product.salePrice,
      });
    }
    setForm({ ...form, items });
    setProductSearchTerm('');
    setFilteredProducts([]);
    setShowProductSelector(false);
  };

  const removeItemFromOrder = (index) => {
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  };

  const updateItemQuantity = (index, delta) => {
    const items = [...form.items];
    const newQty = items[index].quantity + delta;
    if (newQty < 1) return;
    items[index].quantity = newQty;
    items[index].subtotal = newQty * items[index].unitPrice;
    setForm({ ...form, items });
  };

  const calculateTotalFromItems = () => {
    const itemsTotal = (form.items || []).reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    setForm({
      ...form,
      total: itemsTotal.toString(),
      remaining: (itemsTotal - (parseFloat(form.advance) || 0)).toString()
    });
  };

  const calculateRemaining = (total, advance) => {
    const t = parseFloat(total) || 0;
    const a = parseFloat(advance) || 0;
    return (t - a).toString();
  };

  const handleFormChange = (field, value) => {
    const newForm = { ...form, [field]: value };
    if (field === 'total' || field === 'advance') {
      newForm.remaining = calculateRemaining(
        field === 'total' ? value : newForm.total,
        field === 'advance' ? value : newForm.advance
      );
    }
    setForm(newForm);
  };

  // ---------------- Selección de cliente ----------------
  const handleClientSelect = (clientId) => {
    if (clientId === 'new') {
      setShowNewClient(true);
      setForm({ ...form, clientId: '', clientName: '', phone: '', email: '' });
    } else if (clientId) {
      setShowNewClient(false);
      const client = clients.find(c => c.id === clientId);
      setForm({
        ...form,
        clientId: client.id,
        clientName: client.name,
        phone: client.phone || '',
        email: client.email || ''
      });
    } else {
      setShowNewClient(false);
      setForm({ ...form, clientId: '', clientName: '', phone: '', email: '' });
    }
  };

  // ---------------- Guardar pedido (crear/editar) ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalClientId = form.clientId;

    if (showNewClient && form.clientName) {
      const newClient = await addClient({
        name: form.clientName,
        phone: form.phone,
        email: form.email,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      });
      finalClientId = newClient.id;
    }

    const orderData = {
      clientId: finalClientId,
      clientName: form.clientName,
      phone: form.phone,
      email: form.email,
      eventType: form.eventType,
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      address: form.address,
      description: form.description,
      items: (form.items || []).map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        subtotal: Number(item.subtotal) || 0,
      })),
      advance: parseFloat(form.advance) || 0,
      remaining: parseFloat(form.remaining) || 0,
      total: parseFloat(form.total) || 0,
      status: form.status,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      await updateOrder(editingId, orderData);
      setEditingId(null);
    } else {
      await addOrder(orderData);
    }
    setForm(initialForm);
    setShowNewClient(false);
    loadOrders();
    loadClients();
  };

  // ---------------- Editar pedido existente ----------------
  const handleEdit = (order) => {
    setEditingId(order.id);
    setForm({
      clientId: order.clientId || '',
      clientName: order.clientName,
      phone: order.phone,
      email: order.email || '',
      eventType: order.eventType,
      eventDate: order.eventDate,
      eventTime: order.eventTime,
      address: order.address,
      description: order.description,
      items: (order.items || []).map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        subtotal: Number(item.subtotal) || 0,
      })),
      advance: order.advance?.toString() || '',
      remaining: order.remaining?.toString() || '',
      total: order.total?.toString() || '',
      status: order.status,
    });
    setShowNewClient(false);
  };

  // ---------------- Eliminar pedido ----------------
  const handleDelete = async (id) => {
    await deleteOrder(id);
    loadOrders();
  };

  // ---------------- Cambiar estado manualmente ----------------
  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrder(orderId, { status: newStatus });
    loadOrders();
  };

  // ---------------- Abrir modal de cobro ----------------
  const openPaymentModal = (order) => {
    setPayingOrder(order);
    setPaymentMethod('efectivo');
    setCashReceived('');
    setShowPaymentModal(true);
  };

  // ---------------- Ejecutar cobro y finalizar pedido (CORREGIDO) ----------------
  const handleCompleteOrder = async () => {
    if (!payingOrder) return;
    const total = Number(payingOrder.total) || 0;
    const advance = Number(payingOrder.advance) || 0;
    const remaining = total - advance;
    const amountToPay = remaining > 0 ? remaining : total;

    if (paymentMethod === 'efectivo') {
      const received = parseFloat(cashReceived) || 0;
      if (received < amountToPay) {
        alert(`El efectivo recibido es menor al restante (${amountToPay.toFixed(2)}).`);
        return;
      }
    }

    setProcessingPayment(true);
    try {
      const change = paymentMethod === 'efectivo'
        ? (parseFloat(cashReceived) || 0) - amountToPay
        : 0;

      await completeOrder(payingOrder.id, {
        paymentMethod,
        cashReceived: amountToPay,
        change,
        userId: user.uid,
        userEmail: user.email,
      });

      const saleData = {
        items: (payingOrder.items || []).map(item => ({
          name: item.name,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        subtotal: total,
        discount: 0,
        total: total,
        paymentMethod,
        cashReceived: amountToPay,
        change,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        ticketNumber: `PED-${payingOrder.id.slice(0, 6)}`,
        clientName: payingOrder.clientName,
      };

      setLastSale(saleData);
      setShowPaymentModal(false);
      setShowTicket(true);
      setPayingOrder(null);
      loadOrders();
      loadProducts();
    } catch (error) {
      alert(error.message);
    }
    setProcessingPayment(false);
  };

  // ---------------- Modal de confirmación para eliminar ----------------
  const confirmDelete = (order) => {
    setModal({ show: true, type: 'delete', orderId: order.id, orderName: order.clientName });
  };

  // ---------------- Colores de estado ----------------
  const getStatusColor = (status) => {
    const colors = {
      'pendiente': 'bg-amarillo/30 text-yellow-700',
      'en proceso': 'bg-cielo/30 text-blue-700',
      'entregado': 'bg-menta/30 text-green-700',
      'cancelado': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100';
  };

  // ---------------- Filtro de pedidos ----------------
  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    const matchSearch =
      o.clientName?.toLowerCase().includes(term) ||
      o.phone?.includes(term) ||
      o.eventType?.toLowerCase().includes(term);
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const remainingToPay = payingOrder
    ? (Number(payingOrder.total) || 0) - (Number(payingOrder.advance) || 0)
    : 0;

  const change = paymentMethod === 'efectivo' && cashReceived
    ? (parseFloat(cashReceived) || 0) - remainingToPay
    : 0;

  // Productos a mostrar en el panel (combinando búsqueda y categoría)
  const panelProducts = (() => {
    if (productSearchTerm) {
      return filteredProducts; // los resultados de la búsqueda en tiempo real
    }
    if (selectedCategory) {
      return allProducts.filter(p => p.category === selectedCategory);
    }
    return [];
  })();

  // ---------------- Render principal con panel derecho de productos ----------------
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-texto-suave flex items-center gap-2">
        <Calendar size={30} /> Pedidos personalizados
      </h2>

      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Columna izquierda: formulario del pedido */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="md:col-span-2">
                <label className="block text-xs text-texto-suave mb-1 ml-1">Cliente *</label>
                <select value={showNewClient ? 'new' : form.clientId} onChange={(e) => handleClientSelect(e.target.value)} className="input-pastel" required>
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.phone}</option>))}
                  <option value="new">+ Nuevo cliente</option>
                </select>
              </div>

              {showNewClient && (
                <>
                  <div><label className="block text-xs text-texto-suave mb-1 ml-1">Nombre *</label><input type="text" value={form.clientName} onChange={e => handleFormChange('clientName', e.target.value)} className="input-pastel" required /></div>
                  <div><label className="block text-xs text-texto-suave mb-1 ml-1">Teléfono</label><input type="text" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} className="input-pastel" /></div>
                  <div><label className="block text-xs text-texto-suave mb-1 ml-1">Email</label><input type="email" value={form.email} onChange={e => handleFormChange('email', e.target.value)} className="input-pastel" /></div>
                </>
              )}

              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Tipo de evento</label><select value={form.eventType} onChange={e => handleFormChange('eventType', e.target.value)} className="input-pastel">{EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Fecha *</label><input type="date" value={form.eventDate} onChange={e => handleFormChange('eventDate', e.target.value)} className="input-pastel" required /></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Hora</label><input type="time" value={form.eventTime} onChange={e => handleFormChange('eventTime', e.target.value)} className="input-pastel" /></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Dirección</label><input type="text" value={form.address} onChange={e => handleFormChange('address', e.target.value)} className="input-pastel" /></div>
              <div className="md:col-span-2"><label className="block text-xs text-texto-suave mb-1 ml-1">Descripción</label><textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} className="input-pastel" rows="2" /></div>

              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Total ($)</label><input type="number" value={form.total} onChange={e => handleFormChange('total', e.target.value)} className="input-pastel" min="0" /></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Anticipo ($)</label><input type="number" value={form.advance} onChange={e => handleFormChange('advance', e.target.value)} className="input-pastel" min="0" /></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Restante</label><input type="number" value={form.remaining} readOnly className="input-pastel bg-gray-50" /></div>
              <div><label className="block text-xs text-texto-suave mb-1 ml-1">Estado</label><select value={form.status} onChange={e => handleFormChange('status', e.target.value)} className="input-pastel">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-rosa-oscuro hover:bg-rosa text-white px-6 py-2 rounded-full transition-colors shadow-md">
                {editingId ? 'Guardar cambios' : 'Crear pedido'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); setShowNewClient(false); }} className="bg-gray-200 hover:bg-gray-300 text-texto-suave px-6 py-2 rounded-full transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Columna derecha: productos del pedido (estilo carrito con categorías) */}
        <div className="w-96 bg-white rounded-2xl shadow-sm border border-rosa/20 p-4 flex flex-col">
          <h3 className="text-lg font-bold text-texto-suave mb-3 flex items-center gap-2">
            <ShoppingCart size={20} /> Productos ({form.items?.length || 0})
          </h3>

          {/* Buscador de productos */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              onFocus={() => setShowProductSelector(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (panelProducts.length > 0) {
                    addItemToOrder(panelProducts[0]);
                  }
                }
              }}
              className="input-pastel pr-10"
            />
            <Search size={16} className="absolute right-3 top-3 text-gray-400" />
          </div>

          {/* Cuadritos de categorías (si no hay búsqueda ni categoría seleccionada) */}
          {!selectedCategory && !productSearchTerm && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white hover:bg-rosa/10 border border-rosa/20 rounded-2xl p-3 text-center transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-xl block mb-1">
                    {cat === 'globos' ? '🎈' :
                     cat === 'arreglos' ? '💐' :
                     cat === 'peluches' ? '🧸' :
                     cat === 'regalos' ? '🎁' :
                     cat === 'decoraciones' ? '✨' :
                     cat === 'accesorios' ? '🎀' :
                     cat === 'velas' ? '🕯️' :
                     cat === 'cajas sorpresa' ? '📦' :
                     cat === 'brillos' ? '✨' : '📌'}
                  </span>
                  <span className="text-xs font-medium text-texto-suave capitalize">{cat}</span>
                </button>
              ))}
            </div>
          )}

          {/* Botón para regresar a categorías */}
          {(selectedCategory || productSearchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setProductSearchTerm('');
                setFilteredProducts([]);
              }}
              className="flex items-center gap-2 text-xs text-rosa-oscuro hover:underline mb-2"
            >
              <ArrowLeft size={14} />
              Todas las categorías
            </button>
          )}

          {/* Resultados de productos */}
          {(selectedCategory || productSearchTerm) && (
            <div className="bg-white border border-rosa/20 rounded-xl shadow-sm max-h-40 overflow-y-auto mb-3">
              {panelProducts.length > 0 ? (
                panelProducts.map(p => (
                  <div
                    key={p.id}
                    className="px-3 py-2 hover:bg-rosa/5 cursor-pointer flex justify-between items-center text-sm"
                    onClick={() => addItemToOrder(p)}
                  >
                    <span>{p.name} <span className="text-xs text-gray-400">({p.sku})</span></span>
                    <span className="text-rosa-oscuro font-medium">${p.salePrice}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4 text-sm">No hay productos</p>
              )}
            </div>
          )}

          {/* Lista de items agregados */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {(form.items && form.items.length > 0) ? (
              form.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-rosa/5 p-2 rounded-lg text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">${Number(item.unitPrice || 0).toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => updateItemQuantity(idx, -1)} className="p-1 hover:bg-rosa/20 rounded"><Minus size={14} /></button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateItemQuantity(idx, 1)} className="p-1 hover:bg-rosa/20 rounded"><Plus size={14} /></button>
                  </div>
                  <p className="w-20 text-right font-medium">${Number(item.subtotal || 0).toFixed(2)}</p>
                  <button type="button" onClick={() => removeItemFromOrder(idx)} className="ml-2 text-red-400"><X size={16} /></button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Sin productos</p>
            )}
          </div>

          <button
            type="button"
            onClick={calculateTotalFromItems}
            className="text-xs text-rosa-oscuro underline hover:no-underline mb-2"
          >
            Calcular total desde productos
          </button>
        </div>
      </div>

      {/* ========== FILTROS Y TABLA ========== */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input-pastel flex-1" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-pastel">
          <option value="">Todos los estados</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-rosa/20">
        <table className="min-w-full text-texto-suave text-sm">
          <thead className="bg-rosa/10">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Evento</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Restante</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4 text-center">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center">No hay pedidos</td></tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="border-b border-rosa/10 hover:bg-rosa/5">
                  <td className="p-3">
                    <p className="font-medium">{o.clientName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> {o.phone}</p>
                  </td>
                  <td className="p-3">{o.eventType}</td>
                  <td className="p-3 text-xs">
                    <p className="flex items-center gap-1"><Calendar size={12} /> {o.eventDate}</p>
                    {o.eventTime && <p className="flex items-center gap-1"><Clock size={12} /> {o.eventTime}</p>}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">${Number(o.total || 0).toFixed(2)}</p>
                    {Number(o.advance) > 0 && <p className="text-xs text-gray-400">Ant: ${Number(o.advance).toFixed(2)}</p>}
                  </td>
                  <td className="p-3">
                    {Number(o.remaining) > 0 ? (
                      <span className="text-rosa-oscuro font-medium">${Number(o.remaining).toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle size={14} /> Pagado</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer appearance-none text-center pr-6 bg-no-repeat ${getStatusColor(o.status)}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555'%3E%3Cpath d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundPosition: 'right 6px center' }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setDetailOrder(o); setShowDetailModal(true); }} className="p-1.5 rounded-lg hover:bg-rosa/10 text-texto-suave transition-colors" title="Ver productos">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEdit(o)} className="p-1.5 rounded-lg hover:bg-rosa/10 text-rosa-oscuro transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => confirmDelete(o)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                      {(o.status === 'pendiente' || o.status === 'en proceso') && o.items && o.items.length > 0 && (
                        <button onClick={() => openPaymentModal(o)} className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1" title="Cobrar pedido">
                          <CheckCircle size={14} /> Cobrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========== MODAL DE DETALLE DE PRODUCTOS ========== */}
      {showDetailModal && detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg animate-in">
            <div className="bg-rosa/10 px-6 py-4 flex justify-between items-center border-b border-rosa/20">
              <h3 className="text-lg font-bold text-texto-suave flex items-center gap-2">
                <Package size={20} /> Productos del pedido
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-texto-suave hover:text-rosa-oscuro">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              <p className="text-sm text-texto-suave font-medium">{detailOrder.clientName}</p>
              {(detailOrder.items && detailOrder.items.length > 0) ? (
                detailOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-rosa/10 pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} x ${Number(item.unitPrice || 0).toFixed(2)} c/u
                      </p>
                    </div>
                    <p className="font-bold text-rosa-oscuro">${Number(item.subtotal || 0).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Sin productos registrados</p>
              )}
              <div className="border-t border-rosa/20 pt-2 flex justify-between font-bold text-texto-suave">
                <span>Total pedido</span>
                <span>${Number(detailOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALES (COBRO, TICKET, ELIMINAR) ========== */}
      {showPaymentModal && payingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg animate-in">
            <div className="bg-rosa/10 px-6 py-4 flex justify-between items-center border-b border-rosa/20">
              <h3 className="text-lg font-bold text-texto-suave flex items-center gap-2"><ShoppingCart size={22} /> Cobrar pedido</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-texto-suave hover:text-rosa-oscuro"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-texto-suave">{payingOrder.clientName}</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-texto-suave">${Number(payingOrder.total || 0).toFixed(2)}</span>
                  {Number(payingOrder.advance) > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Anticipo: ${Number(payingOrder.advance).toFixed(2)}</p>
                      <p className="text-lg font-semibold text-rosa-oscuro">Resta: ${remainingToPay.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-texto-suave mb-2">Método de pago</label>
                <div className="grid grid-cols-3 gap-3">
                  {['efectivo', 'tarjeta', 'transferencia'].map(method => {
                    const Icon = paymentIcons[method];
                    const isActive = paymentMethod === method;
                    return (
                      <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive ? 'border-rosa-oscuro bg-rosa/20 text-rosa-oscuro' : 'border-gray-200 bg-white text-texto-suave hover:border-rosa/30'}`}>
                        <Icon size={24} /><span className="text-xs mt-1 capitalize">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="block text-xs text-texto-suave mb-1">Efectivo recibido</label>
                  <input type="number" placeholder="0.00" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="input-pastel text-lg font-bold text-center" min="0" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
                  {change > 0 && <p className="text-green-600 font-medium text-center mt-2 text-lg">Cambio: ${change.toFixed(2)}</p>}
                  {change < 0 && <p className="text-red-500 text-center mt-2">Faltan ${Math.abs(change).toFixed(2)}</p>}
                  {change === 0 && cashReceived && <p className="text-green-600 font-medium text-center mt-2">Pago exacto</p>}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-texto-suave py-3 rounded-full font-medium">Cancelar</button>
                <button onClick={handleCompleteOrder} disabled={processingPayment} className="flex-1 bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium shadow-md disabled:opacity-50">{processingPayment ? 'Procesando...' : 'Confirmar cobro'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTicket && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-texto-suave">🧾 Ticket del pedido</h3>
              <div className="flex gap-2">
                <select value={ticketWidth} onChange={(e) => setTicketWidth(e.target.value)} className="text-sm border rounded-lg px-2 py-1">
                  <option value="58mm">58mm</option><option value="80mm">80mm</option>
                </select>
                <button onClick={handlePrint} className="bg-rosa-oscuro text-white px-4 py-2 rounded-full text-sm">🖨️ Imprimir</button>
                <button onClick={() => setShowTicket(false)} className="bg-gray-200 text-texto-suave px-4 py-2 rounded-full text-sm">Cerrar</button>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl flex justify-center overflow-x-auto">
              <Ticket ref={ticketRef} sale={lastSale} width={ticketWidth} />
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <div className="flex items-center gap-3 mb-4"><div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={24} className="text-red-500" /></div><div><h3 className="font-bold text-texto-suave">¿Eliminar pedido?</h3><p className="text-sm text-gray-500">{modal.orderName}</p></div></div>
            <p className="text-sm text-texto-suave mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal({ show: false })} className="px-4 py-2 rounded-full text-sm text-texto-suave hover:bg-gray-100">Cancelar</button>
              <button onClick={() => { handleDelete(modal.orderId); setModal({ show: false }); }} className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}