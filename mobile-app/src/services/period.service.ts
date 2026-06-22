import { api } from './api';

export interface PeriodTracker {
  _id: string;
  userId: string;
  coupleId: string;
  lastPeriodDate: string;
  cycleLengthDays: number;
  periodDurationDays: number;
  isPrivate: boolean;
  notificationsEnabled: boolean;
  reminders: {
    periodStarting: boolean;
    ovulationDay: boolean;
    pmsReminder: boolean;
  };
  history: Array<{
    startDate: string;
    endDate: string;
    flow: 'light' | 'normal' | 'heavy';
    symptoms: string[];
    notes: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodDates {
  nextPeriodDate: string;
  ovulationDay: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  pmsStart: string;
  pmsEnd: string;
}

export const periodService = {
  /**
   * Track period with cycle and duration info
   */
  trackPeriod: async (
    lastPeriodDate: string,
    cycleLengthDays: number,
    periodDurationDays: number,
    isPrivate: boolean = true
  ) => {
    const response = await api.post('/period/track', {
      lastPeriodDate,
      cycleLengthDays,
      periodDurationDays,
      isPrivate,
    });
    return response.data as { tracker: PeriodTracker; dates: PeriodDates };
  },

  /**
   * Get current period tracker for user
   */
  getPeriodTracker: async () => {
    const response = await api.get('/period/tracker');
    return response.data as { tracker: PeriodTracker; dates: PeriodDates };
  },

  /**
   * Get partner's period info (only if shared)
   */
  getPartnerPeriodInfo: async () => {
    try {
      const response = await api.get('/period/partner');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Partner hasn't shared period info
      }
      throw error;
    }
  },

  /**
   * Add historical period entry
   */
  addPeriodHistory: async (
    startDate: string,
    endDate: string,
    flow: 'light' | 'normal' | 'heavy' = 'normal',
    symptoms: string[] = [],
    notes: string = ''
  ) => {
    const response = await api.post('/period/history', {
      startDate,
      endDate,
      flow,
      symptoms,
      notes,
    });
    return response.data;
  },

  /**
   * Update period reminder preferences
   */
  updatePeriodReminders: async (
    periodStarting: boolean,
    ovulationDay: boolean,
    pmsReminder: boolean
  ) => {
    const response = await api.put('/period/reminders', {
      periodStarting,
      ovulationDay,
      pmsReminder,
    });
    return response.data;
  },

  /**
   * Update privacy setting (share with partner or keep private)
   */
  updatePeriodPrivacy: async (isPrivate: boolean) => {
    const response = await api.put('/period/privacy', {
      isPrivate,
    });
    return response.data;
  },
};
