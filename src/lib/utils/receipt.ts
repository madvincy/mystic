// src/lib/utils/receipt.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
  };
}

interface OrderData {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  order_items: OrderItem[];
  user_email?: string;
}

export async function generateReceiptPDF(orderData: OrderData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Get standard fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Colors
  const pink = rgb(0.93, 0.28, 0.6);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const white = rgb(1, 1, 1);
  const green = rgb(0, 0.6, 0.2);
  
  let y = height - 50;
  
  // === HEADER ===
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width: width,
    height: 60,
    color: pink,
  });
  
  // Company Name
  page.drawText('MYSTIC WINES', {
    x: 50,
    y: height - 35,
    size: 28,
    font: fontBold,
    color: white,
  });
  
  // Tagline
  page.drawText('Premium Wines & Spirits', {
    x: 50,
    y: height - 48,
    size: 10,
    font: font,
    color: white,
  });
  
  // Receipt Title
  page.drawText('RECEIPT', {
    x: 50,
    y: height - 85,
    size: 22,
    font: fontBold,
    color: darkGray,
  });
  
  // Divider line
  page.drawLine({
    start: { x: 50, y: height - 95 },
    end: { x: width - 50, y: height - 95 },
    thickness: 2,
    color: pink,
  });
  
  y = height - 110;
  
  // === ORDER DETAILS ===
  page.drawText(`Order #: ${orderData.order_number}`, {
    x: 50,
    y: y,
    size: 10,
    font: font,
    color: gray,
  });
  
  page.drawText(`Date: ${new Date(orderData.created_at).toLocaleString()}`, {
    x: 50,
    y: y - 15,
    size: 10,
    font: font,
    color: gray,
  });
  
  // === CUSTOMER DETAILS ===
  y = y - 45;
  
  page.drawText('Customer Details', {
    x: 50,
    y: y,
    size: 14,
    font: fontBold,
    color: darkGray,
  });
  
  y = y - 20;
  
  const address = orderData.shipping_address || {};
  const customerDetails = [
    `Name: ${address.name || 'N/A'}`,
    `Email: ${address.email || orderData.user_email || 'N/A'}`,
    `Phone: ${address.phone || 'N/A'}`,
    `Address: ${address.address || 'N/A'}, ${address.city || ''}, ${address.country || 'Kenya'}`,
  ];
  
  customerDetails.forEach((detail) => {
    page.drawText(detail, {
      x: 50,
      y: y,
      size: 10,
      font: font,
      color: gray,
    });
    y = y - 15;
  });
  
  // === PAYMENT DETAILS ===
  y = y - 10;
  
  page.drawText('Payment Details', {
    x: 50,
    y: y,
    size: 14,
    font: fontBold,
    color: darkGray,
  });
  
  y = y - 20;
  
  page.drawText(`Method: ${orderData.payment_method || 'M-Pesa'}`, {
    x: 50,
    y: y,
    size: 10,
    font: font,
    color: gray,
  });
  
  const paymentStatusText = orderData.payment_status === 'paid' ? '✅ Paid' : 'Pending';
  page.drawText(`Status: ${paymentStatusText}`, {
    x: 50,
    y: y - 15,
    size: 10,
    font: font,
    color: orderData.payment_status === 'paid' ? green : gray,
  });
  
  // === ITEMS TABLE ===
  y = y - 45;
  
  page.drawText('Order Items', {
    x: 50,
    y: y,
    size: 14,
    font: fontBold,
    color: darkGray,
  });
  
  y = y - 15;
  
  // Table headers
  const tableHeaders = ['Item', 'Qty', 'Price', 'Total'];
  const colWidths = [200, 50, 100, 120];
  const startX = 50;
  let tableY = y - 10;
  
  // Draw header background
  page.drawRectangle({
    x: startX,
    y: tableY - 15,
    width: colWidths.reduce((a, b) => a + b, 0),
    height: 25,
    color: pink,
  });
  
  // Draw header text
  let currentX = startX + 10;
  tableHeaders.forEach((header, index) => {
    page.drawText(header, {
      x: currentX,
      y: tableY,
      size: 10,
      font: fontBold,
      color: white,
    });
    currentX += colWidths[index];
  });
  
  tableY = tableY - 20;
  
  // Draw table rows
  const items = orderData.order_items || [];
  let rowCount = 0;
  
  items.forEach((item: OrderItem) => {
    const itemName = item.product?.name || 'Product';
    const quantity = item.quantity || 1;
    const price = item.price || 0;
    const total = price * quantity;
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      page.drawRectangle({
        x: startX,
        y: tableY - 12,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
      });
    }
    
    let rowX = startX + 10;
    
    // Item name
    page.drawText(itemName.length > 30 ? itemName.substring(0, 27) + '...' : itemName, {
      x: rowX,
      y: tableY,
      size: 9,
      font: font,
      color: darkGray,
    });
    rowX += colWidths[0];
    
    // Quantity
    page.drawText(quantity.toString(), {
      x: rowX + (colWidths[1] / 2) - 5,
      y: tableY,
      size: 9,
      font: font,
      color: darkGray,
    });
    rowX += colWidths[1];
    
    // Price
    page.drawText(`KSh ${price.toLocaleString()}`, {
      x: rowX + 10,
      y: tableY,
      size: 9,
      font: font,
      color: darkGray,
    });
    rowX += colWidths[2];
    
    // Total
    page.drawText(`KSh ${total.toLocaleString()}`, {
      x: rowX + 20,
      y: tableY,
      size: 9,
      font: fontBold,
      color: darkGray,
    });
    
    tableY = tableY - 20;
    rowCount++;
  });
  
  // Total line
  tableY = tableY - 5;
  page.drawLine({
    start: { x: startX, y: tableY + 10 },
    end: { x: startX + colWidths.reduce((a, b) => a + b, 0), y: tableY + 10 },
    thickness: 1,
    color: darkGray,
  });
  
  // Total amount
  page.drawText(`Total: KSh ${orderData.total_amount?.toLocaleString() || '0'}`, {
    x: width - 50 - 120,
    y: tableY - 10,
    size: 16,
    font: fontBold,
    color: rgb(0.93, 0.28, 0.6),
  });
  
  // === FOOTER ===
  const footerY = 50;
  
  page.drawLine({
    start: { x: 50, y: footerY + 20 },
    end: { x: width - 50, y: footerY + 20 },
    thickness: 1,
    color: lightGray,
  });
  
  // Center text manually
  const thankYouText = 'Thank you for shopping with Mystic Wines!';
  const thankYouWidth = fontBold.widthOfTextAtSize(thankYouText, 10);
  page.drawText(thankYouText, {
    x: (width - thankYouWidth) / 2,
    y: footerY,
    size: 10,
    font: fontBold,
    color: darkGray,
  });
  
  const contactText = 'For inquiries, contact us on +254 710 835 445';
  const contactWidth = font.widthOfTextAtSize(contactText, 8);
  page.drawText(contactText, {
    x: (width - contactWidth) / 2,
    y: footerY - 15,
    size: 8,
    font: font,
    color: lightGray,
  });
  
  const emailText = 'Email: info@mysticwines.co.ke | Website: mysticwines.co.ke';
  const emailWidth = font.widthOfTextAtSize(emailText, 8);
  page.drawText(emailText, {
    x: (width - emailWidth) / 2,
    y: footerY - 30,
    size: 8,
    font: font,
    color: lightGray,
  });
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  
  // ✅ Convert to regular Uint8Array
  return new Uint8Array(pdfBytes);
}

// ✅ Helper function to convert Uint8Array to Blob safely
function uint8ArrayToBlob(uint8Array: Uint8Array, mimeType: string): Blob {
  // Create a new ArrayBuffer from the Uint8Array
  const arrayBuffer = new ArrayBuffer(uint8Array.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(uint8Array);
  
  // Create Blob from the ArrayBuffer
  return new Blob([arrayBuffer], { type: mimeType });
}

// Helper function to download the receipt
export async function downloadReceipt(orderData: OrderData): Promise<boolean> {
  try {
    const pdfBytes = await generateReceiptPDF(orderData);
    
    // ✅ Use the helper function to create blob
    const blob = uint8ArrayToBlob(pdfBytes, 'application/pdf');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${orderData.order_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw error;
  }
}

// Helper function to open receipt in new tab
export async function previewReceipt(orderData: OrderData): Promise<void> {
  try {
    const pdfBytes = await generateReceiptPDF(orderData);
    const blob = uint8ArrayToBlob(pdfBytes, 'application/pdf');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Error previewing receipt:', error);
    throw error;
  }
}

// Helper function to get receipt as base64 (for embedding in emails)
export async function getReceiptBase64(orderData: OrderData): Promise<string> {
  try {
    const pdfBytes = await generateReceiptPDF(orderData);
    const blob = uint8ArrayToBlob(pdfBytes, 'application/pdf');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error generating base64 receipt:', error);
    throw error;
  }
}

// Helper function to get receipt as Buffer (for server-side use)
export async function getReceiptBuffer(orderData: OrderData): Promise<Buffer> {
  try {
    const pdfBytes = await generateReceiptPDF(orderData);
    // Create ArrayBuffer and convert to Buffer
    const arrayBuffer = new ArrayBuffer(pdfBytes.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(pdfBytes);
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating receipt buffer:', error);
    throw error;
  }
}

// ✅ Alternative: Simple download function that works with any browser
export async function downloadReceiptSimple(orderData: OrderData): Promise<void> {
  try {
    const pdfBytes = await generateReceiptPDF(orderData);
    const blob = uint8ArrayToBlob(pdfBytes, 'application/pdf');
    
    // Use the native download API
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receipt-${orderData.order_number}.pdf`;
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw error;
  }
}