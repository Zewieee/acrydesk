import type { Request, Response } from 'express';
import Message from '../models/Message.model.js';
import CustomerRequest from '../models/Request.model.js';
import User from '../models/User.model.js';
import { createNotification } from './notification.controller.js';

export const getMessages = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // Authorization: User must be related to the request, or a staff member
    if (req.userRole === 'customer') {
      const rfq = await CustomerRequest.findById(requestId);
      if (!rfq || rfq.createdBy?.toString() !== req.userId) {
        res.status(403).json({ message: 'Không có quyền truy cập' });
        return;
      }
    }

    const messages = await Message.find({ requestId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 }); // Oldest first for chat

    res.json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { content, attachments } = req.body;

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      res.status(400).json({ message: 'Nội dung tin nhắn hoặc file đính kèm không được để trống' });
      return;
    }

    const rfq = await CustomerRequest.findById(requestId);
    if (!rfq) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
      return;
    }

    // Authorization
    if (req.userRole === 'customer' && rfq.createdBy?.toString() !== req.userId) {
      res.status(403).json({ message: 'Không có quyền truy cập' });
      return;
    }

    const message = await Message.create({
      requestId,
      senderId: req.userId,
      senderRole: req.userRole,
      content: content || '',
      attachments: attachments || [],
    });

    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name email role');

    const preview = (content || (attachments?.length > 0 ? '[Tệp đính kèm]' : '')).substring(0, 80);

    // Emit socket.io event to room (cho người đang mở tab chat)
    const io = req.app.get('io');
    if (io) {
      io.to(requestId).emit('new_message', populatedMessage);
    }

    // Notify the other party
    if (req.userRole === 'customer') {
      // DB notification cho staff
      await createNotification(
        null,
        ['sales', 'manager', 'engineer'],
        'Tin nhắn mới từ khách hàng',
        `[${rfq.code}] ${rfq.customerName}: "${preview}"`,
        requestId,
        'new_message'
      );
      // Popup realtime cho từng staff
      if (io) {
        const staffUsers = await User.find({ role: { $in: ['sales', 'manager', 'engineer'] } }).select('_id');
        staffUsers.forEach(u => {
          io.to(u._id.toString()).emit('new_message_popup', {
            rfqId: requestId,
            rfqCode: rfq.code,
            senderName: rfq.customerName,
            preview,
          });
        });
      }
    } else {
      // DB notification cho customer
      if (rfq.createdBy) {
        const senderName = (populatedMessage as any).senderId?.name || 'Nhân viên';
        await createNotification(
          rfq.createdBy.toString(),
          [],
          'Tin nhắn mới từ nhân viên',
          `[${rfq.code}] ${senderName}: "${preview}"`,
          requestId,
          'new_message'
        );
        // Popup realtime cho customer
        if (io) {
          io.to(rfq.createdBy.toString()).emit('new_message_popup', {
            rfqId: requestId,
            rfqCode: rfq.code,
            senderName,
            preview,
          });
        }
      }
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
