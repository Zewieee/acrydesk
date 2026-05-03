import type { Request, Response } from 'express';
import CustomerRequest from '../models/Request.model.js';
import Quotation from '../models/Quotation.model.js';
import { notifyStaffNewRFQ, createNotification } from './notification.controller.js';

// Helper: tự động generate mã RFQ dạng RFQ-2024-001
const generateCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;
  const lastRequest = await CustomerRequest.findOne({ code: { $regex: `^${prefix}` } })
    .sort({ code: -1 })
    .lean() as { code?: string } | null;

  let nextNumber = 1;
  if (lastRequest && lastRequest.code) {
    const suffix = lastRequest.code.replace(prefix, '');
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

export const createRequest = async (req: any, res: Response) => {
  try {
    const code = await generateCode();
    const request = await CustomerRequest.create({
      ...req.body,
      code,
      createdBy: req.userId,
    });

    // Thông báo cho staff khi customer tạo RFQ mới
    if (req.userRole === 'customer') {
      notifyStaffNewRFQ(code, req.body.customerName || 'Khách hàng', request._id.toString());
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const getRequests = async (req: any, res: Response) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const filter: any = {};

    // Customer chỉ thấy requests của mình
    if (req.userRole === 'customer') {
      filter.createdBy = req.userId;
    }

    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'items.productType': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await CustomerRequest.countDocuments(filter);
    const requests = await CustomerRequest.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ requests, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('getRequests error:', error);
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const getRequestById = async (req: any, res: Response) => {
  try {
    const request = await CustomerRequest.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }

    // Customer chỉ xem được request của mình
    if (req.userRole === 'customer' && request.createdBy?.toString() !== req.userId) {
      res.status(403).json({ message: 'Khong co quyen truy cap' });
      return;
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const updateRequest = async (req: any, res: Response) => {
  try {
    // Customer chỉ sửa request của mình khi còn pending
    if (req.userRole === 'customer') {
      const existing = await CustomerRequest.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: 'Khong tim thay yeu cau' });
        return;
      }
      if (existing.createdBy?.toString() !== req.userId) {
        res.status(403).json({ message: 'Khong co quyen chinh sua' });
        return;
      }
      if (existing.status !== 'pending') {
        res.status(400).json({ message: 'Chi co the sua yeu cau dang cho xu ly' });
        return;
      }
    }

    const request = await CustomerRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const updateRequestStatus = async (req: any, res: Response) => {
  try {
    // Customer không được đổi trạng thái
    if (req.userRole === 'customer') {
      res.status(403).json({ message: 'Khong co quyen thay doi trang thai' });
      return;
    }

    const { status } = req.body;
    const request = await CustomerRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const assignRequest = async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;
    const request = await CustomerRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'engineering' },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const updateProductionStage = async (req: any, res: Response) => {
  try {
    const { productionStage } = req.body;
    const request = await CustomerRequest.findByIdAndUpdate(
      req.params.id,
      { productionStage },
      { new: true }
    );
    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const deleteRequest = async (req: any, res: Response) => {
  try {
    // Customer chỉ xóa request của mình khi còn pending
    if (req.userRole === 'customer') {
      const existing = await CustomerRequest.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: 'Khong tim thay yeu cau' });
        return;
      }
      if (existing.createdBy?.toString() !== req.userId) {
        res.status(403).json({ message: 'Khong co quyen xoa' });
        return;
      }
      if (existing.status !== 'pending') {
        res.status(400).json({ message: 'Chi co the xoa yeu cau dang cho xu ly' });
        return;
      }
    }

    const request = await CustomerRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      res.status(404).json({ message: 'Khong tim thay yeu cau' });
      return;
    }

    // Xóa tất cả báo giá liên quan đến RFQ này
    await Quotation.deleteMany({ requestId: req.params.id });

    res.json({ message: 'Xoa thanh cong' });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error });
  }
};

export const submitFeedback = async (req: any, res: Response) => {
  try {
    const { rating, comment } = req.body;
    
    if (req.userRole !== 'customer') {
      res.status(403).json({ message: 'Chỉ khách hàng mới có thể đánh giá' });
      return;
    }

    const request = await CustomerRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
      return;
    }

    if (request.createdBy?.toString() !== req.userId) {
      res.status(403).json({ message: 'Không có quyền truy cập' });
      return;
    }

    if (request.status !== 'completed' && request.status !== 'approved') {
       res.status(400).json({ message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành hoặc được duyệt' });
       return;
    }

    request.feedback = {
      rating,
      comment,
      createdAt: new Date()
    };

    await request.save();

    // Create notification for staff
    await createNotification(
      request.assignedTo ? request.assignedTo.toString() : null,
      ['manager', 'sales', 'engineer'],
      'Đánh giá mới từ Khách hàng',
      `Khách hàng ${request.customerName} đã để lại đánh giá ${rating} sao cho đơn hàng ${request.code}`,
      request._id.toString()
    );

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};