import { Property } from "./Property";
import { useRef, useState } from "react";
import _ from "underscore";

type PropertyMutator<V> = {
  setValue: <V2 extends V>(value: V2) => void;

  setLoading: () => void;

  setFailure: (failure: Error) => void;
};

type PropertyHook<V> = Property<V> & {
  asMutable(): [Property<V>, PropertyMutator<V>];
};

export function usePropertyBy<V>(params: {
  value: V;
  progress: boolean;
  error: Error;
}): PropertyHook<V> {
  const propValue = params.progress
    ? Property.of<V>()
    : params.error
    ? Property.of<V>(params.error)
    : Property.of(params.value);

  return useProperty(propValue);
}

export function useProperty<V>(
  prop?: V | Property<V> | (() => V) | (() => Property<V>)
): PropertyHook<V> {
  const propValue = _.isFunction(prop) ? prop() : prop;

  const property = Property.isProperty(propValue)
    ? propValue
    : Property.of(propValue);

  return Object.assign(property, { asMutable: () => makeFn(property) });
}

type VersionData<V> = {
  data: Property<V>;
  version: number;
};

type DependencyData<V> = VersionData<V>;

function makeFn<V>(_property: Property<V>): [Property<V>, PropertyMutator<V>] {
  const [state, setState] = useState<VersionData<V>>(() => ({
    data: _property,
    version: 0,
  }));

  const dependencyRef = useRef<DependencyData<V>>({
    version: 0,
    data: state.data,
  });

  const equal = dependencyRef.current.data.isEqual(_property);

  if (!equal) {
    const version = Math.max(state.version, dependencyRef.current.version) + 1;
    dependencyRef.current = {
      version,
      data: _property,
    };
  }

  const property =
    dependencyRef.current.version > state.version
      ? dependencyRef.current.data
      : state.data;

  const setProperty = (property: Property<V>) => {
    const version = Math.max(state.version, dependencyRef.current.version) + 1;
    setState({ data: property, version });
  };

  return [
    property,
    {
      setValue: <V2 extends V>(value: V2) => {
        setProperty(Property.of(value));
      },

      setLoading: () => {
        setProperty(Property.of());
      },

      setFailure: (failure: Error) => {
        setProperty(Property.of<V>(failure));
      },
    },
  ];
}
