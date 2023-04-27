import _ from 'underscore';

export type PropertyPatterns<V, T> =
  | { Progress: () => T; Failure: (error: Error) => T; Value: (v: V) => T }
  | { _: () => T };

export interface Property<V> {
  __type: 'VALUE' | 'INPROGRESS' | 'FAILURE';
  isProgress: boolean;
  isFailure: boolean;
  isValue: boolean;

  failure: Error | undefined;
  value: V | undefined;

  map<V2>(f: (value: V) => V2): Property<V2>;
  chain<V2>(f: (value: V) => Property<V2>): Property<V2>;

  isEqual(other: Property<V>): Boolean;

  toObject(): {
    __type: 'VALUE' | 'INPROGRESS' | 'FAILURE';
    isProgress: boolean;
    isFailure: boolean;
    isValue: boolean;

    failure: Error | undefined;
    value: V | undefined;
  };
}

interface PropertyTypeRef {
  of<V>(value?: V | Error): Property<V>;
  encase<V>(f: () => V | undefined): Property<V>;
  // values<V>(progresses: Property<V>[]): Property<V[]>
  // failures<V>(progresses: Property<V>[]): Property<never[]>
  isProperty<V>(x: unknown): x is Property<V>;
}

export const Property: PropertyTypeRef = {
  of: <V>(value?: V | Error): Property<V> => {
    return value ? (_.isError(value) ? new Failure<V>(value) : new Value(value)) : new Progress<V>();
  },
  encase: <V>(f: () => V | undefined): Property<V> => {
    try {
      return Property.of(f());
    } catch (err) {
      return new Failure(err as Error);
    }
  },
  isProperty<V>(x: unknown): x is Property<V> {
    return x instanceof Progress || x instanceof Failure || x instanceof Value;
  },
};

export class Progress<V> implements Property<V> {
  __type = 'INPROGRESS' as const;

  isProgress: boolean = true;
  isFailure: boolean = false;
  isValue: boolean = false;
  failure = undefined;
  value = undefined;

  map<V2>(_: (value: V) => V2): Property<V2> {
    return new Progress<V2>();
  }

  chain<V2>(_: (value: V) => Property<V2>): Property<V2> {
    return new Progress<V2>();
  }

  isEqual(other: Property<V>) {
    return other.__type === this.__type;
  }
  toObject() {
    return { ...this };
  }
}

export class Failure<V> implements Property<V> {
  __type = 'FAILURE' as const;

  constructor(public failure: Error) {}

  isProgress: boolean = false;
  isFailure: boolean = true;
  isValue: boolean = false;
  value = undefined;

  map<V2>(_: (value: V) => V2): Property<V2> {
    return new Failure<V2>(this.failure);
  }
  chain<V2>(_: (value: V) => Property<V2>): Property<V2> {
    return new Failure<V2>(this.failure);
  }

  isEqual(other: Property<V>) {
    return other.__type === this.__type && this.failure === other.failure;
  }

  toObject() {
    return { ...this };
  }
}

export class Value<V> implements Property<V> {
  __type = 'VALUE' as const;

  constructor(public value: V) {}
  failure = undefined;

  isProgress: boolean = false;
  isFailure: boolean = false;
  isValue: boolean = true;

  map<V2>(f: (value: V) => V2): Property<V2> {
    return new Value(f(this.value));
  }
  chain<V2>(f: (value: V) => Property<V2>): Property<V2> {
    return f(this.value);
  }

  isEqual(other: Property<V>) {
    return other.__type === this.__type && this.value === other.value;
  }

  toObject() {
    return { ...this };
  }
}
