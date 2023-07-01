import * as React from 'react';
import {Alert, Modal, Platform, StyleSheet, View} from 'react-native';
import {Opt} from '@toolkit/core/util/Types';
import {useComponents} from '@toolkit/ui/components/Components';

type PromptFn = (title: string, value?: string) => Promise<Opt<string>>;

export function usePrompt(): [PromptFn, React.ComponentType<{}>] {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const resolveRef = React.useRef<(val: Opt<string>) => void>();
  const [dialogTitle, setTitle] = React.useState('');
  const {H2, TextInput, Button} = useComponents();

  function resolveWith(val: Opt<string>) {
    resolveRef.current && resolveRef.current(val);
  }

  const prompt = React.useCallback((title: string, value: string = '') => {
    setTitle(title);
    setInputText(value);
    return new Promise<Opt<string>>(resolve => {
      resolveRef.current = resolve;

      if (Platform.OS === 'ios') {
        Alert.prompt(
          title,
          '',
          [
            {text: 'Cancel', onPress: () => resolveWith(null), style: 'cancel'},
            {text: 'Confirm', onPress: text => resolveWith(text)},
          ],
          'plain-text',
          value,
        );
      } else {
        setModalVisible(true);
      }
    });
  }, []);

  const confirm = () => {
    setModalVisible(false);
    resolveWith(inputText);
  };

  const cancel = () => {
    setModalVisible(false);
    resolveWith(null);
  };

  const PromptComponent = () => (
    <Modal transparent={true} visible={modalVisible} onRequestClose={cancel}>
      <View style={S.modalContainer}>
        <View style={S.modalContent}>
          <View>
            <H2>{dialogTitle}</H2>
            <TextInput
              type="primary"
              value={inputText}
              onChangeText={setInputText}
            />
            <View style={S.buttons}>
              <Button onPress={cancel}>Cancel</Button>
              <View style={{width: 10}} />
              <Button type="primary" onPress={confirm}>
                Confirm
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return [prompt, PromptComponent];
}

const S = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    paddingHorizontal: 22,
    paddingVertical: 20,
    // justifyContent: 'center',
    minWidth: 350,
    shadowColor: '#000',
    maxHeight: 200,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#d3d3d3',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});
