'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSWRConfig } from 'swr';

const Ctx = createContext<Socket | null>(null);

/**
 * One Socket.IO connection per tab. Events are hints: on every event we revalidate the
 * relevant SWR keys so the API (database) stays the source of truth.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { mutate } = useSWRConfig();
  useEffect(() => {
    const s = io({ path: '/socket.io', transports: ['websocket', 'polling'], withCredentials: true });
    s.on('connect', () => s.emit('subscribe:all'));
    s.on('portfolio:update', () => {
      mutate((k) => typeof k === 'string' && (k.startsWith('/portfolio') || k.startsWith('/wallet') || k === '/auth/me'));
    });
    s.on('notification', () => {
      mutate((k) => typeof k === 'string' && (k.startsWith('/notifications') || k === '/auth/me'));
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [mutate]);
  return <Ctx.Provider value={socket}>{children}</Ctx.Provider>;
}

export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const socket = useContext(Ctx);
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const fn = (p: T) => ref.current(p);
    socket.on(event, fn);
    return () => {
      socket.off(event, fn);
    };
  }, [socket, event]);
}

/** Live price map fed by market:update events (used to animate cards without refetching). */
export function useLivePrice(marketId: string, initial: string) {
  const [price, setPrice] = useState(initial);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  useEffect(() => setPrice(initial), [initial]);
  useSocketEvent<{ id: string; yesPrice: string }>('market:update', (p) => {
    if (p.id !== marketId) return;
    setDir(Number(p.yesPrice) > Number(price) ? 'up' : Number(p.yesPrice) < Number(price) ? 'down' : null);
    setPrice(p.yesPrice);
  });
  return { price, dir };
}
