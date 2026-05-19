export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  maxPlayers: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerInRoom {
  userId: string;
  nickname: string;
  avatar: string;
  ready: boolean;
}
