// src/lib/pdf/gift-card-pdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generatePDF(card: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 400])
  const { width, height } = page.getSize()
  
  // ✅ Load fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Background with gradient-like effect
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.95, 0.98),
    borderColor: rgb(0.9, 0.4, 0.6),
    borderWidth: 2,
  })

  // Decorative top border
  page.drawRectangle({
    x: 0,
    y: height - 10,
    width,
    height: 10,
    color: rgb(0.8, 0.2, 0.4),
  })

  // ✅ Title - using fontBold
  page.drawText('🎁 GIFT CARD', {
    x: 50,
    y: height - 60,
    size: 28,
    font: fontBold, // ✅ Use font property
    color: rgb(0.6, 0.2, 0.4),
  })

  // Amount - using fontBold
  page.drawText(`KSh ${card.amount.toLocaleString()}`, {
    x: 50,
    y: height - 120,
    size: 48,
    font: fontBold, // ✅ Use font property
    color: rgb(0.8, 0.2, 0.4),
  })

  // Divider line
  page.drawLine({
    start: { x: 50, y: height - 145 },
    end: { x: width - 50, y: height - 145 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Code label - using fontBold
  page.drawText('Gift Card Code:', {
    x: 50,
    y: height - 180,
    size: 14,
    font: fontBold, // ✅ Use font property
    color: rgb(0.3, 0.3, 0.3),
  })

  // Code value - using fontBold with larger size
  page.drawText(card.code, {
    x: 50,
    y: height - 215,
    size: 32,
    font: fontBold, // ✅ Use font property
    color: rgb(0.1, 0.1, 0.1),
  })

  // ✅ Recipient info - using fontRegular
  page.drawText(`To: ${card.recipient_name}`, {
    x: 50,
    y: height - 275,
    size: 14,
    font: fontRegular, // ✅ Use font property
    color: rgb(0.2, 0.2, 0.2),
  })

  // Sender info - using fontRegular
  page.drawText(`From: ${card.sender_name || 'Mystic Wines'}`, {
    x: 50,
    y: height - 300,
    size: 14,
    font: fontRegular, // ✅ Use font property
    color: rgb(0.2, 0.2, 0.2),
  })

  // ✅ Expiry - using fontRegular
  const expiryDate = new Date(card.expires_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  page.drawText(`Expires: ${expiryDate}`, {
    x: 50,
    y: height - 330,
    size: 12,
    font: fontRegular, // ✅ Use font property
    color: rgb(0.5, 0.5, 0.5),
  })

  // ✅ Footer - using fontRegular
  page.drawText('Terms: This gift card is non-refundable and cannot be exchanged for cash.', {
    x: 50,
    y: 50,
    size: 10,
    font: fontRegular, // ✅ Use font property
    color: rgb(0.5, 0.5, 0.5),
  })

  // ✅ Add decorative corner elements
  const cornerSize = 20
  const corners = [
    { x: 0, y: 0, dx: 1, dy: 1 },
    { x: width, y: 0, dx: -1, dy: 1 },
    { x: 0, y: height, dx: 1, dy: -1 },
    { x: width, y: height, dx: -1, dy: -1 },
  ]

  for (const corner of corners) {
    const cx = corner.x + (corner.dx > 0 ? 0 : 0)
    const cy = corner.y + (corner.dy > 0 ? 0 : 0)
    
    page.drawLine({
      start: { x: corner.x, y: corner.y + corner.dy * cornerSize },
      end: { x: corner.x + corner.dx * cornerSize, y: corner.y },
      thickness: 2,
      color: rgb(0.8, 0.2, 0.4),
    })
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}