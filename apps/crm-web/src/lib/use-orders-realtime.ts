'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL } from './api';

/**
 * Assina o canal realtime do restaurante. Reconnect exponencial até 30s.
 * Em `order.created` toca som e invalida o cache de `['orders']`.
 */
export function useOrdersRealtime(token: string | null, opts: { sound?: boolean } = {}) {
  const qc = useQueryClient();
  const soundEnabled = opts.sound ?? true;

  React.useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let cancelled = false;

    const wsUrl = API_URL.replace(/^http/, 'ws') + `/crm/orders/ws?token=${encodeURIComponent(token)}`;

    const playBeep = () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        osc.onended = () => ctx.close();
      } catch {
        /* audio blocked */
      }
    };

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        attempt = 0;
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { event?: string };
          if (data.event === 'order.created') {
            playBeep();
            qc.invalidateQueries({ queryKey: ['orders'] });
          } else if (data.event === 'order.status_changed') {
            qc.invalidateQueries({ queryKey: ['orders'] });
          }
        } catch {
          /* ignora payload inválido */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        attempt += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [token, qc, soundEnabled]);
}
