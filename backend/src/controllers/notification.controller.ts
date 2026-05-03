import type { Response } from 'express';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// Lấy thông báo của user hiện tại
export const getNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ userId: req.userId, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req: any, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Tạo notification cho tất cả staff khi customer tạo RFQ mới
export const notifyStaffNewRFQ = async (rfqCode: string, customerName: string, rfqId: string) => {
  try {
    const staffUsers = await User.find({ role: { $in: ['sales', 'manager', 'engineer'] } }).select('_id');
    const notifications = staffUsers.map(user => ({
      userId: user._id,
      type: 'new_rfq' as const,
      title: 'Yêu cầu báo giá mới',
      message: `${customerName} vừa gửi yêu cầu báo giá ${rfqCode}`,
      relatedId: rfqId,
      isRead: false,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('notifyStaffNewRFQ error:', error);
  }
};

// Tạo notification chung
export const createNotification = async (
  userId: string | null,
  roles: string[],
  title: string,
  message: string,
  relatedId?: string
) => {
  try {
    let targetUserIds: string[] = [];
    
    if (userId) {
      targetUserIds.push(userId);
    }
    
    if (roles && roles.length > 0) {
      const users = await User.find({ role: { $in: roles } }).select('_id');
      targetUserIds = [...targetUserIds, ...users.map(u => u._id.toString())];
    }
    
    // Loại bỏ duplicate
    targetUserIds = [...new Set(targetUserIds)];
    
    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map(id => ({
        userId: id,
        type: 'new_message',
        title,
        message,
        relatedId,
        isRead: false,
      }));
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('createNotification error:', error);
  }
};

// Staff tạo thông báo cho khách hàng
export const createAnnouncement = async (req: any, res: Response) => {
  try {
    const { targetUserId, title, message } = req.body;
    
    if (!title || !message) {
      res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống' });
      return;
    }

    let targetUsers: any[] = [];
    if (targetUserId) {
      targetUsers = [{ _id: targetUserId }];
    } else {
      // Tìm tất cả khách hàng
      targetUsers = await User.find({ role: 'customer' }).select('_id');
    }

    if (targetUsers.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy người nhận' });
      return;
    }

    const notifications = targetUsers.map(user => ({
      userId: user._id,
      type: 'announcement',
      title,
      message,
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    // Emit socket.io for real-time if possible
    const io = req.app.get('io');
    if (io) {
      targetUsers.forEach(u => {
        io.to(u._id.toString()).emit('new_announcement', { title, message });
      });
    }

    res.status(201).json({ message: 'Gửi thông báo thành công' });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
