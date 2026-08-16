import PDFDocument from 'pdfkit';

/**
 * Generates a styled invoice PDF using PDFKit and pipes it to a stream or resolves as a buffer.
 * @param {Object} invoice Invoice mongoose document or object (populated with client)
 * @param {Object} company Company mongoose document or object
 * @returns {Promise<Buffer>} Resolves to PDF data buffer
 */
export function generateInvoicePDF(invoice, company) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Colors
    const primaryColor = '#1e293b'; // Slate 800
    const secondaryColor = '#475569'; // Slate 600
    const accentColor = '#0d9488'; // Teal 600
    const lightBg = '#f8fafc'; // Slate 50
    const borderColor = '#e2e8f0'; // Slate 200

    // Header Stripe
    doc.rect(0, 0, 595.28, 15).fill(accentColor);

    // 1. Company Logo & Title
    doc.fillColor(primaryColor)
       .fontSize(20)
       .text(company.name || 'Your Company', 50, 40)
       .fontSize(10)
       .fillColor(secondaryColor)
       .text(company.address || '', 50, 65)
       .text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`, 50, 78)
       .text(`Tax No: ${company.taxNumber || ''}`, 50, 91);

    // Invoice Title & Info (Top Right)
    doc.fillColor(primaryColor)
       .fontSize(24)
       .text('INVOICE', 400, 40, { align: 'right' })
       .fontSize(10)
       .fillColor(secondaryColor)
       .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 70, { align: 'right' })
       .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 83, { align: 'right' })
       .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 96, { align: 'right' })
       .text(`Status: ${invoice.status.toUpperCase()}`, 400, 109, { align: 'right', colors: accentColor });

    // Divider Line
    doc.moveTo(50, 135).lineTo(545, 135).strokeColor(borderColor).stroke();

    // 2. Bill To & Payment Details
    const client = invoice.client || {};
    doc.fillColor(primaryColor)
       .fontSize(12)
       .text('Bill To:', 50, 155)
       .fontSize(10)
       .fillColor(secondaryColor)
       .text(client.name || 'Client Name', 50, 172)
       .text(client.address || '', 50, 185)
       .text(`Email: ${client.email || ''}`, 50, 198)
       .text(`Phone: ${client.phone || ''}`, 50, 211)
       .text(`Tax ID: ${client.taxNumber || ''}`, 50, 224);

    // Payment Terms (Right Side)
    doc.fillColor(primaryColor)
       .fontSize(12)
       .text('Payment Details:', 350, 155)
       .fontSize(10)
       .fillColor(secondaryColor)
       .text(`Terms: ${invoice.paymentTerms || 'Due on Receipt'}`, 350, 172)
       .text(`Currency: ${invoice.currency}`, 350, 185);

    if (company.bankDetails && company.bankDetails.bankName) {
      doc.text(`Bank: ${company.bankDetails.bankName}`, 350, 198)
         .text(`A/C Name: ${company.bankDetails.accountName || ''}`, 350, 211)
         .text(`A/C No: ${company.bankDetails.accountNumber || ''}`, 350, 224)
         .text(`IFSC/SWIFT: ${company.bankDetails.ifscOrSwift || ''}`, 350, 237);
    }

    // Divider Line
    doc.moveTo(50, 260).lineTo(545, 260).strokeColor(borderColor).stroke();

    // 3. Line Items Table Header
    let y = 280;
    doc.rect(50, y, 495, 20).fill(lightBg);
    
    doc.fillColor(primaryColor)
       .fontSize(10)
       .text('Description', 60, y + 5, { width: 220 })
       .text('Qty', 300, y + 5, { width: 50, align: 'right' })
       .text('Unit Price', 370, y + 5, { width: 80, align: 'right' })
       .text('Total', 470, y + 5, { width: 70, align: 'right' });

    y += 20;

    // Line Items Rows
    const items = invoice.lineItems || [];
    items.forEach((item) => {
      // Check if page overflow
      if (y > 700) {
        doc.addPage();
        y = 50;
        // Reprint header
        doc.rect(50, y, 495, 20).fill(lightBg);
        doc.fillColor(primaryColor)
           .fontSize(10)
           .text('Description', 60, y + 5, { width: 220 })
           .text('Qty', 300, y + 5, { width: 50, align: 'right' })
           .text('Unit Price', 370, y + 5, { width: 80, align: 'right' })
           .text('Total', 470, y + 5, { width: 70, align: 'right' });
        y += 20;
      }

      doc.fillColor(secondaryColor)
         .fontSize(9)
         .text(item.description, 60, y + 6, { width: 220 })
         .text(item.quantity.toString(), 300, y + 6, { width: 50, align: 'right' })
         .text(item.unitPrice.toFixed(2), 370, y + 6, { width: 80, align: 'right' })
         .text(item.total.toFixed(2), 470, y + 6, { width: 70, align: 'right' });

      // Draw bottom border for item
      doc.moveTo(50, y + 20).lineTo(545, y + 20).strokeColor(borderColor).strokeWidth(0.5).stroke();
      y += 20;
    });

    // Space before summary
    y += 10;

    // 4. Totals Summary (Right Aligned)
    const rightColX = 350;
    const valueColX = 470;
    const formatCurrency = (val) => `${invoice.currency} ${val.toFixed(2)}`;

    doc.fillColor(secondaryColor)
       .fontSize(10)
       .text('Subtotal:', rightColX, y, { width: 110, align: 'right' })
       .text(formatCurrency(invoice.subtotal), valueColX, y, { width: 70, align: 'right' });
    y += 15;

    if (invoice.discountAmount > 0) {
      doc.text(`Discount (${invoice.discountRate}%):`, rightColX, y, { width: 110, align: 'right' })
         .text(`-${formatCurrency(invoice.discountAmount)}`, valueColX, y, { width: 70, align: 'right' });
      y += 15;
    }

    if (invoice.taxAmount > 0) {
      doc.text(`Tax (${invoice.taxRate}%):`, rightColX, y, { width: 110, align: 'right' })
         .text(formatCurrency(invoice.taxAmount), valueColX, y, { width: 70, align: 'right' });
      y += 15;
    }

    // Grand Total Divider
    doc.moveTo(rightColX + 30, y).lineTo(545, y).strokeColor(borderColor).stroke();
    y += 5;

    doc.fillColor(primaryColor)
       .fontSize(12)
       .text('Grand Total:', rightColX, y, { width: 110, align: 'right' })
       .text(formatCurrency(invoice.grandTotal), valueColX, y, { width: 70, align: 'right' });
    y += 20;

    doc.fontSize(10)
       .fillColor(secondaryColor)
       .text('Amount Paid:', rightColX, y, { width: 110, align: 'right' })
       .text(formatCurrency(invoice.amountPaid), valueColX, y, { width: 70, align: 'right' });
    y += 15;

    doc.fillColor(accentColor)
       .fontSize(11)
       .text('Amount Due:', rightColX, y, { width: 110, align: 'right' })
       .text(formatCurrency(invoice.grandTotal - invoice.amountPaid), valueColX, y, { width: 70, align: 'right' });
    y += 30;

    // Notes & Terms Footer
    if (invoice.notes) {
      doc.fillColor(primaryColor)
         .fontSize(10)
         .text('Notes / Instructions:', 50, y)
         .fontSize(9)
         .fillColor(secondaryColor)
         .text(invoice.notes, 50, y + 15, { width: 495 });
      y += doc.heightOfString(invoice.notes, { width: 495 }) + 25;
    }

    if (invoice.termsAndConditions) {
      doc.fillColor(primaryColor)
         .fontSize(10)
         .text('Terms & Conditions:', 50, y)
         .fontSize(9)
         .fillColor(secondaryColor)
         .text(invoice.termsAndConditions, 50, y + 15, { width: 495 });
    }

    doc.end();
  });
}
