import {useRoute} from '@react-navigation/native';

// Note: Having this utility in AppLayout broke
// hot refresh for most of the app ¯\_(ツ)_/¯
export function useMinderListParams() {
  const route = useRoute();
  const params = route.params as any;

  const view = params?.view ?? 'focus';
  const top = params?.top?.replace('>', ':');
  const isProject = top && top.startsWith('project:');

  return {view, top, isProject};
}
