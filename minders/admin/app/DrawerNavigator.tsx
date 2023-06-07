import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '@toolkit/core/api/Auth';
import {useLoggedInUser} from '@toolkit/core/api/User';
import {
  NavContext,
  useReactNavScreens,
} from '@toolkit/providers/navigation/ReactNavigation';
import AllowlistScreen from '@toolkit/screens/admin/Allowlist';
import AllowlistEdit from '@toolkit/screens/admin/AllowlistEdit';
import {NavItem, drawerLayout} from '@toolkit/ui/layout/DrawerLayout';
import AdminHome from './screens/AdminHome';
import AllUsersScreen from './screens/AllUsersScreen';
import BroadcastNotificationModal from './screens/BroadcastNotificationModal';
import EditUserScreen from './screens/EditUserScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SendNotificationModal from './screens/SendNotificationModal';

// Experimental deletion support - not ready for production
// Uncomment here and also references below to experiment with deletion
// import {
//  DELETION_ROUTES,
//  TOP_LEVEL_DELETION_SCREENS,
// } from '@toolkit/experimental/deletion/screens/DeletionScreens';

const Stack = createStackNavigator();
const DrawerNavigator = () => {
  const auth = useAuth();
  const user = useLoggedInUser();
  const isDev = user?.roles?.roles.includes('dev') || true;

  const logoutAction = {
    id: 'logout',
    label: 'Logout',
    icon: 'mci:logout',
    action: () => auth.logout(),
  };

  const navItems: NavItem[] = [
    {screen: AllUsersScreen},
    {screen: NotificationsScreen},
    {screen: AllowlistScreen},
  ];

  if (isDev) {
    //navItems.push({divider: true}, {header: 'Deletion'});
    //TOP_LEVEL_DELETION_SCREENS.forEach(screen => navItems.push({screen}));
  }

  const routes = {
    users: AllUsersScreen,
    notifications: NotificationsScreen,
    sendNotif: SendNotificationModal,
    editUser: EditUserScreen,
    login: LoginScreen,
    broadcast: BroadcastNotificationModal,
    allowlist: AllowlistScreen,
    editAllowlist: AllowlistEdit,
    home: AdminHome,
    //...DELETION_ROUTES,
  };

  const {navScreens, linkingScreens} = useReactNavScreens(
    routes,
    drawerLayout({
      title: 'Favezilla Admin',
      navItems: navItems,
      loginScreen: LoginScreen,
      home: AllUsersScreen,
      navWidth: 300,
      navActions: [logoutAction],
    }),
    Stack.Screen,
  );

  const linking = {
    prefixes: ['localhost:19006'],
    config: linkingScreens,
  };

  return (
    <NavigationContainer linking={linking}>
      <NavContext routes={routes} />
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="home">
        {navScreens}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default DrawerNavigator;
