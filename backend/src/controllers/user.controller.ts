import type { Request, Response } from 'express';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

export const getStaffAll = async (req: Request, res: Response) => {
  try {
    const staff = await User.find({ role: { $in: ['manager', 'sales', 'engineer'] } }).select('-password').sort('-createdAt');
    res.json(staff);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: msg });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: msg });
  }
};

export const updateStaffStatus = async (req: Request, res: Response) => {
  // Mock function, because we don't have a status field yet.
  // We can add it if needed, or just update roles.
  res.json({ message: 'Update staff called. (Not implemented)' });
};

export const updateMyProfile = async (req: any, res: Response) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { name, phone }, { new: true }).select('-password');
    res.json({ message: 'Cập nhật thành công', user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: msg });
  }
};
