import type { User, Room } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (data: { username: string; password: string; nickname: string }) =>
      request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { username: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ user: User }>('/auth/me'),
  },
  rooms: {
    list: () => request<{ rooms: Room[] }>('/rooms'),
    get: (id: string) => request<{ room: Room }>(`/rooms/${id}`),
    create: (data: { name: string; maxPlayers?: number; duration?: number }) =>
      request<{ room: Room }>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  },
};
