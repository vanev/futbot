import { flow } from "fp-ts/lib/function";
import { TaskEither } from "fp-ts/lib/TaskEither";

export type Observer<E, T> = {
  next: (value: T) => void;
  error?: (error: E) => void;
  complete?: () => void;
};

export type Unsubscribe = () => void;

export type Observable<E, T> = (observer: Observer<E, T>) => Unsubscribe;

export const fromTaskEither =
  <E, T>(task: TaskEither<E, T>): Observable<E, T> =>
  ({ next, error }) => {
    task().then((value) => {
      switch (value._tag) {
        case "Left":
          if (error) error(value.left);
          break;

        case "Right":
          next(value.right);
          break;
      }
    });

    return () => {};
  };

export const map =
  <A, B>(fn: (a: A) => B) =>
  <E>(observable: Observable<E, A>): Observable<E, B> =>
  ({ next, error, complete }) =>
    observable({
      next: flow(fn, next),
      error: error,
      complete: complete,
    });

export const mapLeft =
  <E, F>(fn: (e: E) => F) =>
  <A>(observable: Observable<E, A>): Observable<F, A> =>
  ({ next, error, complete }) =>
    observable({
      next,
      error: error ? flow(fn, error) : undefined,
      complete,
    });

export const bimap = <E, F, A, B>(f: (a: A) => B, g: (e: E) => F) =>
  flow(map(f)<E>, mapLeft(g));

export const flatten =
  <E, A>(observable: Observable<E, Observable<E, A>>): Observable<E, A> =>
  (observer) =>
    observable({
      next: (value) => value(observer),
      error: observer.error,
      complete: observer.complete,
    });

export const chain = <E, A, B>(fn: (a: A) => Observable<E, B>) =>
  flow(map(fn)<E>, flatten);
