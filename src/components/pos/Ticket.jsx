import { forwardRef } from 'react';

const Ticket = forwardRef(({ sale, width = '58mm' }, ref) => {
  if (!sale) return null;

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  return (
    <div
      ref={ref}
      style={{
        width: width,
        padding: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: 'white',
        color: 'black',
        margin: '0 auto',
      }}
    >
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>🎈 La Casa del Globo</p>
        <p style={{ fontSize: '10px', fontStyle: 'italic', margin: '0 0 4px' }}>"Inflamos sonrisas"</p>
        <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
      </div>

      {/* Datos de la venta */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ margin: '0', fontSize: '10px' }}>
          Fecha: {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
        </p>
        <p style={{ margin: '0', fontSize: '10px' }}>Ticket: #{sale.ticketNumber || '0001'}</p>
        <p style={{ margin: '0', fontSize: '10px' }}>Atendió: {sale.userEmail}</p>
      </div>

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {/* Productos */}
      <table style={{ width: '100%', fontSize: '10px', marginBottom: '8px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '2px' }}>Cant</th>
            <th style={{ padding: '2px' }}>Producto</th>
            <th style={{ padding: '2px', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px dotted #eee' }}>
              <td style={{ padding: '2px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '2px' }}>
                <span>{item.name}</span>
                <br />
                <span style={{ fontSize: '9px', color: '#666' }}>
                  {formatCurrency(item.unitPrice)} c/u
                </span>
              </td>
              <td style={{ padding: '2px', textAlign: 'right' }}>
                {formatCurrency(item.unitPrice * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {/* Totales */}
      <div style={{ fontSize: '10px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Descuento:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {/* Método de pago */}
      <p style={{ fontSize: '10px', margin: '4px 0', textAlign: 'center' }}>
        Método de pago: {sale.paymentMethod === 'efectivo' ? 'Efectivo 💵' : sale.paymentMethod === 'tarjeta' ? 'Tarjeta 💳' : 'Transferencia 📱'}
      </p>

      {/* Efectivo y cambio */}
      {sale.paymentMethod === 'efectivo' && sale.cashReceived > 0 && (
        <>
          <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span>Efectivo:</span>
            <span>{formatCurrency(sale.cashReceived)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
            <span>Cambio:</span>
            <span>{formatCurrency(sale.change)}</span>
          </div>
        </>
      )}

      <div style={{ borderTop: '1px dashed #ccc', margin: '4px 0' }}></div>

      {/* Pie */}
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold' }}>
          ¡Gracias por tu compra! ✨
        </p>
        <p style={{ margin: '0', fontSize: '10px' }}>Vuelve pronto.</p>
      </div>
    </div>
  );
});

Ticket.displayName = 'Ticket';

export default Ticket;