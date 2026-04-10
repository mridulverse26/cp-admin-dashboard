import axios from 'axios';

const ADMIN_KEY = 'classpulse-admin-2026';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1/admin',
  headers: { 'x-admin-key': ADMIN_KEY },
});
