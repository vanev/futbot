import { startOfToday } from "date-fns";
import { startOfDay } from "date-fns/fp";
import { pipe } from "fp-ts/lib/function";
import { map } from "fp-ts/lib/TaskEither";
import cron from "node-cron";
import { Database, create } from "./Database";
import { scoreboard, summary } from "./ESPN";
import { tap } from "./Function";

const refreshScoreboard = (db: Database) => (now: Date | "manual") => {
  const today = now === "manual" ? startOfToday() : startOfDay(now);

  console.log(`♻️ Refreshing Games for ${today}`);

  scoreboard(today)
    .then(({ events }) => {
      events.forEach((event) => {
        console.log(`♻️ Refreshing ${event.shortName} [${event.id}]`);

        db.sIsMember("events", event.id).then((isMember) => {
          if (isMember) return;

          console.log(`♻️ ${event.shortName} is new! [${event.id}]`);

          db.publish("events", JSON.stringify(event));
          db.sAdd("events", event.id);
        });

        summary(event.id).then(({ keyEvents = [] }) => {
          keyEvents.forEach((keyEvent) => {
            db.sIsMember(`events.${event.id}.keyEvents`, keyEvent.id).then(
              (isMember) => {
                if (isMember) return;

                console.log(`♻️ New Key Moment: ${keyEvent.id}! [${event.id}]`);

                db.publish(
                  `events.${event.id}.keyEvents`,
                  JSON.stringify(keyEvent),
                );
                db.sAdd(`events.${event.id}.keyEvents`, keyEvent.id);
              },
            );
          });
        });
      });
    })
    .catch((reason) => {
      console.error(reason);
    });
};

const alwaysLog = (message: string) => () => {
  console.log(message);
};

const initializeDB = pipe(
  create(),
  map(tap(alwaysLog("♻️ Connected to Redis"))),
);

export const initialize = pipe(
  initializeDB,
  map((db) => {
    cron.schedule("*/1 * * * *", refreshScoreboard(db));
  }),
);
