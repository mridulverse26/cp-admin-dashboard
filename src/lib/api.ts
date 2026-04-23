import axios from 'axios';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'FjjkPINUC1zVum14ZhbSIyoMAsbQBYGAWfQJXsU8LZ1JtcstMF9tQkdz4AE0b5Kc';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1/admin';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'x-admin-key': ADMIN_KEY },
});
