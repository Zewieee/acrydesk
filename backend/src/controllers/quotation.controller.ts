import type { Response } from 'express';
import Quotation from '../models/Quotation.model.js';
import CustomerRequest from '../models/Request.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// Tạo báo giá cho 1 RFQ
export const createQuotation = async (req: any, res: Response) => {
  try {
    const { requestId, items, tax, discount, notes } = req.body;

    // Kiểm tra RFQ tồn tại
    const rfq = await CustomerRequest.findById(requestId);
    if (!rfq) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
      return;
    }

    // Tính toán giá
    const subTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const processedItems = items.map((item: any) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));
    const taxAmount = subTotal * ((tax || 0) / 100);
    const discountAmount = discount || 0;
    const totalAmount = subTotal + taxAmount - discountAmount;

    const quotation = await Quotation.create({
      requestId,
      items: processedItems,
      subTotal,
      tax: tax || 0,
      discount: discountAmount,
      totalAmount,
      status: 'draft',
      notes,
      createdBy: req.userId,
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('createQuotation error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Gửi báo giá cho customer (cập nhật status và tạo notification)
export const sendQuotation = async (req: any, res: Response) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status: 'sent' },
      { new: true }
    );
    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }

    // Cập nhật RFQ status sang 'quotation'
    const rfq = await CustomerRequest.findByIdAndUpdate(
      quotation.requestId,
      { status: 'quotation' },
      { new: true }
    );

    // Tạo notification cho customer
    if (rfq?.createdBy) {
      await Notification.create({
        userId: rfq.createdBy,
        type: 'quotation_sent',
        title: 'Báo giá mới',
        message: `Bạn nhận được báo giá cho yêu cầu ${rfq.code}. Tổng: ${quotation.totalAmount.toLocaleString('vi-VN')}đ`,
        relatedId: quotation._id,
      });
    }

    res.json(quotation);
  } catch (error) {
    console.error('sendQuotation error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Lấy danh sách báo giá
export const getQuotations = async (req: any, res: Response) => {
  try {
    const { requestId, status } = req.query;
    const filter: any = {};

    if (requestId) filter.requestId = requestId;
    if (status && status !== 'all') filter.status = status;

    // Customer chỉ thấy báo giá đã gửi cho RFQ của mình
    if (req.userRole === 'customer') {
      const myRFQs = await CustomerRequest.find({ createdBy: req.userId }).select('_id');
      const rfqIds = myRFQs.map(r => r._id);
      filter.requestId = { $in: rfqIds };
      filter.status = { $in: ['sent', 'approved', 'rejected'] }; // Xem được cả báo giá đang chờ và đã duyệt/từ chối
    }

    const quotations = await Quotation.find(filter)
      .populate('requestId', 'code customerName customerEmail customerPhone items productType status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Lọc bỏ quotation mà RFQ đã bị xóa (requestId = null sau populate)
    const validQuotations = quotations.filter(q => q.requestId != null);

    res.json(validQuotations);
  } catch (error) {
    console.error('getQuotations error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Lấy chi tiết báo giá
export const getQuotationById = async (req: any, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('requestId', 'code customerName customerEmail customerPhone items productType status')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Cập nhật báo giá
export const updateQuotation = async (req: any, res: Response) => {
  try {
    const { items, tax, discount, notes } = req.body;

    const updateData: any = { notes };
    if (items) {
      const processedItems = items.map((item: any) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));
      const subTotal = processedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const taxAmount = subTotal * ((tax || 0) / 100);
      const discountAmount = discount || 0;
      const totalAmount = subTotal + taxAmount - discountAmount;

      updateData.items = processedItems;
      updateData.subTotal = subTotal;
      updateData.tax = tax || 0;
      updateData.discount = discountAmount;
      updateData.totalAmount = totalAmount;
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Xóa báo giá
export const deleteQuotation = async (req: any, res: Response) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Khách hàng chấp nhận báo giá
export const acceptQuotation = async (req: any, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }

    const rfq = await CustomerRequest.findById(quotation.requestId);
    if (!rfq || rfq.createdBy?.toString() !== req.userId) {
      res.status(403).json({ message: 'Không có quyền truy cập' });
      return;
    }

    quotation.status = 'approved';
    await quotation.save();

    rfq.status = 'approved'; // Cập nhật rfq status
    await rfq.save();

    // Thông báo cho staff (sales)
    const staffUsers = await User.find({ role: { $in: ['sales', 'manager'] } }).select('_id');
    const notifications = staffUsers.map(user => ({
      userId: user._id,
      type: 'status_change' as const,
      title: 'Báo giá được chấp nhận',
      message: `Khách hàng đã chấp nhận báo giá cho yêu cầu ${rfq.code}`,
      relatedId: quotation._id,
      isRead: false,
    }));
    await Notification.insertMany(notifications);

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Khách hàng từ chối báo giá
export const rejectQuotation = async (req: any, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      res.status(404).json({ message: 'Không tìm thấy báo giá' });
      return;
    }

    const rfq = await CustomerRequest.findById(quotation.requestId);
    if (!rfq || rfq.createdBy?.toString() !== req.userId) {
      res.status(403).json({ message: 'Không có quyền truy cập' });
      return;
    }

    quotation.status = 'rejected';
    await quotation.save();

    // Thông báo cho staff (sales)
    const staffUsers = await User.find({ role: { $in: ['sales', 'manager'] } }).select('_id');
    const notifications = staffUsers.map(user => ({
      userId: user._id,
      type: 'status_change' as const,
      title: 'Báo giá bị từ chối',
      message: `Khách hàng đã từ chối báo giá cho yêu cầu ${rfq.code}`,
      relatedId: quotation._id,
      isRead: false,
    }));
    await Notification.insertMany(notifications);

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
