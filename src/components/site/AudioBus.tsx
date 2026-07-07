"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Global audio coordinator. The banner and "A Causa" video players register
 * whether their sound is currently ON; the event Playlist reads `videoSoundOn`
 * and mutes (YouTube) / pauses (Spotify) itself while any video is audible, so
 * two sources never play over each other.
 */
interface AudioBusValue {
  /** True while at least one banner/"A Causa" video has its sound on. */
  videoSoundOn: boolean;
  /** A video player reports its sound state (id keeps players independent). */
  setVideoSound: (id: string, on: boolean) => void;
}

const AudioBusContext = createContext<AudioBusValue | null>(null);

export function AudioBusProvider({ children }: { children: React.ReactNode }) {
  const idsRef = useRef<Set<string>>(new Set());
  const [videoSoundOn, setVideoSoundOn] = useState(false);

  const setVideoSound = useCallback((id: string, on: boolean) => {
    const set = idsRef.current;
    if (on) set.add(id);
    else set.delete(id);
    setVideoSoundOn(set.size > 0);
  }, []);

  const value = useMemo(
    () => ({ videoSoundOn, setVideoSound }),
    [videoSoundOn, setVideoSound],
  );

  return (
    <AudioBusContext.Provider value={value}>{children}</AudioBusContext.Provider>
  );
}

/** Null-safe: returns null when used outside a provider (e.g. in the ADM). */
export function useAudioBus(): AudioBusValue | null {
  return useContext(AudioBusContext);
}
