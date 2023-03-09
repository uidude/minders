// @flow

import React, {Suspense, useContext, useState} from 'react';
import {
  StyleSheet,
  Text,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import OutlinerMain from './components/OutlinerMain';
import OutlinerContext from './components/OutlinerContext';
import {UsingUiTools} from './components/UiTools';
import {MessagingTool} from './components/Messaging';
import {ShortcutTool} from './components/Shortcuts';
import {Provider as PaperProvider} from 'react-native-paper';
import {WaitDialogTool} from './components/WaitDialog';

function isDesktopWeb(): boolean {
  if (!navigator.userAgent) {
    return false;
  }
  return !/android|webos|iphone|ipad|ipod/.test(
    navigator.userAgent.toLowerCase()
  );
}

export default function App() {
  const context = useContext(OutlinerContext);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  context.init();

  React.useEffect(() => {
    Dimensions.addEventListener('change', onLayout);
    return () => {
      Dimensions.removeEventListener('change', onLayout);
    };
  });

  function onLayout() {
    if (isDesktopWeb()) {
      setHeight(Dimensions.get('window').height);
    }
  }

  const heightStyle = {height: height, maxHeight: height};

  // TODO: Re-nable return to SafeAreaView for Web
  return (
    // TODO: Wrap entire context frame into a single tag
    <PaperProvider>
      <UsingUiTools tools={[MessagingTool, ShortcutTool, WaitDialogTool]}>
        <View style={styles.background}>
          <View style={[styles.container, heightStyle]}>
            <Suspense fallback={<Text>Loading...</Text>}>
              <OutlinerMain />
            </Suspense>
          </View>
        </View>
      </UsingUiTools>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    //height: Dimensions.get('window').height,
    //maxHeight: Dimensions.get('window').height,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    maxWidth: 800,
  },
  background: {
    backgroundColor: '#183048',
    flexDirection: 'row',
    justifyContent: 'center',
    height: '100%',
  },
});
