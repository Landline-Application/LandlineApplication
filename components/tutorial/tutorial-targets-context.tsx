import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import type { TargetRect } from './tutorial-overlay';

type TargetRects = Record<string, TargetRect | null>;

interface TutorialTargetsContextValue {
  targetRects: TargetRects;
  setTargetRect: (key: string, rect: TargetRect | null) => void;
}

const TutorialTargetsContext = createContext<TutorialTargetsContextValue>({
  targetRects: {},
  setTargetRect: () => {},
});

export function TutorialTargetsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [targetRects, setTargetRects] = useState<TargetRects>({});
  const rectsRef = useRef<TargetRects>({});

  const setTargetRect = useCallback(
    (key: string, rect: TargetRect | null) => {
      const prev = rectsRef.current[key];
      if (
        prev &&
        rect &&
        prev.x === rect.x &&
        prev.y === rect.y &&
        prev.width === rect.width &&
        prev.height === rect.height
      ) {
        return;
      }
      rectsRef.current = { ...rectsRef.current, [key]: rect };
      setTargetRects((r) => ({ ...r, [key]: rect }));
    },
    [],
  );

  return (
    <TutorialTargetsContext.Provider value={{ targetRects, setTargetRect }}>
      {children}
    </TutorialTargetsContext.Provider>
  );
}

export function useTutorialTargets() {
  return useContext(TutorialTargetsContext);
}
