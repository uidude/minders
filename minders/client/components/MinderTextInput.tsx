import React from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputSelectionChangeEventData,
  TextStyle,
} from 'react-native';
import {Opt} from '@toolkit/core/util/Types';
import {Updater} from '@toolkit/data/DataStore';
import {Minder, dataListen, useMinderStore} from '@app/common/Minders';
import {
  getSelection,
  isSelected,
  requestSelect,
  shouldSelect,
  textInputSelect,
  trackSelection,
} from '@app/model/TextSelect';
import {ShortcutAction, useShortcut} from '@app/util/Shortcuts';
import {useIndent, useOutdent} from './Actions';

type Props = {
  minder: Minder;
  /** Previous item displayed, used for UI actions */
  prev?: Opt<Minder>;

  /** Grandparent of minder. Needed for outdent operations */
  grandparent?: Opt<Minder>;

  /** View type - hierarchical outline or list. This changes behavior in a few ways */
  mode?: 'outline' | 'list';
};

/**
 * All of the logic for editing minder text when inside a list
 *
 * Includes logic for special characters
 * - Backspace deletes if no text remains
 * - Enter creates a new item
 * - Shift-enter submits the new item
 *
 * Also includes logic for checking for current selection. This is
 * surprisingly complicated because you want to pick up the new selection
 * when another item is blurred or deleted, and this is not handled consistently
 * across different text inputs on different platforms.
 *
 * Keeping side-by-side with OutlineText (the version for hierarchical display)
 * so we can hopefully unify.
 */
export function MinderTextInput(props: Props) {
  const {minder, prev, grandparent, mode = 'list'} = props;
  const [value, setValue] = React.useState(minder.text);
  // TODO: Make this a ref
  const [active, setActive] = React.useState(false);
  const minderStore = useMinderStore();
  const {action: indent} = useIndent(minder, prev);
  const {action: outdent} = useOutdent(minder, grandparent);
  const hasRendered = React.useRef(false);

  // Update text when not active
  React.useEffect(() => {
    return dataListen(Minder, [minder.id], async () => {
      const newMinder = await minderStore.get(minder.id);
      if (newMinder && !active) {
        setValue(newMinder.text);
      }
    });
  }, [active, minder.id]);

  const isSel = isSelected(minder.id);
  const cursor = isSel ? null : 'default';
  const inputRef = React.useRef<TextInput>();

  //timelog('MinderTextInput render', isSel, minder.id);

  /*
  Different handling for list vs. outline

  Enter:
  - List: New item has no parent
  - Outline: New item parent is same as previous item

  Backspace:
  - List: Selection is previous item in list view
  - Outline: Selection is previous item in outline view
  - NOTE: These are similar, only challenge is tracking prev through hierarchy
    Might be OK to have hierarchy bump to parent instead of actual prev

  Tab / Shift-Tab
  - List: Disabled
  - Outline: Indent / Outdent

*/

  // TODO: Action
  async function deleteMinder() {
    await minderStore.remove(minder.id);
    if (prev) {
      requestSelect(prev.id, 'end');
    }
  }

  async function addMinder() {
    const {range} = getSelection();
    const where = range ? range.start : value.length;

    var beforeText = value.substring(0, where) || '';
    var afterText = value.substring(where) || '';

    // Set the old minder values
    setValue(beforeText);

    // Create the new minder and request to be selected
    // This goes first so the new field can be seleted and typed in immediately
    const fields: Updater<Minder> = {
      text: afterText,
      project: minder.project,
      state: 'new',
    };
    if (mode === 'outline') {
      // TODO: Add ordering
      fields.parentId = minder.parentId;
    }
    await minderStore.create(fields, {optimistic: true});
    await minderStore.update({id: minder.id, text: beforeText});
  }

  function backspace() {
    // && isChild(item)
    if (value == '') {
      deleteMinder();
      return false;
    }
    return true;
  }

  function useTextShortcut(
    key: string,
    shift: boolean,
    action: ShortcutAction,
    enabled: boolean = true,
  ) {
    useShortcut({key, shift, action, inText: true}, isSel && enabled);
  }

  useTextShortcut('Tab', false, indent, mode === 'outline');
  useTextShortcut('Tab', true, outdent, mode === 'outline');
  useTextShortcut('Backspace', false, backspace);
  useTextShortcut('Enter', false, addMinder);
  useTextShortcut('Enter', true, submit);

  function onSelectionChange(
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) {
    if (active) {
      trackSelection(minder.id, {...e.nativeEvent.selection});
    }
  }

  //
  function checkNewSelection() {
    const newSelection = shouldSelect(minder.id);
    if (!newSelection) {
      return false;
    }
    const selector = newSelection?.selector;

    const range =
      selector === 'start'
        ? {start: 0, end: 0}
        : selector === 'end'
        ? {start: value.length, end: value.length}
        : {start: 0, end: value.length};
    trackSelection(minder.id, range);

    // We select twice to capture before and after the auto selection
    function select() {
      // Make sure selection hasn't changed during timeout
      if (getSelection()?.minderId !== minder.id) {
        return;
      }
      if (!inputRef.current) {
        return;
      }
      inputRef.current?.focus();
      textInputSelect(inputRef.current, range);
      setActive(true);
    }
    setTimeout(select, 0);
    return true;
  }

  function onBlur() {
    if (isSelected(minder.id)) {
      trackSelection(null);
    }
    setActive(false);
    const trimmed = value.trim();
    minderStore.update({id: minder.id, text: trimmed});
    setValue(trimmed);
  }

  function onFocus() {
    if (!checkNewSelection() && !isSelected(minder.id)) {
      const toSelect = Platform.OS === 'web' ? 'all' : 'end';
      requestSelect(minder.id, toSelect);
      checkNewSelection();
    }
  }

  const setInput = (input: TextInput) => {
    hasRendered.current = true;
    inputRef.current = input;
    checkNewSelection();
  };

  function submit() {
    // This will commit values
    inputRef.current?.blur();
  }

  return (
    <TextInput
      value={value}
      style={[S.listItemText, cursorStyle(cursor)]}
      onChangeText={val => setValue(val)}
      onBlur={onBlur}
      onFocus={onFocus}
      onSubmitEditing={submit}
      onSelectionChange={onSelectionChange}
      ref={setInput}
      selection={hasRendered.current ? undefined : {start: 0, end: 0}}
    />
  );
}

function cursorStyle(cursor: Opt<String>): StyleProp<TextStyle> {
  /** @ts-ignore */
  return {cursor};
}

const S = StyleSheet.create({
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
