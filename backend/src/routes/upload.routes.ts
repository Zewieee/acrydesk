import { Router } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.array('files', 10), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Khong co file nao duoc tai len' });
    }

    const urls = files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Loi khi upload file' });
  }
});

export default router;
