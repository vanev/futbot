import { App } from "@slack/bolt";
import axios from "axios";
import { startOfToday } from "date-fns";
import { format } from "date-fns/fp";
import dotenv from "dotenv";
import cron from "node-cron";
import { createClient } from "redis";

dotenv.config();

const slack = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const redis = createClient({ url: process.env.REDIS_URL });

redis.connect().then(() => {
  redis.ping().then((res) => {
    console.log(res);
  });
});

slack.start(process.env.PORT || 3000).then(() => {
  console.log("⚽️ Fútbot is on the pitch!");
});

const espnWorldCupInstance = axios.create({
  baseURL: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world",
});

const today = startOfToday();

type ESPNScoreboardEvent = {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: unknown;
  competitions: Array<unknown>;
  status: unknown;
  links: Array<unknown>;
};

type ESPNEventSummaryKeyEvent = {
  id: string;
  type: { id: string; text: string };
  text?: string;
  period: { number: number };
  clock: { value: number; displayValue: string };
  scoringPlay: boolean;
  source: { id: string; description: string };
  shootout: boolean;
};

type ESPNEventSummary = {
  boxscore: unknown;
  format: unknown;
  gameInfo: unknown;
  headToHeadGames: Array<unknown>;
  broadcasts: Array<unknown>;
  odds: Array<unknown>;
  hasOdds: boolean;
  rosters: Array<unknown>;
  news: unknown;
  article: unknown;
  videos: Array<unknown>;
  header: unknown;
  keyEvents?: Array<ESPNEventSummaryKeyEvent>;
  commentary: Array<unknown>;
  standings: unknown;
};

const refreshGames = () =>
  espnWorldCupInstance
    .get(`/scoreboard?dates=${format("yyyyMMdd")(today)}`)
    .then((res) => res.data.events || [])
    .then((events) => {
      events.forEach((event: ESPNScoreboardEvent) => {
        redis.sIsMember("events", event.id).then((isMember) => {
          if (isMember) return;

          redis.publish("events", JSON.stringify(event));
          redis.sAdd("events", event.id);
        });

        espnWorldCupInstance
          .get(`/summary?event=${event.id}`)
          .then((res) => res.data)
          .then((summary: ESPNEventSummary) => summary.keyEvents || [])
          .then((keyEvents) => {
            keyEvents.forEach((keyEvent) => {
              redis
                .sIsMember(`events.${event.id}.keyEvents`, keyEvent.id)
                .then((isMember) => {
                  if (isMember) return;

                  redis.publish(
                    `events.${event.id}.keyEvents`,
                    JSON.stringify(keyEvent),
                  );
                  redis.sAdd(`events.${event.id}.keyEvents`, keyEvent.id);
                });
            });
          });
      });
    })
    .catch((reason) => {
      console.error(reason);
    });

cron.schedule("*/1 * * * *", refreshGames);

const observable = redis.duplicate();

observable.connect().then(() => {
  observable.subscribe("events", (message) => {
    const event = JSON.parse(message);

    slack.client.conversations
      .list()
      .then((res) => res.channels || [])
      .then((channels) => channels.filter((channel) => channel.is_member))
      .then((channels) => {
        channels.forEach((channel) => {
          return slack.client.chat
            .postMessage({
              channel: channel.id || "",
              text: `${event.name}`,
            })
            .then((res) => {
              if (!res.ts) return;

              redis.set(`events.${event.id}.ts`, res.ts);
            });
        });
      });
  });

  observable.pSubscribe("events.*.keyEvents", (message, channel) => {
    const [_, eventId, __] = channel.split(".");

    redis.get(`events.${eventId}.ts`).then((ts) => {
      if (!ts) return;

      const keyEvent = JSON.parse(message);

      slack.client.conversations
        .list()
        .then((res) => res.channels || [])
        .then((channels) => channels.filter((channel) => channel.is_member))
        .then((channels) => {
          channels.forEach((channel) => {
            slack.client.chat
              .postMessage({
                channel: channel.id || "",
                text: `${keyEvent.text}`,
                thread_ts: ts,
              })
              .then((res) => {
                if (!res.ts) return;

                redis.set(
                  `events.${eventId}.keyEvents.${keyEvent.id}.ts`,
                  res.ts,
                );
              });
          });
        });
    });
  });
});
