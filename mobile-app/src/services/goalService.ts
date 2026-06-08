import { api } from './api';

export interface Goal {
  _id: string;
  title: string;
  emoji: string;
  target: number;
  current: number;
  completed: boolean;
  createdAt: string;
}

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await api.get('/goals');
    return response.data || [];
  },

  createGoal: async (title: string, target: number, emoji: string = '🎯'): Promise<Goal> => {
    const response = await api.post('/goals', { title, target, emoji });
    return response.data;
  },

  updateProgress: async (goalId: string, increment: number = 1): Promise<Goal> => {
    const response = await api.patch(`/goals/${goalId}/progress`, { increment });
    return response.data;
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    await api.delete(`/goals/${goalId}`);
  },
};
