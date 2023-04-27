import { Property, Progress, Failure, Value } from '../Property';

describe('Property.of', () => {
  it('should create Progress properly', () => {
    const prop = Property.of<number>();

    expect(prop.isProgress).toBe(true);
    expect(prop.isFailure).toBe(false);
    expect(prop.isValue).toBe(false);
    expect(prop.failure).toBe(undefined);
    expect(prop.value).toBe(undefined);

    expect(prop).toBeInstanceOf(Progress);
  });

  it('should create Failure properly', () => {
    const prop = Property.of<number>(new Error('Test error'));

    expect(prop.isProgress).toBe(false);
    expect(prop.isFailure).toBe(true);
    expect(prop.isValue).toBe(false);
    expect(prop.failure).not.toBe(undefined);
    expect(prop.value).toBe(undefined);

    expect(prop).toBeInstanceOf(Failure);
    expect(prop.failure?.message).toBe('Test error');
  });
  it('should create Value properly', () => {
    const prop = Property.of<number>(10);

    expect(prop.isProgress).toBe(false);
    expect(prop.isFailure).toBe(false);
    expect(prop.isValue).toBe(true);
    expect(prop.failure).toBe(undefined);
    expect(prop.value).not.toBe(undefined);

    expect(prop).toBeInstanceOf(Value);
    expect(prop.value).toBe(10);
  });
});

describe('Property.encase', () => {
  it('should create Progress properly', () => {
    const prop = Property.encase<number>(() => undefined);

    expect(prop.isProgress).toBe(true);
    expect(prop.isFailure).toBe(false);
    expect(prop.isValue).toBe(false);
    expect(prop.failure).toBe(undefined);
    expect(prop.value).toBe(undefined);

    expect(prop).toBeInstanceOf(Progress);
  });

  it('should create Failure properly', () => {
    const prop = Property.encase<number>(() => {
      throw new Error('Test error');
    });

    expect(prop.isProgress).toBe(false);
    expect(prop.isFailure).toBe(true);
    expect(prop.isValue).toBe(false);
    expect(prop.failure).not.toBe(undefined);
    expect(prop.value).toBe(undefined);

    expect(prop).toBeInstanceOf(Failure);
    expect(prop.failure?.message).toBe('Test error');
  });
  it('should create Value properly', () => {
    const prop = Property.encase<number>(() => 10);

    expect(prop.isProgress).toBe(false);
    expect(prop.isFailure).toBe(false);
    expect(prop.isValue).toBe(true);
    expect(prop.failure).toBe(undefined);
    expect(prop.value).not.toBe(undefined);

    expect(prop).toBeInstanceOf(Value);
    expect(prop.value).toBe(10);
  });
});

describe('Property.isProperty', () => {
  it('should return true in any property case', () => {
    const prop = Property.of<number>();

    const prop2 = Property.of<number>(new Error('Test error'));

    const prop3 = Property.of<number>(10);

    const obj = {};

    expect(Property.isProperty(prop)).toBe(true);
    expect(Property.isProperty(prop2)).toBe(true);
    expect(Property.isProperty(prop3)).toBe(true);
    expect(Property.isProperty(obj)).toBe(false);
  });
});

describe('Property.toJson', () => {
  it('should return only fields', () => {
    const prop = Property.of<number>();

    const prop2 = Property.of<number>(new Error('Test error'));

    const prop3 = Property.of<number>(10);

    expect(prop.toObject()).toStrictEqual({
      __type: 'INPROGRESS',
      isProgress: true,
      isFailure: false,
      isValue: false,
      failure: undefined,
      value: undefined,
    });

    expect(prop2.toObject()).toStrictEqual({
      __type: 'FAILURE',
      isProgress: false,
      isFailure: true,
      isValue: false,
      failure: new Error('Test error'),
      value: undefined,
    });

    expect(prop3.toObject()).toStrictEqual({
      __type: 'VALUE',
      isProgress: false,
      isFailure: false,
      isValue: true,
      failure: undefined,
      value: 10,
    });
  });
});

describe('Property', () => {
  it('map should work', () => {
    const fn = (input: number) => {
      return input * 10;
    };

    const prop = Property.of<number>().map(fn);

    const prop2 = Property.of<number>(new Error('Test error')).map(fn);

    const prop3 = Property.of<number>(10).map(fn);

    expect(prop).toBeInstanceOf(Progress);

    expect(prop2).toBeInstanceOf(Failure);
    expect((prop2 as Failure<number>).failure.message).toBe('Test error');

    expect(prop3).toBeInstanceOf(Value);
    expect((prop3 as Value<number>).value).toBe(100);
  });

  it('chain should work', () => {
    const fn = (input: number) => {
      return Property.of([20, input]);
    };

    const prop = Property.of<number>().chain(fn);

    const prop2 = Property.of<number>(new Error('Test error')).chain(fn);

    const prop3 = Property.of<number>(10).chain(fn);

    expect(prop).toBeInstanceOf(Progress);

    expect(prop2).toBeInstanceOf(Failure);
    expect(prop2.failure?.message).toBe('Test error');

    expect(prop3).toBeInstanceOf(Value);
    expect(prop3.value).toStrictEqual([20, 10]);
  });
});
