import React from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  TextStyle,
} from 'react-native';
import {Opt} from '@toolkit/core/util/Types';
import {Updater} from '@toolkit/data/DataStore';
import {
  Minder,
  dataListen,
  useMinderScreenState,
  useMinderStore,
} from '@app/model/Minders';
import {ShortcutAction, useShortcut} from '@app/util/Shortcuts';
import {textInputSelect} from '@app/util/Useful';
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
  const [active, setActive] = React.useState(false);
  const {
    trackSelection,
    isSelected,
    getSelection,
    requestSelect,
    shouldSelect,
  } = useMinderScreenState();
  const minderStore = useMinderStore();
  const {action: indent} = useIndent(minder, prev);
  const {action: outdent} = useOutdent(minder, grandparent);

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
    await minderStore.update(minder, {text: beforeText});

    // Create the new minder and request to be selected
    const fields: Updater<Minder> = {
      text: afterText,
      project: minder.project,
      state: 'new',
    };

    if (mode === 'outline') {
      // TODO: Add ordering
      fields.parentId = minder.parentId;
    }

    const newMinder = await minderStore.create(fields);
    requestSelect(newMinder.id, 'start');
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
      return;
    }
    inputRef.current?.focus();

    // We select twice to capture before and after the auto selection
    function select() {
      const selector = newSelection?.selector;
      if (!inputRef.current) {
        return;
      }
      if (selector === 'start') {
        textInputSelect(inputRef.current, {start: 0, end: 0});
      } else if (selector === 'end') {
        textInputSelect(inputRef.current, {
          start: value.length,
          end: value.length,
        });
      } else if (selector === 'all') {
        textInputSelect(inputRef.current, {start: 0, end: value.length});
      }
    }
    select();
    setTimeout(select, 10);
  }

  function onBlur() {
    trackSelection(null);
    setActive(false);
    const trimmed = value.trim();
    minderStore.update(minder, {text: trimmed});
    setValue(trimmed);
  }

  function onFocus() {
    trackSelection(minder.id, {start: 0, end: value.length});
    setActive(true);
    //checkNewSelection();
  }

  const setInput = (input: TextInput) => {
    inputRef.current = input;
    checkNewSelection();
  };

  function submit() {
    // This will commit values
    inputRef.current?.blur();
  }

  return (
    <>
      <TextInput
        value={value}
        style={[S.listItemText, cursorStyle(cursor)]}
        onChangeText={val => setValue(val)}
        onBlur={onBlur}
        onFocus={onFocus}
        onSubmitEditing={submit}
        onSelectionChange={onSelectionChange}
        ref={setInput}
        selectTextOnFocus={true}
      />
      <Text>{minder.id}</Text>
    </>
  );
}

function cursorStyle(cursor: Opt<String>): StyleProp<TextStyle> {
  /** @ts-ignore */
  return {cursor};
}

const S = StyleSheet.create({
  listItemText: {
    fontSize: 16,
    opacity: 0.85,
    fontWeight: '500',
  },
});