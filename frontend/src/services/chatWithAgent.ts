import api from "../api/axios";

export const chatWithAgent = async (question: string, sessionId: string) => {
  const { data } = await api.post("/chat", null, {
    params: { question, session_id: sessionId },
  });
  return data;
};