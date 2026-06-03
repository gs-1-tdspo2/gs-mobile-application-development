import { create } from 'axios';

import { API_BASE_URL } from '@/constants/api';

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
