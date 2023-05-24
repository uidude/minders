/**
 * @format
 */

import * as React from 'react';
import {TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {unstable_batchedUpdates} from 'react-dom';
import {Selection} from '@app/legacy/OutlineText';

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

// Select text in a TextInput, using platform-specific native methods
export function textInputSelect(textInput: TextInput, sel: Selection) {
  const input: any = textInput;
  if (input.setSelectionRange) {
    input.setSelectionRange(sel.start, sel.end);
  } else if (input.setSelection) {
    input.setSelection(sel.start, sel.end);
  }
}

export function timelog(...args: any[]) {
  args.push((Date.now() % 100000) / 1000);
  console.log(...args);
}
