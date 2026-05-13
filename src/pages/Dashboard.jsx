import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import {
  DollarSign, Calendar, Package, ShoppingCart,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#FFD6E8', '#DDF4FF', '#E8D9FF', '#FFF4C2', '#DDFBE6', '#FFD1DC', '#C4E0F9'];

const toDateString = (value) => {
  if (!value) return '';
  let date;
  if (value.toDate) date = value.toDate();
  else if (value instanceof Date) date = value;
  else if (typeof value === 'string') date = new Date(value);
  else return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const nombre = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCount: 0,
    monthSales: 0,
    monthCount: 0,
    pendingOrders: 0,
    upcomingEvents: [],
    lowStock: [],
    eventTypeData: [], // para gráfico de pastel
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Ventas
      const salesSnap = await getDocs(collection(db, 'sales'));
      const sales = salesSnap.docs.map(d => ({
        ...d.data(),
        dateStr: d.data().date || toDateString(d.data().createdAt),
      }));

      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);

      const todaySales = sales.filter(s => s.dateStr === today);
      const monthSales = sales.filter(s => s.dateStr?.startsWith(currentMonth));

      const todayTotal = todaySales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
      const monthTotal = monthSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

      // Pedidos
      const ordersSnap = await getDocs(collection(db, 'customOrders'));
      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const pendingOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'en proceso').length;

      // Pedidos próximos 7 días (solo pendientes/en proceso)
      const todayDate = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(todayDate.getDate() + 7);
      const upcomingEvents = orders
        .filter(o => {
          if (o.status !== 'pendiente' && o.status !== 'en proceso') return false;
          if (!o.eventDate) return false;
          const eventDate = new Date(o.eventDate + 'T00:00:00');
          return eventDate >= todayDate && eventDate <= sevenDaysLater;
        })
        .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))
        .slice(0, 5);

      // Datos para gráfico de tipos de evento (solo pedidos activos)
      const activeOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'en proceso');
      const eventCounts = {};
      activeOrders.forEach(o => {
        const type = o.eventType || 'otro';
        eventCounts[type] = (eventCounts[type] || 0) + 1;
      });
      const eventTypeData = Object.entries(eventCounts).map(([name, value]) => ({ name, value }));

      // Productos con stock bajo
      const productsSnap = await getDocs(collection(db, 'products'));
      const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lowStock = products.filter(p => p.stock <= (p.minStock || 5));

      setStats({
        todaySales: todayTotal,
        todayCount: todaySales.length,
        monthSales: monthTotal,
        monthCount: monthSales.length,
        pendingOrders,
        upcomingEvents,
        lowStock,
        eventTypeData,
      });
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => `$${Number(amount).toFixed(0)}`;

  if (loading) {
    return (
      <div className="text-center text-texto-suave py-20 text-xl">
        🎈 Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <h2 className="text-3xl font-bold text-texto-suave">
        🎈 Buen día, {nombre}
      </h2>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-rosa/30 p-2 rounded-full">
              <DollarSign size={20} className="text-rosa-oscuro" />
            </div>
            <p className="text-xs text-texto-suave">Ventas hoy</p>
          </div>
          <p className="text-2xl font-bold text-texto-suave">{formatCurrency(stats.todaySales)}</p>
          <p className="text-xs text-gray-400">{stats.todayCount} ventas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-cielo/30 p-2 rounded-full">
              <DollarSign size={20} className="text-blue-500" />
            </div>
            <p className="text-xs text-texto-suave">Ventas del mes</p>
          </div>
          <p className="text-2xl font-bold text-texto-suave">{formatCurrency(stats.monthSales)}</p>
          <p className="text-xs text-gray-400">{stats.monthCount} ventas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amarillo/30 p-2 rounded-full">
              <ShoppingCart size={20} className="text-yellow-600" />
            </div>
            <p className="text-xs text-texto-suave">Pedidos activos</p>
          </div>
          <p className="text-2xl font-bold text-texto-suave">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-400">Por completar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <p className="text-xs text-texto-suave">Stock bajo</p>
          </div>
          <p className="text-2xl font-bold text-texto-suave">{stats.lowStock.length}</p>
          <p className="text-xs text-gray-400">Productos</p>
        </div>
      </div>

      {/* Segunda fila: gráfico de eventos + próximos pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pastel: pedidos por tipo de evento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Pedidos por tipo
          </h3>
          {stats.eventTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.eventTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {stats.eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} pedido(s)`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #FFD6E8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No hay pedidos activos</p>
          )}
        </div>

        {/* Próximos pedidos (7 días) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2">
            <Calendar size={20} /> Próximos 7 días
          </h3>
          <div className="space-y-3">
            {stats.upcomingEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay eventos próximos</p>
            ) : (
              stats.upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-rosa/5 rounded-xl">
                  <div>
                    <p className="font-medium text-texto-suave text-sm">{event.clientName}</p>
                    <p className="text-xs text-gray-400">
                      {event.eventType} • {event.eventDate}
                      {event.eventTime && ` a las ${event.eventTime}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-rosa-oscuro">
                    {formatCurrency(event.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {stats.lowStock.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
            <Package size={20} /> Productos con stock bajo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.lowStock.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-medium text-texto-suave text-sm">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.brand}</p>
                </div>
                <span className="text-lg font-bold text-red-500">{product.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}