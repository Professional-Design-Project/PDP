import { useEffect, type EffectCallback } from "react";

export function useMountEffect(effect: EffectCallback): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- This hook intentionally follows mount/unmount, not callback identity.
  useEffect(effect, []);
}
