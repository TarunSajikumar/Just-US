import { api } from './api';

export interface Poll {
  _id: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // userId -> optionIndex
  endsAt: string;
  expired: boolean;
  createdBy: string;
}

export const pollService = {
  getPolls: async (): Promise<Poll[]> => {
    const response = await api.get('/polls');
    return response.data || [];
  },

  createPoll: async (question: string, options: string[], durationHours: number = 24): Promise<Poll> => {
    const response = await api.post('/polls', { question, options, durationHours });
    return response.data;
  },

  vote: async (pollId: string, optionIndex: number): Promise<Poll> => {
    const response = await api.post(`/polls/${pollId}/vote`, { optionIndex });
    return response.data;
  },

  deletePoll: async (pollId: string): Promise<void> => {
    await api.delete(`/polls/${pollId}`);
  },
};
