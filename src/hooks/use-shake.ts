import { Accelerometer } from 'expo-sensors';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

/** Déclenche `onShake` quand l’appareil est secoué (au plus une fois par seconde). */
export function useShake(onShake: () => void, enabled = true) {
  const fire = useEffectEvent(onShake);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let last = 0;
    Accelerometer.setUpdateInterval(120);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (force > 2.3 && now - last > 1200) {
        last = now;
        fire();
      }
    });
    return () => sub.remove();
  }, [enabled]);
}
