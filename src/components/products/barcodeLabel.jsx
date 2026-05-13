import { forwardRef, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeLabel = forwardRef(({ product, size = 'small' }, ref) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && product?.sku) {
      try {
        JsBarcode(barcodeRef.current, product.sku, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 2,
        });
      } catch (e) {
        console.error('Error generando código de barras', e);
      }
    }
  }, [product]);

  if (!product) return null;

  const width = size === 'small' ? '50mm' : '70mm';
  const fontSize = size === 'small' ? '10px' : '12px';

  return (
    <div
      ref={ref}
      style={{
        width,
        padding: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize,
        backgroundColor: 'white',
        color: 'black',
        textAlign: 'center',
        border: '1px dashed #ccc',
        margin: '0 auto',
        borderRadius: '8px',
      }}
    >
      <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '9px' }}>🎈 La Casa del Globo</p>
      <svg ref={barcodeRef} style={{ maxWidth: '100%' }} />
      <p style={{ fontWeight: 'bold', margin: '4px 0 0', fontSize }}>{product.name}</p>
      <p style={{ margin: '2px 0 0', fontSize }}>${Number(product.salePrice || 0).toFixed(2)}</p>
    </div>
  );
});

BarcodeLabel.displayName = 'BarcodeLabel';

export default BarcodeLabel;