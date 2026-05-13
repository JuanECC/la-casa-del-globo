import { useState, useEffect, useRef, forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import {
  DollarSign, Calendar, Package, TrendingUp,
  Printer, RefreshCw, Lightbulb, Star
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Ticket from '../components/pos/Ticket';

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

// Helpers de formato
const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

// Componente del ticket del corte del día con ganancias
const CutTicket = forwardRef(({ sales, date, productsMap }, ref) => {
  if (!sales || sales.length === 0) return null;

  let totalGeneral = 0;
  let totalGanancia = 0;

  // Calcular ganancia por venta
  const salesWithProfit = sales.map(sale => {
    const total = parseFloat(sale.total) || 0;
    let ganancia = 0;
    (sale.items || []).forEach(item => {
      const product = productsMap[item.productId];
      const costo = product ? (parseFloat(product.purchasePrice) || 0) : 0;
      const cantidad = parseInt(item.quantity) || 0;
      ganancia += (parseFloat(item.unitPrice) - costo) * cantidad;
    });
    totalGeneral += total;
    totalGanancia += ganancia;
    return { ...sale, ganancia };
  });

  const breakdown = sales.reduce((acc, s) => {
    const method = s.paymentMethod || 'otro';
    acc[method] = (acc[method] || 0) + (parseFloat(s.total) || 0);
    return acc;
  }, {});

  return (
    <div ref={ref} style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', width: '80mm', margin: '0 auto', backgroundColor: 'white', color: 'black' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>🎈 La Casa del Globo</p>
        <p style={{ fontSize: '10px', fontStyle: 'italic', margin: '0 0 4px' }}>"Inflamos sonrisas"</p>
        <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0' }}>CORTE DEL DÍA</p>
        <p style={{ fontSize: '10px', margin: '0' }}>{date}</p>
      </div>
      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {salesWithProfit.map((sale, idx) => (
        <div key={sale.id || idx} style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
            <span>Ticket #{sale.ticketNumber || idx + 1}</span>
            <span>{sale.paymentMethod} - {new Date(sale.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {(sale.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', paddingLeft: '4px' }}>
              <span>{item.quantity}x {item.name}</span>
              <span>{formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', paddingLeft: '4px' }}>
            <span>Ganancia venta</span>
            <span>{formatCurrency(sale.ganancia)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', borderBottom: '1px dotted #eee', paddingBottom: '2px' }}>
            <span>Total venta</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      <div style={{ marginBottom: '8px' }}>
        {Object.entries(breakdown).map(([method, amount]) => (
          <div key={method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>{method}:</span>
            <span>{formatCurrency(amount)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>
          <span>GANANCIA DEL DÍA</span>
          <span>{formatCurrency(totalGanancia)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '4px', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
          <span>TOTAL GENERAL</span>
          <span>{formatCurrency(totalGeneral)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>¡Gracias por tu trabajo! ✨</p>
      </div>
    </div>
  );
});
CutTicket.displayName = 'CutTicket';

// Componente del ticket mensual
const MonthlyCutTicket = forwardRef(({ dailyData, monthName, totalGeneral, totalGanancia }, ref) => {
  if (!dailyData || dailyData.length === 0) return null;
  return (
    <div ref={ref} style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', width: '80mm', margin: '0 auto', backgroundColor: 'white', color: 'black' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>🎈 La Casa del Globo</p>
        <p style={{ fontSize: '10px', fontStyle: 'italic', margin: '0 0 4px' }}>"Inflamos sonrisas"</p>
        <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0' }}>CORTE MENSUAL</p>
        <p style={{ fontSize: '10px', margin: '0' }}>{monthName}</p>
      </div>
      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {dailyData.map(day => (
        <div key={day.day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
          <span>{new Date(day.day + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span>{day.count} ventas</span>
          <span>{formatCurrency(day.total)}</span>
          <span style={{ fontWeight: 'bold' }}>G: {formatCurrency(day.ganancia)}</span>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>
        <span>TOTAL VENTAS</span>
        <span>{formatCurrency(totalGeneral)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
        <span>GANANCIA DEL MES</span>
        <span>{formatCurrency(totalGanancia)}</span>
      </div>
      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <p style={{ margin: '0', fontSize: '10px' }}>✨ ¡Mes completado con éxito!</p>
      </div>
    </div>
  );
});
MonthlyCutTicket.displayName = 'MonthlyCutTicket';

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const cutRef = useRef();
  const monthlyCutRef = useRef();
  const ticketRef = useRef();
  const [selectedSale, setSelectedSale] = useState(null);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [salesSnap, ordersSnap, clientsSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'customOrders')),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'products')),
      ]);
      const salesData = salesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        dateStr: d.data().date || toDateString(d.data().createdAt)
      }));
      const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const clientsData = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const map = {};
      productsData.forEach(p => { map[p.id] = p; });

      setSales(salesData);
      setOrders(ordersData);
      setClients(clientsData);
      setProducts(productsData);
      setProductsMap(map);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handlePrintCut = useReactToPrint({ contentRef: cutRef, documentTitle: 'Corte_del_dia' });
  const handlePrintMonthlyCut = useReactToPrint({ contentRef: monthlyCutRef, documentTitle: 'Corte_mensual' });
  const handlePrintTicket = useReactToPrint({ contentRef: ticketRef, documentTitle: `Ticket_${selectedSale?.ticketNumber || 'venta'}` });

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  // Función para calcular ganancia de una venta
  const calcProfit = (sale) => {
    let ganancia = 0;
    (sale.items || []).forEach(item => {
      const product = productsMap[item.productId];
      const costo = product ? (parseFloat(product.purchasePrice) || 0) : 0;
      ganancia += (parseFloat(item.unitPrice) - costo) * (parseInt(item.quantity) || 0);
    });
    return ganancia;
  };

  // Ventas del día
  const todaySales = sales.filter(s => s.dateStr === today);
  const todayTotal = todaySales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const todayCount = todaySales.length;
  const todayProfit = todaySales.reduce((sum, s) => sum + calcProfit(s), 0);

  const paymentBreakdown = todaySales.reduce((acc, s) => {
    const method = s.paymentMethod || 'otro';
    acc[method] = (acc[method] || 0) + (parseFloat(s.total) || 0);
    return acc;
  }, {});

  // Ventas del mes
  const monthSales = sales.filter(s => s.dateStr?.startsWith(currentMonth));
  const monthTotal = monthSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const monthProfit = monthSales.reduce((sum, s) => sum + calcProfit(s), 0);

  // Historial mensual (ventas diarias con ganancia)
  const dailyTotals = {};
  monthSales.forEach(s => {
    const day = s.dateStr;
    if (!dailyTotals[day]) dailyTotals[day] = { total: 0, count: 0, ganancia: 0 };
    dailyTotals[day].total += parseFloat(s.total) || 0;
    dailyTotals[day].count += 1;
    dailyTotals[day].ganancia += calcProfit(s);
  });
  const dailyArray = Object.entries(dailyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => ({ day, ...values }));

  // Top productos más vendidos del mes (con ganancia)
  const productSales = {};
  monthSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const key = item.name || item.productId;
      if (!productSales[key]) productSales[key] = { name: key, quantity: 0, total: 0, ganancia: 0 };
      productSales[key].quantity += Number(item.quantity) || 0;
      productSales[key].total += Number(item.subtotal) || (Number(item.quantity) * Number(item.unitPrice)) || 0;
      const product = productsMap[item.productId];
      const costo = product ? (parseFloat(product.purchasePrice) || 0) : 0;
      productSales[key].ganancia += (parseFloat(item.unitPrice) - costo) * (parseInt(item.quantity) || 0);
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.quantity)) : 1;

  // Pedidos activos
  const activeOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'en proceso');
  const eventCounts = {};
  activeOrders.forEach(o => { const t = o.eventType || 'otro'; eventCounts[t] = (eventCounts[t] || 0) + 1; });
  const pieData = Object.entries(eventCounts).map(([name, value]) => ({ name, value }));

  // Sugerencias de clientes
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const recentClientIds = new Set(
    orders.filter(o => new Date(o.createdAt) >= twoMonthsAgo).map(o => o.clientId).filter(Boolean)
  );
  const suggestedClients = clients.filter(c => !recentClientIds.has(c.id)).slice(0, 5);

  const lowStock = products.filter(p => p.stock <= (p.minStock || 5));

  const monthName = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });

  if (loading) return <div className="text-center py-20 text-texto-suave text-xl">🎈 Cargando reportes...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-texto-suave flex items-center gap-2"><TrendingUp size={30} /> Reportes</h2>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2"><div className="bg-rosa/30 p-2 rounded-full"><DollarSign size={20} className="text-rosa-oscuro" /></div><p className="text-xs text-texto-suave">Ventas hoy</p></div>
          <p className="text-2xl font-bold text-texto-suave">{formatCurrency(todayTotal)}</p>
          <p className="text-xs text-gray-400">{todayCount} ventas</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2"><div className="bg-cielo/30 p-2 rounded-full"><DollarSign size={20} className="text-blue-500" /></div><p className="text-xs text-texto-suave">Ganancia hoy</p></div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(todayProfit)}</p>
          <p className="text-xs text-gray-400">estimada</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2"><div className="bg-amarillo/30 p-2 rounded-full"><Calendar size={20} className="text-yellow-600" /></div><p className="text-xs text-texto-suave">Pedidos activos</p></div>
          <p className="text-2xl font-bold text-texto-suave">{activeOrders.length}</p>
          <p className="text-xs text-gray-400">Por completar</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rosa/20">
          <div className="flex items-center gap-2 mb-2"><div className="bg-red-100 p-2 rounded-full"><Package size={20} className="text-red-500" /></div><p className="text-xs text-texto-suave">Stock bajo</p></div>
          <p className="text-2xl font-bold text-texto-suave">{lowStock.length}</p>
          <p className="text-xs text-gray-400">Productos</p>
        </div>
      </div>

      {/* Corte del día + Reimpresión de tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2"><Printer size={20} /> Corte del día</h3>
          {todaySales.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas hoy</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto text-sm">
              {todaySales.map(sale => {
                const ganancia = calcProfit(sale);
                return (
                  <div key={sale.id} className="border border-rosa/10 rounded-xl p-3">
                    <div className="flex justify-between font-medium text-texto-suave mb-1">
                      <span>Ticket #{sale.ticketNumber || 'N/A'}</span>
                      <span>{sale.paymentMethod} - {new Date(sale.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {(sale.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-500 pl-2">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-green-600 pl-2">
                      <span>Ganancia</span>
                      <span>{formatCurrency(ganancia)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs mt-1 pt-1 border-t border-rosa/10">
                      <span>Total</span>
                      <span>{formatCurrency(sale.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm font-bold text-texto-suave border-t border-rosa/20 pt-3">
              <span>Total general</span>
              <span>{formatCurrency(todayTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-green-600">
              <span>Ganancia del día</span>
              <span>{formatCurrency(todayProfit)}</span>
            </div>
            <button
              onClick={() => { setTimeout(handlePrintCut, 100); }}
              disabled={todaySales.length === 0}
              className="w-full bg-rosa-oscuro hover:bg-rosa text-white py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              <Printer size={16} /> Imprimir corte del día
            </button>
          </div>
          <div style={{ display: 'none' }}>
            <CutTicket ref={cutRef} sales={todaySales} date={new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} productsMap={productsMap} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2"><RefreshCw size={20} /> Reimprimir tickets</h3>
          {todaySales.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas hoy</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {todaySales.map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-2 bg-rosa/5 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">#{sale.ticketNumber || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(sale.total)} • {sale.paymentMethod}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedSale(sale); setShowTicket(true); }}
                    className="text-rosa-oscuro hover:underline text-xs flex items-center gap-1"
                  >
                    <Printer size={14} /> Reimprimir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial mensual + Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2"><Calendar size={20} /> Historial mensual</h3>
          {dailyArray.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas este mes</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dailyArray.map(day => (
                <div key={day.day} className="flex justify-between items-center p-2 bg-rosa/5 rounded-lg text-sm">
                  <span className="font-medium w-28">{new Date(day.day + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-xs text-gray-500 w-16 text-center">{day.count} ventas</span>
                  <span className="font-medium w-20 text-right">{formatCurrency(day.total)}</span>
                  <span className="font-bold text-green-600 w-20 text-right">+{formatCurrency(day.ganancia)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2 border-t border-rosa/20 pt-3">
            <div className="flex justify-between text-sm font-bold text-texto-suave">
              <span>Total del mes</span>
              <span>{formatCurrency(monthTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-green-600">
              <span>Ganancia del mes</span>
              <span>{formatCurrency(monthProfit)}</span>
            </div>
            <button
              onClick={() => { setTimeout(handlePrintMonthlyCut, 100); }}
              disabled={dailyArray.length === 0}
              className="w-full bg-rosa-oscuro hover:bg-rosa text-white py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              <Printer size={16} /> Imprimir corte mensual
            </button>
          </div>
          <div style={{ display: 'none' }}>
            <MonthlyCutTicket ref={monthlyCutRef} dailyData={dailyArray} monthName={monthName} totalGeneral={monthTotal} totalGanancia={monthProfit} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
          <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2"><Star size={20} /> Más vendidos del mes</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas este mes</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topProducts.map((p, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium text-texto-suave truncate flex-1 mr-2">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.quantity} vendidos • {formatCurrency(p.total)}</span>
                  </div>
                  <div className="w-full bg-rosa/10 rounded-full h-3">
                    <div className="bg-rosa-oscuro h-3 rounded-full" style={{ width: `${(p.quantity / maxQty) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-rosa/20">
        <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2"><Lightbulb size={20} /> Sugerencias</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestedClients.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Clientes sin pedidos recientes</p>
              {suggestedClients.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-rosa/5 rounded-lg text-sm mb-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-rosa-oscuro">¿Ofrecer descuento?</p>
                </div>
              ))}
            </div>
          )}
          {pieData.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Eventos más populares este mes</p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {suggestedClients.length === 0 && activeOrders.length === 0 && (
          <p className="text-gray-400 text-sm">Todo al día, ¡excelente trabajo!</p>
        )}
      </div>

      {/* Modal de reimpresión de ticket */}
      {showTicket && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-texto-suave">🧾 Ticket #{selectedSale.ticketNumber}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrintTicket} className="bg-rosa-oscuro text-white px-4 py-2 rounded-full text-sm">🖨️ Imprimir</button>
                <button onClick={() => setShowTicket(false)} className="bg-gray-200 text-texto-suave px-4 py-2 rounded-full text-sm">Cerrar</button>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl flex justify-center overflow-x-auto">
              <Ticket ref={ticketRef} sale={selectedSale} width="58mm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}