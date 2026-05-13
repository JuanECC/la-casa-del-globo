import { forwardRef } from 'react';

const InventoryPrint = forwardRef(({ products, orientation = 'portrait' }, ref) => {
  if (!products || products.length === 0) {
    return (
      <div ref={ref} style={{ padding: '20px', textAlign: 'center' }}>
        No hay productos para mostrar.
      </div>
    );
  }

  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#000',
      padding: '10px',
      maxWidth: orientation === 'landscape' ? '297mm' : '210mm',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '10px',
    },
    title: {
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '0 0 4px',
    },
    subtitle: {
      fontSize: '12px',
      fontStyle: 'italic',
      margin: '0 0 10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px',
    },
    th: {
      backgroundColor: '#f8d7e4',
      padding: '5px',
      border: '1px solid #ddd',
      textAlign: 'left',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    td: {
      padding: '4px 5px',
      border: '1px solid #ddd',
      fontSize: '10px',
    },
    groupHeader: {
      backgroundColor: '#ffe0ec',
      fontWeight: 'bold',
      fontSize: '11px',
      padding: '4px 5px',
      border: '1px solid #ddd',
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      <div style={styles.header}>
        <p style={styles.title}>🎈 La Casa del Globo</p>
        <p style={styles.subtitle}>"Inflamos sonrisas"</p>
        <h2 style={{ margin: '10px 0', fontSize: '14px' }}>Inventario de productos</h2>
        <p style={{ fontSize: '10px', color: '#555' }}>
          Fecha: {new Date().toLocaleDateString('es-MX')}
        </p>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>SKU</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Categoría</th>
            <th style={styles.th}>Marca</th>
            <th style={{...styles.th, textAlign: 'right'}}>P. Compra</th>
            <th style={{...styles.th, textAlign: 'right'}}>P. Venta</th>
            <th style={{...styles.th, textAlign: 'right'}}>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            // Mostrar separador de marca si cambia respecto al producto anterior
            const prevBrand = index > 0 ? products[index - 1].brand : null;
            const showBrandSeparator = product.brand !== prevBrand && index > 0;
            return (
              <>
                {showBrandSeparator && (
                  <tr key={`sep-${index}`}>
                    <td colSpan="7" style={styles.groupHeader}>
                      {product.brand || 'Sin marca'}
                    </td>
                  </tr>
                )}
                <tr key={product.id || index}>
                  <td style={styles.td}>{product.sku || '-'}</td>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>{product.category}</td>
                  <td style={styles.td}>{product.brand}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(product.purchasePrice)}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(product.salePrice)}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>{product.stock}</td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

InventoryPrint.displayName = 'InventoryPrint';

export default InventoryPrint;