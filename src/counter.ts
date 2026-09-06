/**
 * Logique du compteur, volontairement pure et sans dependance a React.
 * C'est ce qui permet de la tester en quelques millisecondes dans la CI,
 * sans environnement de rendu.
 */

export function increment(value: number): number {
  return value + 2;
}

export function decrement(value: number): number {
  return value - 1;
}

export function reset(): number {
  return 0;
}
