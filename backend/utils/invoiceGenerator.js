const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

/**
 * Generates a premium PDF invoice buffer for a hotel booking
 * @param {Object} booking - The populated booking object
 * @returns {Buffer} - The PDF as a Buffer
 */
const generateInvoicePDF = (booking) => {
    const doc = new jsPDF();
    
    // Null-safe accessors
    const room = booking.room || {};
    const hotel = room.hotel || {};
    const user = booking.user || {};

    // --- Header / Branding ---
    doc.setFillColor(109, 93, 252); // Brand Purple
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ELITE STAYS', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LUXURY LIVING REDEFINED', 20, 32);
    
    doc.setFontSize(12);
    doc.text('INVOICE / RECEIPT', 150, 25);

    // --- Invoice Metadata ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Invoice No: INV-${booking._id?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}`, 20, 50);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, 56);
    doc.text(`Booking ID: ${booking._id || 'N/A'}`, 20, 62);

    // --- Billed To vs Hotel Info ---
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 20, 75);
    doc.text('HOTEL INFORMATION:', 110, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.text(user.name || 'Guest', 20, 81);
    doc.text(user.email || '', 20, 87);
    
    doc.text(hotel.name || 'Elite Stay Property', 110, 81);
    doc.text(hotel.address || 'Propety Address', 110, 87);
    doc.text(`${hotel.city || ''}`, 110, 93);

    // --- Booking Summary Table ---
    const tableData = [
        ['Room Type', room.name || 'Premium Room'],
        ['Stay Duration', `${new Date(booking.checkInDate).toLocaleDateString()} - ${new Date(booking.checkOutDate).toLocaleDateString()}`],
        ['Total Nights', Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)).toString()],
        ['Guests', `${room.maxGuests || 2} Adults`],
        ['Payment Method', booking.paymentMethod || (booking.paymentId ? 'Online' : 'Card/UPI')],
        ['Status', booking.paymentStatus === 'Paid' ? 'PAID (Verified)' : 'PENDING / AT HOTEL']
    ];

    autoTable(doc, {
        startY: 105,
        head: [['Description', 'Details']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [109, 93, 252], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
    });

    // --- Total Section ---
    const finalY = (doc.lastAutoTable?.finalY || 180) + 15;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, finalY, 190, finalY);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT:', 25, finalY + 12);
    doc.text(`INR ${booking.totalPrice?.toLocaleString() || '0'}`, 155, finalY + 12, { align: 'right' });

    // --- Footer / Terms ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Terms & Conditions:', 20, 250);
    doc.text('1. This invoice is computer-generated and confirms successful payment.', 20, 256);
    doc.text('2. Please present a digital copy of this invoice at check-in.', 20, 262);
    doc.text('3. Cancellation policies apply as per hotel standards.', 20, 268);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 93, 252);
    doc.text('Thank you for choosing Elite Stays! Enjoy your luxury stay.', 105, 285, { align: 'center' });

    // Convert to buffer for Nodemailer and Downloads
    const pdfData = doc.output('arraybuffer');
    return Buffer.from(pdfData);
};

module.exports = generateInvoicePDF;
