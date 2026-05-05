import type { Request, Response } from 'express';
import CustomerRequest from '../models/Request.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';

export const getAllCustomerDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return;
    }

    const userEmail = user.email;

    // 1. Lấy tất cả Request của khách hàng này (theo email hoặc theo ID người tạo)
    const rfqs = await CustomerRequest.find({ 
      $or: [
        { customerEmail: userEmail },
        { createdBy: userId }
      ]
    }).sort({ createdAt: -1 });
    const rfqIds = rfqs.map(r => r._id);

    const documents: any[] = [];

    // 2. Gom tài liệu từ RFQ (đính kèm lúc tạo hoặc nhân viên thêm)
    rfqs.forEach(rfq => {
      if (rfq.attachments && rfq.attachments.length > 0) {
        rfq.attachments.forEach(url => {
          documents.push({
            id: `rfq-${rfq._id}-${url}`,
            name: url.split('/').pop() || 'Tài liệu không tên',
            url: url,
            type: 'request',
            rfqId: rfq._id,
            rfqCode: rfq.code,
            createdAt: rfq.createdAt,
          });
        });
      }
    });

    // 3. Gom tài liệu từ tin nhắn (Messages)
    const messages = await Message.find({ requestId: { $in: rfqIds } }).sort({ createdAt: -1 });
    
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          documents.push({
            id: `msg-${msg._id}-${att.url}`,
            name: att.name || att.url.split('/').pop(),
            url: att.url,
            type: 'message',
            rfqId: msg.requestId,
            rfqCode: rfqs.find(r => r._id.toString() === msg.requestId.toString())?.code || 'N/A',
            createdAt: msg.createdAt,
            fileType: att.type
          });
        });
      }
    });

    // Sắp xếp theo ngày mới nhất
    documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(documents);
  } catch (error) {
    console.error('Lỗi lấy tài liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
