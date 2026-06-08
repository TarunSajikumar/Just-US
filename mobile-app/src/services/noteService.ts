import { api } from "./api";

export const noteService = {
  saveNote: async (content: string) => {
    const response = await api.post("/notes", { content });
    return response.data;
  },

  getPartnerNote: async () => {
    const response = await api.get("/notes/partner");
    return response.data;
  },

  getAllNotes: async () => {
    const response = await api.get("/notes");
    return response.data;
  },
};
