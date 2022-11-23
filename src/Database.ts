import {
  createClient,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { getRequired } from "./Env";
import { Observable } from "./Observable";

export type Database = RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

export const connect = (): Promise<Database> => {
  const client = createClient({ url: getRequired("REDIS_URL") });
  return client.connect().then(() => client);
};

export const observe =
  (channel: string) =>
  (db: Database): Observable<Error, [string, string]> => {
    const subscribable = db.duplicate();

    return (observer) => {
      subscribable.connect().then(() => {
        subscribable.pSubscribe(channel, (message, channel) => {
          observer.next([message, channel]);
        });
      });

      return () => {
        subscribable.pUnsubscribe(channel);
      };
    };
  };
