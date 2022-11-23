import { startOfToday } from "date-fns";
import cron from "node-cron";
import * as Database from "./Database";
import * as ESPN from "./ESPN";

export const initialize = () => {
  const refreshScoreboard = (db: Database.Database) => () => {
    const today = startOfToday();

    console.log(`♻️ Refreshing Games for ${today}`);

    ESPN.scoreboard(today)
      .then(({ events }) => {
        events.forEach((event) => {
          console.log(`♻️ Refreshing ${event.shortName} [${event.id}]`);

          db.sIsMember("events", event.id).then((isMember) => {
            if (isMember) return;

            console.log(`♻️ ${event.shortName} is new! [${event.id}]`);

            db.publish("events", JSON.stringify(event));
            db.sAdd("events", event.id);
          });

          ESPN.summary(event.id).then(({ keyEvents = [] }) => {
            keyEvents.forEach((keyEvent) => {
              db.sIsMember(`events.${event.id}.keyEvents`, keyEvent.id).then(
                (isMember) => {
                  if (isMember) return;

                  console.log(
                    `♻️ New Key Moment: ${keyEvent.id}! [${event.id}]`,
                  );

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

  Database.connect().then((db) => {
    console.log("♻️ Connected to Redis");

    cron.schedule("*/1 * * * *", refreshScoreboard(db));
  });
};
