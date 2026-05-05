import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const OPEP_CONTEXT = `
Bạn là trợ lý ảo thông minh của OPEP Việt Nam. 
Tên công ty: Công ty TNHH Nhựa và Công nghệ Môi trường OPEP.
Lĩnh vực: Sản xuất và cung cấp thiết bị nhựa kỹ thuật chống ăn mòn hóa chất và hệ thống xử lý khí thải công nghiệp.

Các sản phẩm chính:
1. Bồn bể chứa hóa chất: Bể mạ, Bồn PP/PVC/Composite (FRP).
2. Quạt hút khí độc: Quạt ly tâm nhựa PP, quạt trung áp, cao áp chịu hóa chất.
3. Hệ thống xử lý khí thải: Tháp hấp thụ Scrubber, Tủ hút hóa chất (Fume Hood), Tháp hấp phụ than hoạt tính.
4. Vật tư nhựa: Tấm nhựa PP/PVC/PE, ống dẫn và phụ kiện hàn nhựa.

Thông tin liên hệ:
- Địa chỉ: KCN Quang Minh, Mê Linh, Hà Nội.
- Hotline: 0913 213 091 (Hỗ trợ 24/7).
- Email: sales@opep.vn.

Phong cách trả lời: 
- Chuyên nghiệp, lịch sự, nhiệt tình và ngắn gọn.
- Luôn sẵn sàng tư vấn kỹ thuật.
- Nếu khách hàng hỏi về giá, hãy hướng dẫn họ nhấn nút "Báo giá ngay" hoặc để lại số điện thoại để đội ngũ kỹ thuật liên hệ tư vấn và khảo sát thực tế.
- Khuyến khích khách hàng ghé thăm xưởng tại KCN Quang Minh.

Ngôn ngữ: Trả lời bằng tiếng Việt.
`;

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  const { message, history } = req.body;
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  console.log('AI Request received:', message);

  // 1. Ưu tiên sử dụng Groq nếu có Key
  if (groqApiKey && groqApiKey !== 'your_api_key_here') {
    try {
      console.log('Using Groq AI...');
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: OPEP_CONTEXT },
          ...(history || []).map((h: any) => ({
            role: h.type === 'user' ? 'user' : 'assistant',
            content: h.text
          })),
          { role: 'user', content: message }
        ],
        model: 'llama-3.1-8b-instant',
      });

      const responseText = completion.choices[0]?.message?.content || "";
      return res.json({ response: responseText });
    } catch (error) {
      console.error('Groq AI Error:', error);
      // Nếu Groq lỗi, tiếp tục thử Gemini bên dưới
    }
  }

  // 2. Sử dụng Gemini nếu có Key
  if (geminiApiKey && geminiApiKey !== 'your_api_key_here') {
    try {
      console.log('Using Gemini AI...');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `${OPEP_CONTEXT}\n\nLịch sử trò chuyện:\n${(history || []).map((h: any) => `${h.type}: ${h.text}`).join('\n')}\n\nKhách hàng: ${message}\nTrợ lý:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return res.json({ response: response.text() });
    } catch (error) {
      console.error('Gemini AI Error:', error);
    }
  }

  // 3. Chế độ dự phòng (Simulation)
  console.log('Using Simulation mode...');
  setTimeout(() => {
    res.json({ 
      response: `Chào bạn! Tôi là trợ lý của OPEP. Hiện tại hệ thống đang bận, nhưng tôi có thể tư vấn nhanh: OPEP chuyên về bồn bể nhựa và quạt hút tại KCN Quang Minh. Bạn vui lòng gọi 0913 213 091 để được hỗ trợ tốt nhất nhé!` 
    });
  }, 1000);
};
