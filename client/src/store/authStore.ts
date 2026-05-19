import { create } from 'zustand';

interface AuthState {
  nickname: string;
  userId: string;
  setUser: (nickname: string, userId: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  nickname: localStorage.getItem('nickname') || '',
  userId: localStorage.getItem('userId') || '',
  setUser: (nickname, userId) => {
    localStorage.setItem('nickname', nickname);
    localStorage.setItem('userId', userId);
    set({ nickname, userId });
  },
  clear: () => {
    localStorage.removeItem('nickname');
    localStorage.removeItem('userId');
    set({ nickname: '', userId: '' });
  },
}));
