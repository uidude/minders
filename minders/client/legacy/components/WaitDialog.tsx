/**
 * @format
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';
import {Opt} from '@toolkit/core/util/Types';
import Outliner, {type OutlineItem} from '../model/outliner';
import {useShortcut} from './Shortcuts';
import {useUiTool, type UiTool} from './UiTools';

type SnoozeUnit = 'days' | 'hours';

const WaitDialogComponent = () => {
  const {dialog, cancel} = STYLES;
  const [item, setItem] = React.useState<OutlineItem | null>();
  const [outliner, setOutliner] = React.useState<Outliner>();
  const waitDialog = WaitDialog.get();
  const visible = item != null;

  useShortcut({
    key: 'Escape',
    action: dismiss,
  });

  waitDialog.handler = (outliner, item) => {
    setOutliner(outliner);
    setItem(item);
  };

  function dismiss() {
    setItem(null);
  }

  const UNIT_TO_MS = {
    days: 3600 * 1000 * 24,
    hours: 3600 * 1000,
  };

  function snooze(amt: number, unit: 'days' | 'hours') {
    if (!item || !outliner) {
      return;
    }
    const update: Partial<OutlineItem> = {
      snoozeTil: new Date(Date.now() + UNIT_TO_MS[unit] * amt),
      state: 'waiting',
    };
    outliner.updateOutlineItem(item, update);
    setItem(null);
  }

  function SnoozeButton(props: {amt: number; unit: SnoozeUnit}) {
    const {amt, unit} = props;
    const {button} = STYLES;
    const title = amt == 0 ? 'no time' : `${amt} ${unit}`;
    return (
      <Button style={button} onPress={() => snooze(amt, unit)}>
        {title}
      </Button>
    );
  }

  return (
    <View>
      <Portal>
        <Dialog style={dialog} visible={visible} onDismiss={dismiss}>
          <Dialog.Title>Snooze for</Dialog.Title>
          <Dialog.Content>
            <View style={{flexDirection: 'row'}}>
              <View style={STYLES.buttons}>
                <SnoozeButton amt={0} unit="hours" />
                <SnoozeButton amt={1} unit="hours" />
                <SnoozeButton amt={2} unit="hours" />
                <SnoozeButton amt={4} unit="hours" />
                <SnoozeButton amt={8} unit="hours" />
              </View>
              <View style={STYLES.buttons}>
                <SnoozeButton amt={1} unit="days" />
                <SnoozeButton amt={3} unit="days" />
                <SnoozeButton amt={7} unit="days" />
                <SnoozeButton amt={14} unit="days" />
                <SnoozeButton amt={28} unit="days" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button style={cancel} mode="contained" onPress={dismiss}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export class WaitDialog {
  handler: (outliner: Outliner, item: Opt<OutlineItem>) => void;

  show(outliner: Outliner, item: Opt<OutlineItem>) {
    this.handler && this.handler(outliner, item);
  }

  static get(): WaitDialog {
    return useUiTool(WaitDialogTool);
  }
}

export const WaitDialogTool: UiTool<WaitDialog> = {
  api: new WaitDialog(),
  component: WaitDialogComponent,
};

const STYLES = StyleSheet.create({
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
