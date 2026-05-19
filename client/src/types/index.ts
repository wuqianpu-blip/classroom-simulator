export interface PlayerInRoom {
  userId: string;
  nickname: string;
  ready: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  playerCount: number;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  duration: number;
  createdAt: string;
}
