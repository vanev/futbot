export const tap =
  <A>(fn: (value: A) => void) =>
  (value: A): A => {
    fn(value);
    return value;
  };
