/**
 * @format
 */

import * as React from 'react';
import {Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
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

export function useSetPageTitle() {
  const reactNav = useNavigation();
  return (title: string) => {
    // Needs to be on timeout so it isn't called synchronously
    // while rendering another component
    setTimeout(() => reactNav.setOptions({title}), 0);
  };
}

export function timelog(...args: any[]) {
  args.push((Date.now() % 100000) / 1000);
  console.log(...args);
}

export async function downloadOrShareJson(name: string, url: string) {
  if (Platform.OS === 'web') {
    downloadFile(`${name}.json`, url);
  } else {
    Sharing.shareAsync(jsonDataUrl(url));
  }
}

export function downloadFile(filename: string, dataUrl: string) {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function jsonDataUrl(jsonString: string) {
  const base64 = btoa(jsonString);
  return 'data:application/json;base64,' + base64;
}
