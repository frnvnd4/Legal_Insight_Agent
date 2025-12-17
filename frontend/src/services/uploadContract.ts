import api from "../api/axios";

export const uploadContract = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data; 
};