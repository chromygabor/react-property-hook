/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useProperty } from '../useProperty';

describe('useProperty', () => {
  it('should create property properly', () => {
    const { result } = renderHook(() => {
      const counter = useRef(0);
      counter.current = counter.current + 1;

      const state1 = useProperty();
      const state2 = useProperty(new Error('test'));
      const state3 = useProperty(5);

      return {
        state1,
        state2,
        state3,
        counter: counter.current,
      };
    });

    expect(result.current.state1.isProgress).toBe(true);
    expect(result.current.state2.isFailure).toBe(true);
    expect(result.current.state3.isValue).toBe(true);

    expect(result.current.counter).toBe(1);
  });
  it('asMutable() should set property value', () => {
    const { result } = renderHook(() => {
      const counter = useRef(0);
      counter.current = counter.current + 1;

      const [state1, state1Fn] = useProperty(5).asMutable();

      return {
        state1,
        state1Fn,
        counter: counter.current,
      };
    });

    expect(result.current.state1.value).toBe(5);
    expect(result.current.counter).toBe(1);

    act(() => {
      result.current.state1Fn.setLoading();
    });

    expect(result.current.state1.isProgress).toBe(true);
    expect(result.current.counter).toBe(2);

    act(() => {
      result.current.state1Fn.setValue(20);
    });

    expect(result.current.state1.value).toBe(20);
    expect(result.current.counter).toBe(3);

    act(() => {
      result.current.state1Fn.setFailure(new Error('test'));
    });

    expect(result.current.state1.failure).toBeInstanceOf(Error);
    expect(result.current.state1.failure?.message).toBe('test');
    expect(result.current.counter).toBe(4);
  });

  describe('should update its value by the declaration', () => {
    it('by .map()', () => {
      const { result } = renderHook(() => {
        const counter = useRef(0);
        counter.current = counter.current + 1;

        const [state1, state1Fn] = useProperty(5).asMutable();

        const state2 = useProperty(state1.map((input) => input * 10));

        return {
          state1,
          state1Fn,
          state2,
          counter: counter.current,
        };
      });

      expect(result.current.state1.value).toBe(5);
      expect(result.current.state2.value).toBe(50);
      expect(result.current.counter).toBe(1);

      act(() => {
        result.current.state1Fn.setLoading();
      });

      expect(result.current.state1.isProgress).toBe(true);
      expect(result.current.state2.isProgress).toBe(true);
      expect(result.current.counter).toBe(2);

      act(() => {
        result.current.state1Fn.setValue(20);
      });

      expect(result.current.state1.value).toBe(20);
      expect(result.current.state2.value).toBe(200);
      expect(result.current.counter).toBe(3);

      act(() => {
        result.current.state1Fn.setFailure(new Error('test'));
      });

      expect(result.current.state1.failure).toBeInstanceOf(Error);
      expect(result.current.state1.failure?.message).toBe('test');
      expect(result.current.state2.failure).toBeInstanceOf(Error);
      expect(result.current.state2.failure?.message).toBe('test');
      expect(result.current.counter).toBe(4);
    });
    // it('by .chain()', () => {
    //   const { result } = renderHook(() => {
    //     const counter = useRef(0)
    //     counter.current = counter.current + 1

    //     const [state1, state1Fn] = useProperty(5).asMutable()
    //     const [state2, state2Fn] = useProperty([state1, 10]).asMutable()

    //     return {
    //       state1,
    //       state1Fn,
    //       state2,
    //       counter: counter.current,
    //     }
    //   })

    //   expect(result.current.state1.value).toBe(5)
    //   expect(result.current.state2.value).toBe(50)
    //   expect(result.current.counter).toBe(1)

    //   act(() => {
    //     result.current.state1Fn.setLoading()
    //   })

    //   expect(result.current.state1.isProgress).toBe(true)
    //   expect(result.current.state2.isProgress).toBe(true)
    //   expect(result.current.counter).toBe(2)

    //   act(() => {
    //     result.current.state1Fn.setValue(20)
    //   })

    //   expect(result.current.state1.value).toBe(20)
    //   expect(result.current.state2.value).toBe(200)
    //   expect(result.current.counter).toBe(3)

    //   act(() => {
    //     result.current.state1Fn.setFailure(new Error('test'))
    //   })

    //   expect(result.current.state1.failure).toBeInstanceOf(Error)
    //   expect(result.current.state1.failure.message).toBe('test')
    //   expect(result.current.state2.failure).toBeInstanceOf(Error)
    //   expect(result.current.state2.failure.message).toBe('test')
    //   expect(result.current.counter).toBe(4)
    // })
  });
  it('should be able to mutate the mapped property without effecting the upstream property', () => {
    const { result } = renderHook(() => {
      const counter = useRef(0);
      counter.current = counter.current + 1;

      const [state1, state1Fn] = useProperty(5).asMutable();

      const [state2, state2Fn] = useProperty(state1.map((input) => input * 10)).asMutable();

      return {
        state1,
        state1Fn,
        state2,
        state2Fn,
        counter: counter.current,
      };
    });

    expect(result.current.state1.value).toBe(5);
    expect(result.current.state2.value).toBe(50);
    expect(result.current.counter).toBe(1);

    act(() => {
      result.current.state2Fn.setLoading();
    });

    expect(result.current.state1.isProgress).toBe(false);
    expect(result.current.state2.isProgress).toBe(true);
    expect(result.current.counter).toBe(2);

    act(() => {
      result.current.state2Fn.setValue(20);
    });

    expect(result.current.state1.value).toBe(5);
    expect(result.current.state2.value).toBe(20);
    expect(result.current.counter).toBe(3);

    act(() => {
      result.current.state2Fn.setFailure(new Error('test'));
    });

    expect(result.current.state1.failure).toBe(undefined);

    expect(result.current.state2.failure).toBeInstanceOf(Error);
    expect(result.current.state2.failure?.message).toBe('test');
    expect(result.current.counter).toBe(4);

    act(() => {
      result.current.state1Fn.setValue(100);
    });

    expect(result.current.state1.value).toBe(100);
    expect(result.current.state2.value).toBe(1000);
    expect(result.current.counter).toBe(5);
  });
});
