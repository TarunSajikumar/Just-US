import { api } from "./api";

export const moodService = {
  saveMood: async (mood: string) => {
    const response = await api.post("/moods", { mood });
    return response.data;
  },

  setMood: async (mood: string, emoji?: string) => {
    const response = await api.post("/moods", { mood, emoji });
    return response.data;
  },

  getMyMood: async () => {
    const response = await api.get("/moods/me");
    return response.data;
  },

  getPartnerMood: async () => {
    const response = await api.get("/moods/partner");
    return response.data;
  },

  getMoodHistory: async () => {
    const response = await api.get("/moods/history");
    return response.data;
  },
};
