export type Observer<E, T> = {
  next: (value: T) => void;
  error?: (error: E) => void;
  complete?: () => void;
};

export type Unsubscribe = () => void;

export type Observable<E, T> = (observer: Observer<E, T>) => Unsubscribe;
