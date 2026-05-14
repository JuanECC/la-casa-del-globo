import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../services/products';
import { Search, Plus, Pencil, Trash2, Package, X, ArrowUpDown, Printer, Grid3x3, List } from 'lucide-react';
import InventoryPrint from '../components/products/InventoryPrint';

const CATEGORIES = [
  'globos', 'arreglos', 'peluches', 'regalos', 'decoraciones',
  'accesorios', 'velas', 'cajas sorpresa', 'brillos'
];

const initialForm = {
  name: '',
  sku: '',
  category: 'globos',
  brand: '',
  purchasePrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
  description: '',
  imageUrl: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'categories' | 'grouped'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Modal de producto (crear/editar)
  const [showProductModal, setShowProductModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // Modal de ajuste de inventario
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');

  // Modal de impresión de inventario
  const [showInventoryPrint, setShowInventoryPrint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState('portrait');
  const inventoryRef = useRef();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  // ---------------- Impresión de inventario ----------------
  const handlePrintInventory = useReactToPrint({
    contentRef: inventoryRef,
    documentTitle: 'Inventario_La_Casa_del_Globo',
  });

  const sortedForPrint = [...products].sort((a, b) => {
    const brandA = (a.brand || '').toLowerCase();
    const brandB = (b.brand || '').toLowerCase();
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    const catA = (a.category || '').toLowerCase();
    const catB = (b.category || '').toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return (a.name || '').localeCompare(b.name || '');
  });

  // ---------------- Lógica de producto (crear/editar) ----------------
  const openCreateModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku || '',
      category: product.category,
      brand: product.brand,
      purchasePrice: product.purchasePrice?.toString() || '',
      salePrice: product.salePrice?.toString() || '',
      stock: product.stock?.toString() || '',
      minStock: product.minStock?.toString() || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 0,
    };
    if (editingId) {
      await updateProduct(editingId, productData);
    } else {
      await addProduct(productData);
    }
    setShowProductModal(false);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  // ---------------- Lógica de ajuste de inventario ----------------
  const openInventoryModal = (product = null) => {
    setSelectedProduct(product);
    setInventorySearch(product ? product.name : '');
    setAdjustmentQuantity('');
    setShowInventoryModal(true);
  };

  const handleInventoryAdjust = async () => {
    if (!selectedProduct || !adjustmentQuantity) return;
    const qty = parseInt(adjustmentQuantity);
    if (isNaN(qty) || qty === 0) return;
    const newStock = (selectedProduct.stock || 0) + qty;
    if (newStock < 0) {
      alert('El stock no puede ser negativo.');
      return;
    }
    await updateProduct(selectedProduct.id, { stock: newStock });
    setShowInventoryModal(false);
    loadProducts();
  };

  const filteredInventoryProducts = products.filter(p => {
    const term = inventorySearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term)
    );
  });

  // ---------------- Filtrado de productos según vista ----------------
  const getFilteredProducts = () => {
    let result = products;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      );
    }
    if (viewMode === 'categories' && selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    return result;
  };

  const filtered = getFilteredProducts();

  // Para vista agrupada: productos ordenados por categoría y nombre
  const grouped = [...filtered].sort((a, b) => {
    const catA = (a.category || '').toLowerCase();
    const catB = (b.category || '').toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return (a.name || '').localeCompare(b.name || '');
  });

  // Agrupar por categoría
  const groupedByCategory = {};
  grouped.forEach(p => {
    const cat = p.category || 'Sin categoría';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(p);
  });

  // Categorías disponibles (las que tienen productos)
  const availableCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-texto-suave">🎈 Productos</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInventoryPrint(true)}
            className="bg-white border border-rosa/30 hover:bg-rosa/10 text-texto-suave px-4 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 transition-colors"
          >
            <Printer size={18} /> Imprimir inventario
          </button>
          <button
            onClick={openCreateModal}
            className="bg-rosa-oscuro hover:bg-rosa text-white px-5 py-2.5 rounded-full font-medium shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Agregar producto
          </button>
        </div>
      </div>

      {/* Barra de búsqueda + botones de vista */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none text-texto-suave text-base"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setViewMode('grouped'); setSelectedCategory(null); }}
            className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${
              viewMode === 'grouped' 
                ? 'bg-rosa-oscuro text-white shadow-md' 
                : 'bg-white border border-rosa/20 text-texto-suave hover:bg-rosa/10'
            }`}
          >
            <List size={18} /> Agrupado
          </button>
          <button
            onClick={() => { setViewMode('categories'); setSelectedCategory(null); }}
            className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${
              viewMode === 'categories' 
                ? 'bg-rosa-oscuro text-white shadow-md' 
                : 'bg-white border border-rosa/20 text-texto-suave hover:bg-rosa/10'
            }`}
          >
            <Grid3x3 size={18} /> Categorías
          </button>
        </div>
      </div>

      {/* Vista por categorías: cuadritos */}
      {viewMode === 'categories' && !selectedCategory && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableCategories.map(cat => (
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

      {/* Botón regresar en vista categorías */}
      {viewMode === 'categories' && selectedCategory && (
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-sm text-rosa-oscuro hover:underline"
        >
          ← Todas las categorías
        </button>
      )}

      {/* Tabla de productos (vista agrupada o categorías con filtro) */}
      {viewMode === 'grouped' ? (
        /* Vista agrupada por categoría */
        <div className="space-y-6">
          {Object.keys(groupedByCategory).length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-rosa/20 p-8 text-center text-gray-400">
              {search ? 'No se encontraron productos' : 'No hay productos'}
            </div>
          ) : (
            Object.entries(groupedByCategory).map(([cat, catProducts]) => (
              <div key={cat} className="bg-white rounded-2xl shadow-sm border border-rosa/20 overflow-hidden">
                <div className="bg-rosa/10 px-4 py-2 text-sm font-bold text-texto-suave capitalize">
                  {cat === 'globos' ? '🎈' :
                   cat === 'arreglos' ? '💐' :
                   cat === 'peluches' ? '🧸' :
                   cat === 'regalos' ? '🎁' :
                   cat === 'decoraciones' ? '✨' :
                   cat === 'accesorios' ? '🎀' :
                   cat === 'velas' ? '🕯️' :
                   cat === 'cajas sorpresa' ? '📦' :
                   cat === 'brillos' ? '✨' : '📌'} {cat}
                </div>
                <table className="min-w-full text-texto-suave text-sm">
                  <thead className="bg-rosa/5">
                    <tr>
                      <th className="p-3 text-left">SKU</th>
                      <th className="p-3 text-left">Nombre</th>
                      <th className="p-3 text-left">Marca</th>
                      <th className="p-3 text-left">P. compra</th>
                      <th className="p-3 text-left">P. venta</th>
                      <th className="p-3 text-left">Stock</th>
                      <th className="p-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catProducts.map(p => (
                      <tr key={p.id} className="border-b border-rosa/10 hover:bg-rosa/5">
                        <td className="p-3 font-mono text-xs">{p.sku || '-'}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">{p.brand}</td>
                        <td className="p-3">${p.purchasePrice}</td>
                        <td className="p-3">${p.salePrice}</td>
                        <td className="p-3">{p.stock}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-rosa/10 text-rosa-oscuro transition-colors" title="Editar"><Pencil size={16} /></button>
                            <button onClick={() => openInventoryModal(p)} className="p-1.5 rounded-lg hover:bg-rosa/10 text-texto-suave transition-colors" title="Ajustar inventario"><ArrowUpDown size={16} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Vista normal o con categoría seleccionada (tabla plana) */
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-rosa/20">
          <table className="min-w-full text-texto-suave text-sm">
            <thead className="bg-rosa/10">
              <tr>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Marca</th>
                <th className="p-3 text-left">P. compra</th>
                <th className="p-3 text-left">P. venta</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="p-4 text-center">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-4 text-center">
                  {search ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
                </td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="border-b border-rosa/10 hover:bg-rosa/5">
                    <td className="p-3 font-mono text-xs">{p.sku || '-'}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 capitalize">{p.category}</td>
                    <td className="p-3">{p.brand}</td>
                    <td className="p-3">${p.purchasePrice}</td>
                    <td className="p-3">${p.salePrice}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-rosa/10 text-rosa-oscuro transition-colors" title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => openInventoryModal(p)} className="p-1.5 rounded-lg hover:bg-rosa/10 text-texto-suave transition-colors" title="Ajustar inventario"><ArrowUpDown size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== MODALES ========== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-[10vh]">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-lg animate-in max-h-[80vh] overflow-y-auto">
            <div className="bg-rosa/10 px-6 py-4 flex justify-between items-center border-b border-rosa/20 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-texto-suave flex items-center gap-2"><Package size={20} /> {editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-texto-suave hover:text-rosa-oscuro"><X size={24} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">SKU / Código</label><input type="text" placeholder="Ej: GLOBO-COR-001" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="input-pastel" /></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Nombre *</label><input type="text" placeholder="Nombre del producto" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-pastel" required /></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Categoría</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-pastel">{CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Marca</label><input type="text" list="brand-suggestions" placeholder="Elige o escribe una marca" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input-pastel" />
                  <datalist id="brand-suggestions">{[...new Set(products.map(p => p.brand).filter(Boolean))].sort().map(brand => (<option key={brand} value={brand} />))}</datalist>
                </div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Precio compra</label><input type="number" placeholder="0" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} className="input-pastel" min="0" /></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Precio venta</label><input type="number" placeholder="0" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} className="input-pastel" min="0" /></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Stock inicial</label><input type="number" placeholder="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-pastel" min="0" /></div>
                <div><label className="block text-xs text-texto-suave mb-1 ml-1">Stock mínimo</label><input type="number" placeholder="5" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} className="input-pastel" min="0" /></div>
                <div className="md:col-span-2"><label className="block text-xs text-texto-suave mb-1 ml-1">Descripción</label><input type="text" placeholder="Descripción breve" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-pastel" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium transition-colors shadow-md">{editingId ? 'Guardar cambios' : 'Crear producto'}</button>
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-texto-suave py-3 rounded-full font-medium transition-colors">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-[15vh]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg animate-in">
            <div className="bg-rosa/10 px-6 py-4 flex justify-between items-center border-b border-rosa/20">
              <h3 className="text-lg font-bold text-texto-suave flex items-center gap-2"><ArrowUpDown size={20} /> Ajustar inventario</h3>
              <button onClick={() => setShowInventoryModal(false)} className="text-texto-suave hover:text-rosa-oscuro"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              {!selectedProduct ? (
                <>
                  <div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="Buscar producto por SKU o nombre..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none text-texto-suave" autoFocus /></div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredInventoryProducts.map(p => (
                      <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex justify-between items-center p-3 hover:bg-rosa/5 rounded-xl cursor-pointer border border-transparent hover:border-rosa/20 transition-all">
                        <div><p className="font-medium text-texto-suave">{p.name}</p><p className="text-xs text-gray-400">{p.sku} • {p.brand}</p></div>
                        <p className="font-bold text-sm">Stock: {p.stock}</p>
                      </div>
                    ))}
                    {inventorySearch && filteredInventoryProducts.length === 0 && <p className="text-gray-400 text-center py-4">No se encontraron productos</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-rosa/5 p-4 rounded-xl"><p className="font-bold text-texto-suave">{selectedProduct.name}</p><p className="text-sm text-gray-500">Stock actual: <span className="font-bold text-lg">{selectedProduct.stock}</span></p></div>
                  <div><label className="block text-xs text-texto-suave mb-1 ml-1">Cantidad a agregar (negativo para quitar)</label><input type="number" placeholder="0" value={adjustmentQuantity} onChange={(e) => setAdjustmentQuantity(e.target.value)} className="input-pastel text-lg font-bold text-center" autoFocus /></div>
                  {adjustmentQuantity && <div className="text-center"><p className="text-sm text-gray-500">Nuevo stock: <span className="font-bold text-texto-suave">{(selectedProduct.stock || 0) + parseInt(adjustmentQuantity || 0)}</span></p></div>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setSelectedProduct(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-texto-suave py-3 rounded-full font-medium transition-colors">Cambiar producto</button>
                    <button onClick={handleInventoryAdjust} disabled={!adjustmentQuantity} className="flex-1 bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium transition-colors shadow-md disabled:opacity-50">Ajustar stock</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showInventoryPrint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-texto-suave">🧾 Vista previa del inventario</h3>
              <div className="flex gap-2">
                <select value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value)} className="text-sm border rounded-lg px-2 py-1">
                  <option value="portrait">Vertical (carta)</option><option value="landscape">Horizontal (carta)</option>
                </select>
                <button onClick={handlePrintInventory} className="bg-rosa-oscuro text-white px-4 py-2 rounded-full text-sm">🖨️ Imprimir</button>
                <button onClick={() => setShowInventoryPrint(false)} className="bg-gray-200 text-texto-suave px-4 py-2 rounded-full text-sm">Cerrar</button>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-xl flex justify-center overflow-x-auto">
              <InventoryPrint ref={inventoryRef} products={sortedForPrint} orientation={printOrientation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}