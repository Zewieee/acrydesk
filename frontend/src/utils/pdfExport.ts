import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportQuotationToPDF = async (quotation: any, companyName: string = 'ACRYDESK CO., LTD') => {
  const doc = new jsPDF();
  
  // Tải font hỗ trợ tiếng Việt (Roboto)
  try {
    // Sử dụng CDN cdnjs cho Roboto Regular
    const fontRes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf');
    if (fontRes.ok) {
      const buffer = await fontRes.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fontBase64 = window.btoa(binary);
      
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    }
  } catch (error) {
    console.warn('Không thể tải font, sử dụng font mặc định', error);
  }
  
  // Set font size and styling
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('BÁO GIÁ', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(companyName, 14, 30);
  // doc.text('Email: mttnguyen03@gmail.com', 14, 35);
  // doc.text('Số điện thoại: 0123.456.789', 14, 40);
  
  doc.text(`Mã số: ${quotation.requestId?.code || 'N/A'}`, 196, 30, { align: 'right' });
  doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`, 196, 35, { align: 'right' });
  
  // Thông tin khách hàng
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('Gửi tới:', 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Khách hàng: ${quotation.requestId?.customerName || 'N/A'}`, 14, 62);
  doc.text(`Email: ${quotation.requestId?.customerEmail || 'N/A'}`, 14, 67);
  doc.text(`SDT: ${quotation.requestId?.customerPhone || 'N/A'}`, 14, 72);
  
  // Bảng sản phẩm
  const tableColumn = ["STT", "Hạng mục", "Số lượng", "Đơn giá", "Thành tiền"];
  const tableRows: any[] = [];
  
  quotation.items.forEach((item: any, index: number) => {
    const itemData = [
      index + 1,
      item.productName,
      item.quantity,
      `${item.unitPrice.toLocaleString('vi-VN')} VND`,
      `${item.totalPrice.toLocaleString('vi-VN')} VND`
    ];
    tableRows.push(itemData);
  });
  
  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'normal' },
    styles: { font: 'Roboto', fontSize: 10, fontStyle: 'normal' },
  });
  
  // Custom font is not loaded (vietnamese encoding may fail with default helvetica), 
  // but for presentation purposes ascii/english letters mapping works.
  
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  
  // Tổng kết block
  doc.setFontSize(10);
  doc.text('Tạm tính:', 130, finalY + 10);
  doc.text(`${quotation.subTotal.toLocaleString('vi-VN')} VND`, 196, finalY + 10, { align: 'right' });
  
  doc.text(`VAT (${quotation.tax || 0}%):`, 130, finalY + 16);
  doc.text(`${(quotation.subTotal * (quotation.tax / 100)).toLocaleString('vi-VN')} VND`, 196, finalY + 16, { align: 'right' });
  
  if (quotation.discount > 0) {
    doc.text('Giảm giá:', 130, finalY + 22);
    doc.text(`-${quotation.discount.toLocaleString('vi-VN')} VND`, 196, finalY + 22, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('Tổng cộng:', 130, finalY + 30);
  doc.text(`${quotation.totalAmount.toLocaleString('vi-VN')} VND`, 196, finalY + 30, { align: 'right' });
  
  // Ghi chú
  if(quotation.notes) {
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text('Ghi chú:', 14, finalY + 40);
      const splitNotes = doc.splitTextToSize(quotation.notes, 180);
      doc.text(splitNotes, 14, finalY + 45);
  }
  
  // Lưu file
  doc.save(`BaoGia_${quotation.requestId?.code || Date.now()}.pdf`);
};
