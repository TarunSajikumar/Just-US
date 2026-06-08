import { api } from './api';

export interface Activity {
  _id: string;
  actorId: {
    _id: string;
    name: string;
  };
  actionType: string;
  details: Record<string, any>;
  createdAt: string;
}

export const activityService = {
  getActivities: async (): Promise<Activity[]> => {
    const response = await api.get('/activities');
    return response.data || [];
  },
};
