/**
 * Screen that redirects to the "right" screen when launching
 * without a deep link.
 *
 * Currently just sets to the first project and 'focus' view,
 * but this may change in the future.
 */

import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {OutlineView, getSavedUiState} from '@app/AppLayout';
import {useMinderStore} from '@app/common/Minders';
import {useLoad, withLoad} from '@app/util/UseLoad';
import MinderList from './MinderList';

type Props = {
  top: string;
  view: OutlineView;
};

const Redirector: Screen<Props> = withLoad(props => {
  const minderStore = useMinderStore();
  const nav = useNav();

  const {top, view} = useLoad(props, getTopAndView);
  setTimeout(() => nav.reset(MinderList, {view, top}), 0);

  async function getTopAndView() {
    let uiState = await getSavedUiState();
    const view = uiState?.view ?? 'focus';
    let projectId = uiState?.project;
    if (projectId == null) {
      const projects = await minderStore.getProjects();
      projectId = projects[0].id;
    }

    const top = projectId.replace(':', '>');

    return {top, view};
  }

  return <></>;
});

export default Redirector;
