import { create } from 'zustand';
import type { Room, PlayerInRoom } from '../types';
import { api } from '../services/api';

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  players: PlayerInRoom[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, hostId: string, hostNickname: string, maxPlayers?: number, duration?: number) => Promise<Room>;
  setCurrentRoom: (room: Room | null) => void;
  setPlayers: (players: PlayerInRoom[]) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  players: [],
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const { rooms } = await api.rooms.list();
      set({ rooms, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createRoom: async (name: string, hostId: string, hostNickname: string, maxPlayers = 8, duration = 600) => {
    const { room } = await api.rooms.create({ name, hostId, hostNickname, maxPlayers, duration });
    set((state) => ({ rooms: [room, ...state.rooms], currentRoom: room }));
    return room;
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPlayers: (players) => set({ players }),
}));
