/**
 * @format
 */

import * as React from 'react';
import {useNavigation} from '@react-navigation/native';
import {unstable_batchedUpdates} from 'react-dom';

// Consistent wrapper around batching to avoid exposing react
// internals to everyone
export function batch(fn: () => void) {
  unstable_batchedUpdates(fn);
}

export function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue(value => ++value);
}

const lastBackupMsMap: Record<string, number> = {};

export async function rateLimit(
  key: string,
  fn: () => Promise<void>,
  rateLimitMs: number,
) {
  const lastBackupMs = lastBackupMsMap[key] || 0;
  var curTime = new Date().getTime();
  var msSinceLastCall = curTime - lastBackupMs;

  if (msSinceLastCall > rateLimitMs) {
    lastBackupMsMap[key] = curTime;
    await fn();
  }
}

// Hook to get function to not animate next transition
export function useDontAnimate() {
  const reactNav = useNavigation<any>();
  return () => {
    reactNav.setOptions({animationEnabled: false});
  };
}
