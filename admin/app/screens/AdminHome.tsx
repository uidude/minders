/**
 * Admin home page
 */

import * as React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {User, requireLoggedInUser} from '@toolkit/core/api/User';
import {useHasAdminRole} from '@toolkit/core/util/Access';
import {useDataStore} from '@toolkit/data/DataStore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';
import {Screen} from '@toolkit/ui/screen/Screen';
import {usePrivacyRulesEnabled} from '@app/admin/../../npe-toolkit/lib/core/util/Access';

type Props = {
  async: {
    rulesDeployed: boolean;
    isAdmin: boolean;
  };
};

function toCheckbox(checked: boolean) {
  return checked ? '☑' : '□';
}

function checkboxRow(checked: boolean, text: string) {
  return `&nbsp;&nbsp;&nbsp;&nbsp;${toCheckbox(checked)}  ${text}`;
}

const AdminHome: Screen<Props> = props => {
  requireLoggedInUser();
  const {rulesDeployed, isAdmin} = props.async;

  const md = `
Welcome to the admin Panel!

We'll add more to this page over time, but to start, we have
a useful checklist of production steps to take.

### Todo List
**Initial prod configuration**
These will become checked as they are completed (need to reload to see)
${checkboxRow(
  isAdmin,
  'Give yourself "admin" and "allowlist" roles on [Allowlist](allowlist)',
)}
${checkboxRow(rulesDeployed, 'Deploy privacy rules')}

`;

  return (
    <ScrollView style={S.container}>
      {/* @ts-ignore Markdown props don't have "children" yet */}
      <Markdown style={MARKDOWN_STYLE}>{md}</Markdown>
    </ScrollView>
  );
};
AdminHome.title = 'Admin Panel';
AdminHome.style = {type: 'top'};

AdminHome.load = async props => {
  const user = requireLoggedInUser();
  const allowlistStore = useDataStore(AllowlistEntry);
  const getRulesDeployed = usePrivacyRulesEnabled();
  const hasAdminRole = useHasAdminRole();

  const rulesDeployed = await getRulesDeployed();

  let isAdmin = false;

  if (rulesDeployed) {
    isAdmin = await hasAdminRole();
  } else {
    isAdmin = isUserAdmin(user, await allowlistStore.getAll());
  }

  return {
    rulesDeployed,
    isAdmin,
  };
};

function isUserAdmin(user: User, entries: AllowlistEntry[]) {
  for (const entry of entries) {
    const userKey = entry.id.replace('allowlist:', '');

    if (userKey == user.email || userKey == user.phone) {
      if (entry.roles.indexOf('admin') !== -1) {
        return true;
      }
    }
  }
  return false;
}

const MARKDOWN_STYLE: StyleSheet.NamedStyles<any> = {
  text: {
    color: '#555',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  heading3: {
    fontSize: 21,
    fontWeight: '600',
    paddingBottom: 0,
    paddingTop: 12,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    fontWeight: '500',
  },
};

const S = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
  row: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
});

export default AdminHome;
