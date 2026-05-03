import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model.js';

const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_keys', { expiresIn: '7d' });
};

const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !email.endsWith('@acrydesk.com')) {
      res.status(400).json({ message: 'Email phải có định dạng @acrydesk.com' });
      return;
    }

    if (!password || password.length < 6 || password.length > 20) {
      res.status(400).json({ message: 'Mật khẩu phải từ 6 đến 20 ký tự' });
      return;
    }

    if (phone) {
      if (!VN_PHONE_REGEX.test(phone)) {
        res.status(400).json({ message: 'Số điện thoại không đúng định dạng Việt Nam (10 số, đầu 03, 05, 07, 08, 09)' });
        return;
      }
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        res.status(400).json({ message: 'Số điện thoại này đã được sử dụng' });
        return;
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email đã được sử dụng' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer',
    });

    res.status(201).json({ message: 'Đăng ký tài khoản thành công', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

export const registerStaff = async (req: any, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Chỉ cho phép tạo staff roles
    const allowedRoles = ['sales', 'engineer', 'manager'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ message: 'Role không hợp lệ' });
      return;
    }

    if (!email || !email.endsWith('@acrydesk.com')) {
      res.status(400).json({ message: 'Email phải có định dạng @acrydesk.com' });
      return;
    }

    if (!password || password.length < 6 || password.length > 20) {
      res.status(400).json({ message: 'Mật khẩu phải từ 6 đến 20 ký tự' });
      return;
    }

    if (phone) {
      if (!VN_PHONE_REGEX.test(phone)) {
        res.status(400).json({ message: 'Số điện thoại không đúng định dạng Việt Nam' });
        return;
      }
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        res.status(400).json({ message: 'Số điện thoại này đã được sử dụng' });
        return;
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email đã được sử dụng' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    res.status(201).json({ message: `Tạo tài khoản ${role} thành công`, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo staff' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const accessToken = jwt.sign({ userId: user._id, role: user.role }, secret, { expiresIn: '15m' });
    const refreshToken = generateRefreshToken(user._id as string);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(401).json({ message: 'Refresh token is required' });
      return;
    }

    const payload: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_keys');
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== token) {
      res.status(403).json({ message: 'Refresh token không hợp lệ' });
      return;
    }

    const newAccessToken = generateAccessToken(user._id as string, user.role);
    const newRefreshToken = generateRefreshToken(user._id as string);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(403).json({ message: 'Token đã hết hạn hoặc không hợp lệ' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;
    const user = await User.findOne({ email, phone });

    if (!user) {
      res.status(404).json({ message: 'Thông tin Email hoặc Số điện thoại không khớp với tài khoản nào' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await user.save();

    // In local dev, we return the token directly for testing. In prod, send via SMS/Email.
    res.json({ 
      message: 'Mã xác nhận đã được gửi tới số điện thoại của bạn (Giả lập SMS)',
      resetToken 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshToken');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin user' });
  }
};

export const logout = async (req: any, res: Response) => {
  try {
     const user = await User.findById(req.userId);
     if (user) {
       user.refreshToken = undefined;
       await user.save();
     }
     res.json({ message: 'Đã đăng xuất' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};