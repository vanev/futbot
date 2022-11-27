import { pipe } from "fp-ts/lib/function";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import {
  createClient,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { getRequired } from "./Env";
import { fromTaskEither, Observable, chain } from "./Observable";

export type Database = RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

export const connect = (db: Database): TaskEither<Error, Database> =>
  tryCatch(
    () => db.connect().then(() => db),
    (reason) =>
      reason instanceof Error ? reason : new Error(`RedisError: ${reason}`),
  );

export const create = (): TaskEither<Error, Database> => {
  const db = createClient({ url: getRequired("REDIS_URL") });
  return connect(db);
};

export const duplicate = (db: Database): TaskEither<Error, Database> => {
  const dup = db.duplicate();
  return connect(dup);
};

const pSubscribe =
  (channel: string) =>
  (db: Database): Observable<Error, [string, string]> =>
  ({ next }) => {
    db.pSubscribe(channel, (message, channel) => next([message, channel]));
    return () => db.pUnsubscribe(channel);
  };

export const observe =
  (channel: string) =>
  (db: Database): Observable<Error, [string, string]> =>
    pipe(db, duplicate, fromTaskEither, chain(pSubscribe(channel)));
