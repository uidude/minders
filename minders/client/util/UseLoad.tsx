import * as React from 'react';
import Promised from '@toolkit/core/util/Promised';

type Loader<T> = () => T | Promise<T>;

export function useLoad<T>(props: Record<string, any>, loader: Loader<T>): T {
  const [loadCount, setLoadCount] = React.useState(0);
  const {_loadkey: key, _loadstate} = props;
  if (!key) {
    throw Error(
      'useLoad requires components to be wrapped with withLoad() HOC',
    );
  }
  const loadState = _loadstate as LoadState;
  const promises = loadState.promises;

  function reload() {
    delete promises[key];
    setLoadCount(loadCount + 1);
  }

  let promised = promises[key];

  if (!promised) {
    const newPromised = new Promised<T>(loader());
    promised = newPromised;
    promises[key] = promised;
  }

  // This will throw if it is pending or in an error state.
  // Avoids infinite looops by:
  // - When pending, React Suspense will only re-render after value is set, so
  //   won't throw next time.
  // - When erroring, React Error bondary will render a fallback view
  const value = promised.getValue();
  return {...value, reload};
}

type LoadState = {
  promises: Record<string, Promised<any>>;
  refresh: () => void;
};

/**
 * Return a HOC that allows the wrapped component to use `useLoad()`.
 *
 * This is required to preserve state across renders where the component throws
 * React.Suspense or an error, as state is lost.
 *
 * Tried using a global cache, but found that race conditions made it infeasible -
 * you really needed to know which component instance triggered the render
 */
export function withLoad<Props>(Component: React.ComponentType<Props>) {
  return (props: Props) => {
    const [refreshCount, setRefreshCount] = React.useState(0);
    // Load state is state that is passed to the child component via props.
    // Includes both a persistent set of promises as well as methods
    // and future state / methods that will be updated on every render.
    const loadState = React.useRef<LoadState>({promises: {}, refresh});
    loadState.current.refresh = refresh;

    const propsForKey = {...props, _count: refreshCount} as Record<string, any>;
    const loadKey = propsToKey(propsForKey, ['async', '_promises']);

    return (
      <Component {...props} _loadstate={loadState.current} _loadkey={loadKey} />
    );

    function refresh() {
      setRefreshCount(refreshCount + 1);
    }
  };
}

export function useRefresh(props: Record<string, any>) {
  const loadState = props._loadstate as LoadState;
  return loadState.refresh;
}

export function useWithLoad<Props>(Component: React.ComponentType<Props>) {
  return React.useMemo(() => withLoad(Component), [Component]);
}

/**
 * Turn component props into a key for caching.
 */
function propsToKey(
  obj: Record<string, string>,
  exclude: string[] = [],
  depth = 0,
) {
  if (depth > 100) {
    throw new Error('Maximum depth exceeded to prevent infinite loops');
  }

  const keys = Object.keys(obj)
    .filter(
      key =>
        !exclude.includes(key) &&
        !React.isValidElement(obj[key]) &&
        typeof obj[key] !== 'function',
    )
    .sort();

  const result: string = keys
    .map(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        return `${key}:${propsToKey(value, [], depth + 1)}`;
      } else {
        return `${key}:${JSON.stringify(value)}`;
      }
    })
    .join(',');

  return result;
}
