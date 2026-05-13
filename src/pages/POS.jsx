import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { getProducts } from '../services/products';
import { createSale } from '../services/sales';
import { useAuth } from '../hooks/useAuth';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, CreditCard, Banknote, Smartphone, ArrowLeft } from 'lucide-react';
import Ticket from '../components/pos/Ticket';

const paymentIcons = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Smartphone,
};

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [ticketWidth, setTicketWidth] = useState('58mm');
  const ticketRef = useRef();

  // Categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${lastSale?.ticketNumber || 'venta'}`,
  });

  // Extraer categorías únicas de los productos
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Productos filtrados: la búsqueda por texto tiene prioridad sobre la categoría
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    // Si hay término de búsqueda, buscar en todos los productos (SKU, nombre, marca)
    if (term) {
      return (
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      );
    }
    // Si no hay búsqueda pero sí categoría seleccionada, filtrar por categoría
    if (selectedCategory) {
      return p.category === selectedCategory;
    }
    // Sin búsqueda ni categoría: no mostrar nada
    return false;
  });

  // Mostrar productos si hay búsqueda o categoría seleccionada
  const showProductGrid = searchTerm || selectedCategory;

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.salePrice,
        quantity: 1,
        currentStock: product.stock
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount;
  const change = paymentMethod === 'efectivo' && cashReceived
    ? parseFloat(cashReceived) - total
    : 0;

  const handleOpenReview = () => {
    if (cart.length === 0) return;
    setCashReceived('');
    setPaymentMethod('efectivo');
    setShowReview(true);
  };

  const handleCompleteSale = async () => {
    if (paymentMethod === 'efectivo' && (parseFloat(cashReceived) || 0) < total) {
      alert('El efectivo recibido es menor al total.');
      return;
    }

    const ticketNumber = Date.now().toString().slice(-6);

    const saleData = {
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
        newStock: item.currentStock - item.quantity
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? parseFloat(cashReceived) || 0 : 0,
      change: paymentMethod === 'efectivo' ? change : 0,
      userId: user.uid,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
      ticketNumber
    };

    try {
      await createSale(saleData);
      setLastSale(saleData);
      setShowReview(false);
      setShowTicket(true);
      setCart([]);
      setCashReceived('');
      setSaleComplete(true);
      loadProducts();
    } catch (error) {
      console.error('Error al guardar venta:', error);
      alert('Error al procesar la venta');
    }
  };

  const PaymentIcon = paymentIcons[paymentMethod] || Banknote;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Panel izquierdo: Búsqueda y productos */}
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold text-texto-suave flex items-center gap-2">
          <ShoppingCart size={28} /> Punto de Venta
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Escanear código o buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredProducts.length === 1) {
                  addToCart(filteredProducts[0]);
                  setSearchTerm('');
                }
              }
            }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none text-texto-suave"
            autoFocus
          />
        </div>

        {/* Cuadritos de categorías (si no hay categoría seleccionada ni búsqueda) */}
        {!selectedCategory && !searchTerm && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="bg-white hover:bg-rosa/10 border border-rosa/20 rounded-2xl p-4 text-center transition-all shadow-sm hover:shadow-md"
              >
                <span className="text-2xl block mb-1">
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

        {/* Botón para regresar a las categorías cuando hay una seleccionada */}
        {selectedCategory && !searchTerm && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm text-rosa-oscuro hover:underline"
          >
            <ArrowLeft size={16} />
            Todas las categorías
          </button>
        )}

        {/* Resultados: productos de la categoría o búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {showProductGrid ? (
            filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-rosa/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-texto-suave">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.sku} • {product.brand}</p>
                    </div>
                    <p className="text-lg font-bold text-rosa-oscuro">${product.salePrice}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Stock: {product.stock}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 col-span-full text-center py-8">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
              </p>
            )
          ) : (
            <p className="text-gray-400 col-span-full text-center py-8">
              Busca un producto o elige una categoría
            </p>
          )}
        </div>
      </div>

      {/* Panel derecho: Carrito */}
      <div className="w-96 bg-white rounded-2xl shadow-sm border border-rosa/20 p-6 flex flex-col">
        <h3 className="text-lg font-bold text-texto-suave mb-4 flex items-center gap-2">
          <ShoppingCart size={20} /> Carrito ({cart.length})
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.productId} className="bg-rosa/5 p-3 rounded-xl">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-texto-suave">{item.name}</p>
                <p className="text-sm font-bold text-texto-suave">${item.price * item.quantity}</p>
              </div>
              <p className="text-xs text-gray-400 mb-2">${item.price} c/u</p>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.productId, -1)} className="bg-rosa/20 p-1 rounded-lg hover:bg-rosa/30"><Minus size={14} /></button>
                <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, 1)} className="bg-rosa/20 p-1 rounded-lg hover:bg-rosa/30" disabled={item.quantity >= item.currentStock}><Plus size={14} /></button>
                <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-gray-400 text-center py-8">El carrito está vacío</p>
          )}
        </div>

        <div className="border-t border-rosa/20 pt-4 space-y-3">
          <div className="flex justify-between text-sm text-texto-suave">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-texto-suave">
            <span>Descuento</span>
            <span>${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-texto-suave">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleOpenReview}
            disabled={cart.length === 0}
            className="w-full bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Revisar venta
          </button>
        </div>
      </div>

      {/* Modal de revisión de venta */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg animate-in">
            <div className="bg-rosa/10 px-6 py-4 flex justify-between items-center border-b border-rosa/20">
              <h3 className="text-lg font-bold text-texto-suave flex items-center gap-2">
                <ShoppingCart size={22} /> Confirmar venta
              </h3>
              <button onClick={() => setShowReview(false)} className="text-texto-suave hover:text-rosa-oscuro transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm text-texto-suave">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-rosa/20 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-texto-suave">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-texto-suave">
                  <span>Total a pagar</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-texto-suave mb-2 ml-1">Método de pago</label>
                <div className="grid grid-cols-3 gap-3">
                  {['efectivo', 'tarjeta', 'transferencia'].map(method => {
                    const Icon = paymentIcons[method];
                    const isActive = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-rosa-oscuro bg-rosa/20 text-rosa-oscuro'
                            : 'border-gray-200 bg-white text-texto-suave hover:border-rosa/30'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-xs mt-1 capitalize">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="block text-xs text-texto-suave mb-1 ml-1">Efectivo recibido</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    className="input-pastel text-lg font-bold text-center"
                    min="0"
                    autoFocus
                  />
                  {change > 0 && (
                    <p className="text-green-600 font-medium text-center mt-2 text-lg">
                      Cambio: ${change.toFixed(2)}
                    </p>
                  )}
                  {change < 0 && (
                    <p className="text-red-500 text-center mt-2">
                      Faltan ${Math.abs(change).toFixed(2)}
                    </p>
                  )}
                  {change === 0 && cashReceived && total > 0 && (
                    <p className="text-green-600 font-medium text-center mt-2 text-lg">
                      Pago exacto
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReview(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-texto-suave py-3 rounded-full font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompleteSale}
                  disabled={paymentMethod === 'efectivo' && (parseFloat(cashReceived) || 0) < total}
                  className="flex-1 bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket y botones de impresión */}
      {showTicket && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-texto-suave">🧾 Vista previa del ticket</h3>
              <div className="flex gap-2">
                <select value={ticketWidth} onChange={(e) => setTicketWidth(e.target.value)} className="text-sm border rounded-lg px-2 py-1">
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
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
    </div>
  );
}