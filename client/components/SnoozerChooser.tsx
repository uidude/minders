/**
 * @format
 */

import * as React from 'react';
import {Platform, StyleSheet, TextInput, View} from 'react-native';
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
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const waitDialog = SnoozeDialog.get();
  const visible = callback != null;

  useShortcut({
    key: 'Escape',
    action: dismiss,
  });

  waitDialog.handler = newCallback => {
    setCallback({callback: newCallback});
    // Reset date when dialog opens
    setSelectedDate('');
  };

  function dismiss() {
    setCallback({callback: null});
    setSelectedDate('');
  }

  const UNIT_TO_MS = {
    days: 3600 * 1000 * 24,
    hours: 3600 * 1000,
  };

  async function snooze(amt: number, unit: 'days' | 'hours') {
    await snoozeTil(Date.now() + UNIT_TO_MS[unit] * amt);
  }

  async function snoozeTil(when: number) {
    if (!callback) {
      return;
    }
    callback({snoozeTil: when});
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

  async function snoozeTilEvening() {
    await snoozeTil(thisEvening());
  }

  async function snoozeTilTomorrow() {
    // Tomorrow will flip to active at 4am
    await snoozeTil(tomorrowMorning());
  }

  async function snoozeTilDate() {
    if (!selectedDate) return;
    const timestamp = morningOfDate(selectedDate);
    await snoozeTil(timestamp);
  }

  // Get minimum date (tomorrow) for the date picker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <View>
      <Portal>
        <Dialog style={S.dialog} visible={visible} onDismiss={dismiss}>
          <Dialog.Title style={{marginBottom: 0, alignSelf: 'center'}}>
            Snooze for
          </Dialog.Title>
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
          <Dialog.Title style={{marginVertical: 0, alignSelf: 'center'}}>
            Or snooze until
          </Dialog.Title>
          <Dialog.Content>
            <View style={{flexDirection: 'row'}}>
              <View style={S.buttons}>
                <Button style={S.button} onPress={snoozeTilEvening}>
                  Evening
                </Button>
              </View>
              <View style={S.buttons}>
                <Button style={S.button} onPress={snoozeTilTomorrow}>
                  Tomorrow
                </Button>
              </View>
            </View>
            <View style={S.datePickerContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{
                    padding: 8,
                    fontSize: 16,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    marginRight: 8,
                    flex: 1,
                  }}
                />
              ) : (
                <TextInput
                  style={S.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                />
              )}
              <Button
                mode="contained"
                onPress={snoozeTilDate}
                disabled={!selectedDate}
                style={S.dateButton}>
                Snooze to Date
              </Button>
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

function tomorrowMorning() {
  const date = new Date();

  // Check if the current time is before 4am
  if (date.getHours() < 4) {
    // Set the time to 4am on the same day
    date.setHours(4, 0, 0, 0);
  } else {
    // Add one day to the current date
    date.setDate(date.getDate() + 1);
    // Set the time to 4am
    date.setHours(4, 0, 0, 0);
  }
  return date.getTime();
}

function thisEvening() {
  const date = new Date();

  // Set the time to 8pm
  date.setHours(20, 0, 0, 0);

  return date.getTime();
}

/**
 * Returns timestamp for 4am on the given date string (YYYY-MM-DD format).
 * Uses the same logic as tomorrowMorning() - snooze expires at 4am.
 */
function morningOfDate(dateString: string): number {
  // Parse the date string as local date
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Set to 4am (same as tomorrowMorning logic)
  date.setHours(4, 0, 0, 0);
  return date.getTime();
}

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
    minWidth: 120,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    marginTop: 12,
    marginLeft: 6,
    marginRight: 6,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 6,
  },
  dateInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  dateButton: {
    marginLeft: 8,
  },
});
