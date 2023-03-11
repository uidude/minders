/**
 * @format
 */

import React, {Suspense, useContext, useState} from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {MessagingTool} from './components/Messaging';
import OutlinerContext from './components/OutlinerContext';
import OutlinerMain from './components/OutlinerMain';
import {ShortcutTool} from './components/Shortcuts';
import {UsingUiTools} from './components/UiTools';
import {WaitDialogTool} from './components/WaitDialog';

function isDesktopWeb(): boolean {
  if (!navigator.userAgent) {
    return false;
  }
  return !/android|webos|iphone|ipad|ipod/.test(
    navigator.userAgent.toLowerCase(),
  );
}

export default function App() {
  const context = useContext(OutlinerContext);
  const [height, setHeight] = useState(Dimensions.get('window').height);
  //context.init();

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
        <View style={S.background}>
          <View style={[S.container, heightStyle]}>
            <Suspense fallback={<Text>Loading...</Text>}>
              <OutlinerMain />
            </Suspense>
          </View>
        </View>
      </UsingUiTools>
    </PaperProvider>
  );
}

const S = StyleSheet.create({
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
