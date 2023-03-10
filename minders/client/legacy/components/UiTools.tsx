/**
 * @format
 */

import * as React from 'react';

// TODO: We can probably put the component on the API
export type UiTool<API> = {
  api: API;
  component: React.ComponentType<{}>;
};

type UiTools = Map<UiTool<any>, any>;

export const UsingUiTools = (props: {
  tools: UiTool<any>[];
  children: React.ReactNode;
}) => {
  const {tools, children} = props;

  const uiTools = new Map();

  for (const tool of tools) {
    uiTools.set(tool, tool.api);
  }

  return (
    <UiToolsContext.Provider value={uiTools}>
      {children}
      {[...tools].map((tool, idx) => {
        const Component = tool.component;
        return <Component key={'t' + idx} />;
      })}
    </UiToolsContext.Provider>
  );
};

export const UiToolsContext = React.createContext<UiTools>(new Map());

export const useUiTool = <API,>(uiTool: UiTool<API>): API => {
  const ctx = React.useContext(UiToolsContext);
  const value = ctx.get(uiTool);
  if (!value) {
    throw new Error(
      'UITool ' + String(uiTool.component.name) + ' needs to be installed.',
    );
  }
  return value;
};
