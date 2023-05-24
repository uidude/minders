/**
 * Utilities for tracking and requesting text selection in the UI.
 */

import {TextInput} from 'react-native';
import {Opt} from '@toolkit/core/util/Types';

type SelectionRange = {
  start: number;
  end: number;
};

type Selector = 'start' | 'end' | 'all';

type Selection = {
  minderId: Opt<string>;
  range?: SelectionRange;
  selector?: Selector;
};

// Global selection state
let trackedSelection: Selection = {minderId: null};
let requestedSelection: Opt<Selection> = null;

/** Currently selected minder and selection Range */
export function getSelection() {
  return trackedSelection;
}

/** Whether a minder is selected */
export function isSelected(minderId: string) {
  return trackedSelection.minderId === minderId;
}

/**  Check to see if an item should be selected. Clears the selection request if matches */
export function shouldSelect(minderId: string) {
  if (minderId === requestedSelection?.minderId) {
    const newSelection = requestedSelection;
    requestedSelection = null;
    return newSelection;
  }
}

/** Track the current UI selection state. */
export function trackSelection(minderId: Opt<string>, range?: SelectionRange) {
  trackedSelection = {minderId, range};
}

/** Request that the app select new content in the UI */
export function requestSelect(minderId: string, selector?: Selector) {
  requestedSelection = {minderId, selector};
}

// Select text in a TextInput, using platform-specific native methods
export function textInputSelect(textInput: TextInput, sel: SelectionRange) {
  const input: any = textInput;
  if (input.setSelectionRange) {
    input.setSelectionRange(sel.start, sel.end);
  } else if (input.setSelection) {
    input.setSelection(sel.start, sel.end);
  }
}
