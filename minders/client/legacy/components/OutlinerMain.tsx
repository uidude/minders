/**
 * @format
 */

import * as React from 'react';
import {Text, View} from 'react-native';
import {
  NavigationContainer,
  getPathFromState,
  getStateFromPath,
  useNavigation,
  useNavigationState,
  useRoute,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import ActionButton from './ActionButton';
import {Login} from './Actions';
import OutlineFrame from './OutlineFrame';
import OutlineList from './OutlineList';
import OutlineMover from './OutlineMover';
import OutlineTop from './OutlineTop';
import {useOutlineStore, useOutliner} from './OutlinerContext';

export type Nav = any;

const Stack = createStackNavigator();

const outlineScreen = (Component: React.ComponentType<{}>) => {
  // Only render most recent screens
  // TODO: Hook this
  const outlineScreenComponent = () => {
    const route = useRoute();
    let myIndex = -1;
    const recent = useNavigationState(state => {
      state.routes.forEach((cur, index) => {
        if (cur.key == route.key) {
          myIndex = index;
        }
      });
      return myIndex >= state.routes.length - 1;
    });

    if (!recent) {
      return <View />;
    }

    return (
      <OutlineFrame>
        <Component />
      </OutlineFrame>
    );
  };
  return outlineScreenComponent;
};

const linking = {
  prefixes: [],
  notConfig: {
    outline: {path: 'outline'},
    list: {path: 'list'},
  },

  initialState: {
    config: {
      outline: {path: 'outline'},
      list: {path: 'list'},
    },
    enabled: true,
    prefixes: [],
  },
  getStateFromPath: (path: string, config: any) => {
    const gsp = getStateFromPath(path, config);
    //console.log('gsp', path, config, gsp);
    return gsp;
  },
  getPathFromState: (state: any, config: any) => {
    //console.log('gps', state, config);
    return getPathFromState(state, config);
  },
};

const Top = outlineScreen(OutlineTop);
const List = outlineScreen(OutlineList);
const Mover = outlineScreen(OutlineMover);

export default function OutlinerMain() {
  const outlineStore = useOutlineStore();

  if (!outlineStore.loading && !outlineStore.loaded) {
    return (
      <View>
        <Text>Log in here:</Text>
        <ActionButton action={Login} />
      </View>
    );
  }
  return (
    // TODO: Use linking state to go back past internal history
    /* Was 
    <NavigationContainer initialRouteName="home"> */

    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{animationEnabled: true}}>
        <Stack.Screen
          options={{headerShown: false}}
          name="home"
          component={HomeRedirector}
        />
        <Stack.Screen
          options={{headerShown: false}}
          name="outline"
          component={Top}
        />
        <Stack.Screen
          options={{headerShown: false}}
          name="list"
          component={List}
        />
        <Stack.Screen
          options={{headerShown: false}}
          name="mover"
          component={Mover}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const HomeRedirector = () => {
  const outliner = useOutliner();
  const nav = useNavigation();
  // TODO: Remember last view?
  const focusItem = outliner.getFocusItem();
  const defaultFocusItem = outliner.getData();
  const focusItemId =
    focusItem.id != defaultFocusItem.id ? focusItem.id : undefined;
  // @ts-ignore
  nav.replace('outline', {focus: focusItemId});
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
};
