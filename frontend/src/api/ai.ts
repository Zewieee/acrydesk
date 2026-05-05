import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const chatWithAI_API = async (message: string, history: { type: 'bot' | 'user', text: string }[]) => {
  const res = await axios.post(`${API_URL}/ai/chat`, { message, history });
  return res.data;
};
