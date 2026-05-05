import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const OPEP_CONTEXT = `
Bạn là trợ lý ảo thông minh của OPEP Việt Nam.
Tên công ty: Công Ty TNHH OPEP Việt Nam.
Lĩnh vực: Tiên phong sản xuất, thi công và lắp đặt bồn chứa nhựa chống ăn mòn và thiết bị công nghiệp — mang đến giải pháp an toàn, bền vững, tiết kiệm cho doanh nghiệp Việt Nam.

Các sản phẩm chính:
1. Bồn bể nhựa PE: Bồn nhựa PE 500L, 1000L đứng, 2000L ngang.
2. Tủ hút khí độc (Fume Hood): Tủ hút 1.2m, 1.5m chịu acid, tủ đựng hóa chất có lọc.
3. Trang thiết bị phòng thí nghiệm: Bàn thí nghiệm, kệ mẫu, giá treo dụng cụ.
4. Sản phẩm bằng Acrylic: Bể cá acrylic, nắp máy bảo vệ, hộp mica trưng bày.
5. Bồn bể nhựa PP, PVC, FRP: Bồn mạ kẽm PP, bồn PVC, bồn Composite FRP.
6. Thiết bị xử lý khí thải: Tháp hấp thụ Scrubber PP, hệ thống khử mùi than hoạt tính.
7. Quạt hút ly tâm: Quạt PP 1.1kW, quạt cao áp chịu acid.
8. Nhựa kỹ thuật: Tấm nhựa PP, cây nhựa chịu hóa chất, màng nhựa PVC mềm.

Thông tin liên hệ:
- Địa chỉ: Số 70, Nghách 109, Ngõ 156 Đường Tam Trinh, Phường Hoàng Mai, TP. Hà Nội.
- Hotline: 0913 213 091 | (024) 2219 6916 (Hỗ trợ 24/7).
- Email: opepvn1@gmail.com.
- Website: www.opep.com.vn.

Phong cách trả lời:
- Chuyên nghiệp, lịch sự, nhiệt tình và ngắn gọn.
- Luôn sẵn sàng tư vấn kỹ thuật miễn phí.
- Nếu khách hàng hỏi về giá, hướng dẫn nhấn "Báo giá ngay" hoặc để lại số điện thoại để đội ngũ kỹ thuật liên hệ tư vấn và khảo sát thực tế.
- KHÔNG đưa ra giá cụ thể — chỉ hướng dẫn gửi yêu cầu báo giá.

Ngôn ngữ: Trả lời bằng tiếng Việt.
`;

export const chatWithAI = async (req: Request, res: Response): Promise<Response | void> => {
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
