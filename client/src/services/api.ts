import type { Room } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  rooms: {
    list: () => request<{ rooms: Room[] }>('/rooms'),
    get: (code: string) => request<{ room: Room }>(`/rooms/${code}`),
    create: (data: { name: string; hostId: string; hostNickname: string; maxPlayers?: number; duration?: number }) =>
      request<{ room: Room }>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  },
};
