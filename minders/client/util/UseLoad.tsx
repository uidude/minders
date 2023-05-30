import * as React from 'react';
import {useReloadState} from '@toolkit/core/client/Reload';
import Promised from '@toolkit/core/util/Promised';

type WithSetter<T> = T & {
  setData: (value: Partial<T>) => void;
};
type Loader<T> = () => T | Promise<T>;

export function useLoad<T>(
  props: Record<string, any>,
  loader: Loader<T>,
): WithSetter<T> {
  const {_loadkey: key, _loadstate} = props;
  if (!key) {
    throw Error(
      'useLoad requires components to be wrapped with withLoad() HOC',
    );
  }
  const loadState = _loadstate as LoadState;
  const promises = loadState.promises;

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
  const [value, setValue] = React.useState(promised.getValue());

  const lastKey = React.useRef(key);
  if (lastKey.current !== key) {
    setValue(promised.getValue());
    lastKey.current = key;
  }

  function setData(newValues: Partial<T>) {
    const newData = {...value, ...newValues};
    promises[key] = new Promised(newData);
    setValue(newData);
  }

  return {...value, setData};
}

type LoadState = {
  key: string;
  promises: Record<string, Promised<any>>;
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
  const ComponentWithLoad = (props: Props) => {
    const loadCount = useReloadState();

    const propsForKey = {...props, _count: loadCount} as Record<string, any>;
    const loadKey = propsToKey(propsForKey, ['async', '_promises']);

    // Load state is state that is passed to the child component via props.
    // Includes both a persistent set of promises as well as methods
    // and future state / methods that will be updated on every render.
    const initialState: LoadState = {key: loadKey, promises: {}};

    // Currently we reset the load state when keys change, becasue
    // we don't have a way to update the cache for previously loaded items
    // when the component using this data isn't mounted (`setData()` only
    // operates a currently mounted component).
    // TODO: Dynamic load state that is able to update the cached value
    const loadState = React.useRef<LoadState>(initialState);
    if (loadKey !== loadState.current.key) {
      loadState.current = initialState;
    }

    return (
      <Component
        {...props}
        key={loadKey}
        _loadstate={loadState.current}
        _loadkey={loadKey}
      />
    );
  };
  return ComponentWithLoad;
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
