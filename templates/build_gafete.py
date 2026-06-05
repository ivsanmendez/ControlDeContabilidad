#!/usr/bin/env python3
"""Generate ARI vehicle-access hangtag PDF with fillable AcroForm fields."""

import os, math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas as rlcanvas
from reportlab.lib.colors import HexColor

# ── Colors
YELLOW      = HexColor('#F5E642')
DARK_YELLOW = HexColor('#C8BA00')
DARK        = HexColor('#111111')
DARK2       = HexColor('#222222')
WHITE       = colors.white
LIGHT_GRAY  = HexColor('#CCCCCC')
GRAY        = HexColor('#888888')

# ── Physical dimensions
TAG_W  = 8   * cm
TAG_H  = 18  * cm
HOOK_H = 4.5 * cm
BODY_H = TAG_H - HOOK_H   # 13.5 cm
R      = 0.4  * cm        # corner radius

PAGE_W, PAGE_H = A4
# Centre the tag on the A4 page
TX = (PAGE_W - TAG_W) / 2
TY = (PAGE_H - TAG_H) / 2

PX = 0.4 * cm   # horizontal inner padding
PY = 0.25 * cm  # vertical inner padding


# ─────────────────────────────────────────────────────────────────────────────
# Primitives
# ─────────────────────────────────────────────────────────────────────────────

def _tag_bg(c):
    c.setFillColor(YELLOW)
    c.setStrokeColor(DARK_YELLOW)
    c.setLineWidth(1.5)
    c.roundRect(TX, TY, TAG_W, TAG_H, R, fill=1, stroke=1)


def _hook_hole(c):
    hole_r = 1.3 * cm
    cx = TX + TAG_W / 2
    cy = TY + TAG_H - hole_r - 0.5 * cm
    c.setFillColor(WHITE)
    c.setStrokeColor(DARK_YELLOW)
    c.setLineWidth(1.5)
    c.circle(cx, cy, hole_r, fill=1, stroke=1)


def _divider(c):
    """Black line at the boundary between hook area and body (at 4.5 cm)."""
    c.setStrokeColor(DARK2)
    c.setLineWidth(2.5)
    c.line(TX, TY + BODY_H, TX + TAG_W, TY + BODY_H)


def _banner(c, x, y, w, h, text, size=11):
    """Black rounded banner with yellow text."""
    c.setFillColor(DARK2)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.setFont('Helvetica-Bold', size)
    c.drawCentredString(x + w / 2, y + (h - size * 0.72) / 2, text)


def _field_box(c, x, y, w, h, label):
    """White rounded box with a small upper label for handwriting/typing."""
    c.setFillColor(WHITE)
    c.setStrokeColor(DARK)
    c.setLineWidth(1.5)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    c.setFillColor(GRAY)
    c.setFont('Helvetica-Bold', 7)
    c.drawCentredString(x + w / 2, y + h - 9, label.upper())


def _acro_text(c, name, tooltip, x, y, w, h):
    """Transparent AcroForm text field overlaid on a drawn box."""
    c.acroForm.textfield(
        name=name,
        tooltip=tooltip,
        x=x + 3, y=y + 3,
        width=w - 6,
        height=h - 16,
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=DARK,
        fillColor=WHITE,
        borderColor=colors.Color(0, 0, 0, 0),
        borderWidth=0,
        forceBorder=False,
    )


def _qr_box(c, x, y, w, h):
    """Dashed placeholder for pasting a printed QR code."""
    c.setFillColor(WHITE)
    c.setStrokeColor(HexColor('#AAAAAA'))
    c.setLineWidth(1)
    c.setDash(5, 3)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
    c.setDash()
    c.setFillColor(HexColor('#CCCCCC'))
    c.setFont('Helvetica', 8)
    c.drawCentredString(x + w / 2, y + h / 2 - 4, 'PEGAR QR AQUÍ')


def _pinwheel(c, cx, cy, size):
    """
    ARI pinwheel-of-houses logo.
    Replicates the SVG: 6 houses radiating from centre, each rotated 60°.
    SVG coordinates are y-down; we flip by negating y when converting to PDF.
    """
    sc = size / 100.0

    for i in range(6):
        c.saveState()
        c.translate(cx, cy)
        c.rotate(-i * 60)            # SVG clockwise → PDF counterclockwise
        c.translate(0, 34 * sc)      # house sits 34 units above the logo centre

        # Body: SVG (0,-9)(8,0)(8,10)(-8,10)(-8,0) → flip y → (0,9)(8,0)(8,-10)(-8,-10)(-8,0)
        s = sc
        body = [(0, 9*s), (8*s, 0), (8*s, -10*s), (-8*s, -10*s), (-8*s, 0)]
        p = c.beginPath()
        p.moveTo(*body[0])
        for pt in body[1:]:
            p.lineTo(*pt)
        p.close()
        c.setFillColor(DARK)
        c.drawPath(p, fill=1, stroke=0)

        # Roof: SVG (-10,0)(0,-10)(10,0) → flip y → (-10,0)(0,10)(10,0)
        roof = [(-10*s, 0), (0, 10*s), (10*s, 0)]
        p = c.beginPath()
        p.moveTo(*roof[0])
        for pt in roof[1:]:
            p.lineTo(*pt)
        p.close()
        c.drawPath(p, fill=1, stroke=0)

        # Window: SVG rect x=-2.5 y=4 w=5 h=6 → flip y: y_pdf = -(4+6) = -10, h=6
        c.setFillColor(YELLOW)
        c.rect(-2.5*s, -10*s, 5*s, 6*s, fill=1, stroke=0)

        c.restoreState()

    # Centre dot
    c.setFillColor(DARK)
    c.circle(cx, cy, 4 * sc, fill=1, stroke=0)


# ─────────────────────────────────────────────────────────────────────────────
# Front page
# ─────────────────────────────────────────────────────────────────────────────

def draw_front(c):
    _tag_bg(c)
    _hook_hole(c)
    _divider(c)

    bx = TX + PX
    bw = TAG_W - 2 * PX

    # Cursor starts at top of body and moves downward
    y = TY + BODY_H - PY

    # "RESIDENTES" banner
    bh = 0.65 * cm
    y -= bh
    _banner(c, bx, y, bw, bh, 'RESIDENTES', size=13)

    # Pinwheel logo + "ARI" text
    logo_size = 1.8 * cm
    row_h = logo_size + 0.1 * cm
    y -= 0.3 * cm + row_h
    logo_cx = TX + TAG_W / 2 - 1.0 * cm
    logo_cy = y + row_h / 2
    _pinwheel(c, logo_cx, logo_cy, logo_size)
    c.setFont('Helvetica-BoldOblique', 34)
    c.setFillColor(DARK)
    c.drawString(logo_cx + 1.15 * cm, logo_cy - 0.52 * cm, 'ARI')

    # "No. de Casa" field + AcroForm
    fh = 1.35 * cm
    y -= 0.3 * cm + fh
    _field_box(c, bx, y, bw, fh, 'No. de Casa')
    _acro_text(c, 'casa', 'Número de Casa', bx, y, bw, fh)

    # "Placas del vehículo" field + AcroForm
    y -= 0.3 * cm + fh
    _field_box(c, bx, y, bw, fh, 'Placas del vehículo')
    _acro_text(c, 'placas', 'Placas del vehículo', bx, y, bw, fh)

    # QR zone: fills the remaining space above the bottom padding
    qr_top = y - 0.3 * cm
    qr_bot = TY + PY
    _qr_box(c, bx, qr_bot, bw, qr_top - qr_bot)


# ─────────────────────────────────────────────────────────────────────────────
# Back page
# ─────────────────────────────────────────────────────────────────────────────

def draw_back(c):
    _tag_bg(c)
    _hook_hole(c)
    _divider(c)

    bx = TX + PX
    bw = TAG_W - 2 * PX

    y = TY + BODY_H - PY

    # "REGLAS DE USO" banner
    bh = 0.6 * cm
    y -= bh
    _banner(c, bx, y, bw, bh, 'REGLAS DE USO', size=11)

    # Rules (bold intro + normal continuation)
    rules = [
        ('- Debe ser visible colocarse en', True),
        ('  el espejo retrovisor.', False),
        ('- Es intransferible entre casas o', True),
        ('  vehículos ajenos a la colonia.', False),
        ('- En caso de extravío reportarlo a', True),
        ('  la Administración ARI Santa Ana.', False),
        ('- Se prohíbe alterarlo y/o modificarlo.', True),
    ]
    y -= 0.2 * cm
    for text, bold in rules:
        y -= 8.5 * 1.3
        c.setFont('Helvetica-Bold' if bold else 'Helvetica', 8.5)
        c.setFillColor(DARK)
        c.drawString(bx + 2, y, text)

    # "EMERGENCIAS" banner
    y -= 0.3 * cm + bh
    _banner(c, bx, y, bw, bh, 'EMERGENCIAS', size=11)

    # Emergency block contents
    items = [
        ('Caseta 1 "Santa Ana"',  True,  9),
        ('Tel. 55 21550957',      False, 9),
        ('Cel. Vig. 55 41311374', False, 9),
        None,                              # horizontal rule
        ('Cuadrante 16',          True,  9),
        ('55 46 05 76 93',        False, 9),
        None,
        ('EMERGENCIAS',           True,  9.5),
        ('911',                   True,  18),
    ]

    # Calculate box height
    box_h = 0.3 * cm
    for item in items:
        box_h += 5 if item is None else item[2] * 1.45

    y -= 0.2 * cm + box_h
    c.setFillColor(WHITE)
    c.setStrokeColor(DARK2)
    c.setLineWidth(1.5)
    c.roundRect(bx, y, bw, box_h, 3, fill=1, stroke=1)

    iy = y + box_h - 0.1 * cm
    for item in items:
        if item is None:
            iy -= 5
            c.setStrokeColor(LIGHT_GRAY)
            c.setLineWidth(0.5)
            c.line(bx + 8, iy, bx + bw - 8, iy)
        else:
            text, bold, size = item
            iy -= size * 1.45
            c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
            c.setFillColor(DARK)
            c.drawCentredString(bx + bw / 2, iy, text)

    # Footer
    c.setFont('Helvetica-Bold', 7)
    c.setFillColor(GRAY)
    c.drawCentredString(
        TX + TAG_W / 2,
        TY + 0.2 * cm,
        'COMITÉ DE VIGILANCIA COLECTIVA · ARI SANTA ANA',
    )


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gafete-vehicular.pdf')
    c = rlcanvas.Canvas(out, pagesize=A4)
    c.setTitle('Gafete Vehicular ARI — Residentes')
    c.setAuthor('ARI Santa Ana')

    draw_front(c)
    c.showPage()
    draw_back(c)
    c.showPage()

    c.save()
    print(f'PDF generado: {out}')


if __name__ == '__main__':
    main()