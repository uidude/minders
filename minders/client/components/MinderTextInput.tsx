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
import {Updater, useDataListen} from '@toolkit/data/DataStore';
import {Minder, MinderProject, useMinderStore} from '@app/common/MinderApi';
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

  /** Project this minder is in */
  project: MinderProject;

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
  const {project, prev, grandparent, mode = 'list'} = props;
  const [minder, setMinder] = React.useState(props.minder);
  const [value, setValue] = React.useState(minder.text);
  // TODO: Make this a ref
  const [active, setActive] = React.useState(false);
  const minderStore = useMinderStore();
  const {action: indent} = useIndent(minder, prev);
  const {action: outdent} = useOutdent(minder, grandparent);
  const hasRendered = React.useRef(false);
  const deletedRef = React.useRef(false);
  const lastTextEdit = React.useRef(0);

  // Update text when not active

  useDataListen(Minder, minder.id, m => {
    setMinder(m);
    if (!active) {
      setValue(m.text);
    }
  });

  const isSel = isSelected(minder.id);
  const cursor = isSel ? null : 'default';
  const inputRef = React.useRef<TextInput>();

  // TODO: Action
  async function deleteMinder() {
    if (prev) {
      requestSelect(prev.id, 'end');
    }
    // Mark as deleted so we don't try to update or accesss
    deletedRef.current = true;

    await minderStore.remove(minder.id, {optimistic: true});
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
      project,
      state: 'new',
    };
    if (mode === 'outline') {
      // TODO: Add ordering
      fields.parentId = minder.parentId;
    }

    // Note: We don't have to update the previous minder - this will occur onBlur()
    // and doing it hear can create an update race condition
    await minderStore.create(fields, {optimistic: true});
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

  async function onBlur() {
    if (isSelected(minder.id)) {
      trackSelection(null);
    }
    setActive(false);
    await save(value);
  }

  async function save(newValue: string) {
    const trimmed = newValue.trim();
    if (!deletedRef.current && trimmed !== minder.text) {
      setValue(trimmed);
      await minderStore.update(
        {
          id: minder.id,
          text: trimmed,
          checkVersion: minder.updatedAt,
        },
        {optimistic: true},
      );
    }
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

  function onChangeText(val: string) {
    const editTime = Date.now();
    lastTextEdit.current = editTime;
    setValue(val);
    // Edits are applied on blur, or after 500ms of not typing
    setTimeout(() => {
      const lastEdit = lastTextEdit.current;
      if (lastEdit == editTime) {
        save(val);
      }
    }, 500);
  }

  // Android needs to be set to 0,0 on first render to left align overflowing inputs
  const selection =
    Platform.OS === 'android' && !hasRendered.current
      ? {start: 0, end: 0}
      : undefined;

  return (
    <TextInput
      value={value}
      style={[S.listItemText, cursorStyle(cursor)]}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onFocus={onFocus}
      onSubmitEditing={submit}
      onSelectionChange={onSelectionChange}
      ref={setInput}
      selection={selection}
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
