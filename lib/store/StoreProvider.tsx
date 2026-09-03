'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type { NormalizedEvent } from '@/lib/domain/types';
import { buildAttendance, loadAllEvents, type AggregateResult } from '@/lib/events';
import {
  buildSeedState,
  reducer,
  STATE_VERSION,
  type Action,
  type AppState,
} from './state';

/**
 * MOCK BOUNDARY: persistence.
 * Everything the user does is written to localStorage under one key. A real build swaps this
 * module for a database write behind an authenticated session — the reducer and the components
 * would not change.
 */
const STORAGE_KEY = 'usc-sidequest:state';

function readPersisted(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION) return null;
    if (!Array.isArray(parsed.quests) || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    // A corrupt or unreadable store is not worth surfacing to a student — start clean.
    return null;
  }
}

function writePersisted(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failures are non-fatal; the session still works, it just forgets.
  }
}

export interface EventsSlice {
  events: NormalizedEvent[];
  loading: boolean;
  failed: AggregateResult['failed'];
  error: string | null;
}

interface StoreValue {
  state: AppState;
  dispatch: (action: Action) => void;
  events: EventsSlice;
  reloadEvents: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, buildSeedState);
  const [hydrated, setHydrated] = useState(false);
  const [events, setEvents] = useState<EventsSlice>({
    events: [],
    loading: true,
    failed: [],
    error: null,
  });
  const [eventsNonce, setEventsNonce] = useState(0);

  // Read persisted state before the first paint of real content.
  useEffect(() => {
    const persisted = readPersisted();
    if (persisted) dispatch({ type: 'hydrate', state: persisted });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writePersisted(state);
  }, [state, hydrated]);

  // Events come from the adapters on every boot, exactly as they would from a real API.
  useEffect(() => {
    let cancelled = false;
    setEvents((e) => ({ ...e, loading: true, error: null }));
    loadAllEvents()
      .then((result) => {
        if (cancelled) return;
        setEvents({ events: result.events, loading: false, failed: result.failed, error: null });
        dispatch({ type: 'seedAttendance', attendance: buildAttendance(result.events) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEvents({
          events: [],
          loading: false,
          failed: [],
          error: err instanceof Error ? err.message : 'The event sources did not respond.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [eventsNonce]);

  const reloadEvents = useCallback(() => setEventsNonce((n) => n + 1), []);

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
    dispatch({ type: 'reset' });
    setEventsNonce((n) => n + 1);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, events, reloadEvents, resetDemo }),
    [state, events, reloadEvents, resetDemo],
  );

  if (!hydrated) {
    return <BootScreen />;
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** The only thing rendered before local state has been read back. */
function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="text-center">
        <div className="type-micro text-accent">USC SideQuest</div>
        <p className="type-body mt-2 text-muted">Picking up where you left off.</p>
      </div>
    </div>
  );
}
