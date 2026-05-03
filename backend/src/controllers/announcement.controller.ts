import type { Response } from 'express';
import Announcement from '../models/Announcement.model.js';

export const createAnnouncement = async (req: any, res: Response) => {
  try {
    const { title, content, imageUrl } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      imageUrl,

      createdBy: req.userId,
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const getAnnouncements = async (req: any, res: Response) => {
  try {
    const filter: any = {};
    if (req.userRole === 'customer') {
      filter.isActive = true;
    }
    
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const updateAnnouncement = async (req: any, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!announcement) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const deleteAnnouncement = async (req: any, res: Response) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
