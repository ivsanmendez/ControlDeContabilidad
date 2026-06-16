import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

// A4: 21cm × 29.7cm — 3×3 grid → each cell 7cm × 9.3cm
// Row height reduced from 9.9cm to 9.3cm (total 27.9cm) so browsers
// with enforced minimum margins (~0.5–1cm) don't clip the bottom row.
const CELL_W = '7cm'
const CELL_H = '9.3cm'
const QR_SIZE = '6.2cm'

const COLOR_OPTIONS = {
  black: '#000000',
  darkblue: '#00008B',
  darkgray: '#A9A9A9',
} as const

type ColorKey = keyof typeof COLOR_OPTIONS

function HangTagContent({ adminNumber, code, qrURL, color }: { adminNumber: string; code: string; qrURL: string; color: string }) {
  const qrColor = COLOR_OPTIONS[color as ColorKey] || COLOR_OPTIONS.black

  return (
    <div style={{
      width: CELL_W,
      height: CELL_H,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.2cm 0.25cm',
      boxSizing: 'border-box',
      border: `1px solid ${qrColor}`,
    }}>
      <div style={{ textAlign: 'center', paddingTop: '0.1cm' }}>
        <div style={{ fontSize: '20pt', fontWeight: 'bold', lineHeight: 1.1, letterSpacing: '0.05em', color: qrColor }}>
          {adminNumber}
        </div>
        <div style={{ fontSize: '10pt', color: '#555', marginTop: '0.1cm', fontFamily: 'monospace' }}>
          {code}
        </div>
      </div>
      <div style={{ width: QR_SIZE, height: QR_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QRCodeSVG value={qrURL} fgColor={qrColor} style={{ width: QR_SIZE, height: QR_SIZE }} />
      </div>
    </div>
  )
}

function EmptyCell() {
  return (
    <div style={{
      width: CELL_W,
      height: CELL_H,
      border: '1px dashed #ccc',
      boxSizing: 'border-box',
    }} />
  )
}

export function VehicleHangTagPage() {
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const adminNumber = params.get('admin') ?? ''
  const houseID = params.get('houseID') ?? ''
  const position = parseInt(params.get('pos') ?? '1', 10)
  const color = params.get('color') ?? 'black'

  const qrURL = `${window.location.origin}/houses/${houseID}/report`

  useEffect(() => {
    if (code && adminNumber) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [code, adminNumber])

  if (!code || !adminNumber || position < 1 || position > 9) {
    return <p style={{ padding: 16 }}>Parámetros inválidos</p>
  }

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; font-family: sans-serif; }
      `}</style>

      <div style={{
        width: '21cm',
        height: '29.7cm',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 7cm)',
        gridTemplateRows: 'repeat(3, 9.3cm)',
      }}>
        {Array.from({ length: 9 }, (_, i) => {
          const slot = i + 1
          return slot === position
            ? <HangTagContent key={slot} adminNumber={adminNumber} code={code} qrURL={qrURL} color={color} />
            : <EmptyCell key={slot} />
        })}
      </div>
    </>
  )
}