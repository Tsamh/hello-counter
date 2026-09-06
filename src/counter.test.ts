import { decrement, increment, reset } from './counter';

describe('counter', () => {
  it('increment ajoute 1 a la valeur', () => {
    expect(increment(0)).toBe(1);
    expect(increment(41)).toBe(42);
  });

  it('decrement retire 1 a la valeur', () => {
    expect(decrement(5)).toBe(4);
  });

  it('decrement autorise les valeurs negatives', () => {
    expect(decrement(0)).toBe(-1);
    expect(decrement(-4)).toBe(-5);
  });

  it('reset renvoie toujours 0', () => {
    expect(reset()).toBe(0);
  });
});
