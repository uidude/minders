/**
 * @format
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';
import {Opt} from '@toolkit/core/util/Types';
import {useShortcut} from '../util/Shortcuts';
import {useUiTool, type UiTool} from '../util/UiTools';

type SnoozeUnit = 'days' | 'hours';

type Callback = (result: {snoozeTil: number}) => void;
type CallbackHolder = {callback: Opt<Callback>};

const SnoozeDialogComponent = () => {
  const [{callback}, setCallback] = React.useState<CallbackHolder>({
    callback: null,
  });
  const waitDialog = SnoozeDialog.get();
  const visible = callback != null;

  useShortcut({
    key: 'Escape',
    action: dismiss,
  });

  waitDialog.handler = newCallback => {
    setCallback({callback: newCallback});
  };

  function dismiss() {
    setCallback({callback: null});
  }

  const UNIT_TO_MS = {
    days: 3600 * 1000 * 24,
    hours: 3600 * 1000,
  };

  async function snooze(amt: number, unit: 'days' | 'hours') {
    if (!callback) {
      return;
    }
    callback({snoozeTil: Date.now() + UNIT_TO_MS[unit] * amt});
    dismiss();
  }

  function SnoozeButton(props: {amt: number; unit: SnoozeUnit}) {
    const {amt, unit} = props;
    const title = amt == 0 ? 'no time' : `${amt} ${unit}`;
    return (
      <Button style={S.button} onPress={() => snooze(amt, unit)}>
        {title}
      </Button>
    );
  }

  return (
    <View>
      <Portal>
        <Dialog style={S.dialog} visible={visible} onDismiss={dismiss}>
          <Dialog.Title>Snooze for</Dialog.Title>
          <Dialog.Content>
            <View style={{flexDirection: 'row'}}>
              <View style={S.buttons}>
                <SnoozeButton amt={0} unit="hours" />
                <SnoozeButton amt={1} unit="hours" />
                <SnoozeButton amt={2} unit="hours" />
                <SnoozeButton amt={4} unit="hours" />
                <SnoozeButton amt={8} unit="hours" />
              </View>
              <View style={S.buttons}>
                <SnoozeButton amt={1} unit="days" />
                <SnoozeButton amt={3} unit="days" />
                <SnoozeButton amt={7} unit="days" />
                <SnoozeButton amt={14} unit="days" />
                <SnoozeButton amt={28} unit="days" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button style={S.cancel} mode="contained" onPress={dismiss}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export class SnoozeDialog {
  handler: (callback?: Callback) => void;

  // TODO: This is hacky, we should update to a cleaner API pattern
  show(callback: Callback) {
    this.handler?.(callback);
  }

  static get(): SnoozeDialog {
    return useUiTool(SnoozerChooser);
  }
}

export const SnoozerChooser: UiTool<SnoozeDialog> = {
  api: new SnoozeDialog(),
  component: SnoozeDialogComponent,
};

const S = StyleSheet.create({
  dialog: {maxWidth: 500, alignSelf: 'center'},
  cancel: {
    marginRight: 20,
    marginBottom: 20,
  },
  buttons: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  button: {
    marginTop: 12,
    marginLeft: 6,
    marginRight: 6,
  },
});
