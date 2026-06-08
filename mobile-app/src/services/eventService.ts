import { api } from './api';

export interface CoupleEvent {
  _id: string;
  title: string;
  eventDate: string;
  eventType: 'anniversary' | 'trip' | 'date' | 'milestone' | 'custom';
  emoji: string;
  createdAt: string;
}

export const eventService = {
  getEvents: async (): Promise<CoupleEvent[]> => {
    const response = await api.get('/events');
    return response.data || [];
  },

  createEvent: async (
    title: string,
    eventDate: string,
    eventType: CoupleEvent['eventType'] = 'custom',
    emoji: string = '📅'
  ): Promise<CoupleEvent> => {
    const response = await api.post('/events', { title, eventDate, eventType, emoji });
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}`);
  },
};
