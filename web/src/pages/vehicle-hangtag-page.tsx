import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export function VehicleHangTagPage() {
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const adminNumber = params.get('admin') ?? ''
  const houseID = params.get('houseID') ?? ''

  // URL the QR encodes — the house report page
  const reportURL = `${window.location.origin}/houses/${houseID}/report`

  // Auto-print when the page loads
  useEffect(() => {
    if (code && adminNumber) {
      const timeout = setTimeout(() => window.print(), 300)
      return () => clearTimeout(timeout)
    }
  }, [code, adminNumber])

  if (!code || !adminNumber) {
    return <p style={{ padding: 16 }}>Parámetros inválidos</p>
  }

  return (
    <>
      {/* Print page size */}
      <style>{`
        @page { size: 7cm 9cm; margin: 0; }
        body { margin: 0; padding: 0; background: white; }
      `}</style>

      <div style={{
        width: '7cm',
        height: '9cm',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.3cm',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        border: '1px solid #000',
      }}>
        {/* Top: admin number and code */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          paddingTop: '0.1cm',
        }}>
          <div style={{
            fontSize: '18pt',
            fontWeight: 'bold',
            lineHeight: 1.2,
            letterSpacing: '0.05em',
          }}>
            {adminNumber}
          </div>
          <div style={{
            fontSize: '11pt',
            color: '#555',
            marginTop: '0.1cm',
            fontFamily: 'monospace',
          }}>
            {code}
          </div>
        </div>

        {/* Bottom: 6.5cm × 6.5cm QR */}
        <div style={{
          width: '6.5cm',
          height: '6.5cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <QRCodeSVG
            value={reportURL}
            style={{ width: '6.5cm', height: '6.5cm' }}
          />
        </div>
      </div>
    </>
  )
}
