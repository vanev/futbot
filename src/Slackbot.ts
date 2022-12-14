import { WebClient } from "@slack/web-api";
import { pipe } from "fp-ts/lib/function";
import { Do, map, apS } from "fp-ts/lib/TaskEither";
import * as Database from "./Database";
import { tap } from "./Function";
import { Observer } from "./Observable";
import * as Slack from "./Slack";

const flags: Record<string, string> = {
  ARG: "đŚđˇ",
  AUS: "đŚđş",
  BEL: "đ§đŞ",
  BRA: "đ§đˇ",
  CMR: "đ¨đ˛",
  CAN: "đ¨đŚ",
  CRC: "đ¨đˇ",
  CRO: "đ­đˇ",
  DEN: "đŠđ°",
  ECU: "đŞđ¨",
  ENG: "đ´ó §ó ˘ó Ľó Žó §ó ż",
  FRA: "đŤđˇ",
  GER: "đŠđŞ",
  GHA: "đŹđ­",
  IRN: "đŽđˇ",
  JPN: "đŻđľ",
  MEX: "đ˛đ˝",
  MAR: "đ˛đŚ",
  NED: "đłđą",
  POL: "đľđą",
  POR: "đľđš",
  QAT: "đśđŚ",
  KSA: "đ¸đŚ",
  SEN: "đ¸đł",
  SRB: "đˇđ¸",
  KOR: "đ°đˇ",
  ESP: "đŞđ¸",
  SUI: "đ¨đ­",
  TUN: "đšđł",
  USA: "đşđ¸",
  URU: "đşđž",
  WAL: "đ´ó §ó ˘ó ˇó Źó łó ż",
};

const icons: Record<string, string> = {
  Kickoff: "âąď¸",
  "Yellow Card": "đ¨",
  "Red Card": "đĽ",
  Goal: "âĄď¸",
  Halftime: "âąď¸",
  Substitution: "đ",
  "Start 2nd Half": "âąď¸",
  "Penalty - Scored": "âĄď¸",
  "End Regular Time": "âąď¸",
  "Goal - Volley": "âĄď¸",
  "Penalty - Saved": "â",
};

const eventsObserver = (
  slackClient: WebClient,
  db: Database.Database,
): Observer<unknown, [string, string]> => ({
  next: ([message, channel]) => {
    const event = JSON.parse(message);

    console.log(`đŹ New Event [${event.id}]`);

    Slack.joinedChannels(slackClient).then((channels) => {
      channels.forEach((channel) => {
        console.log(
          `đŹ Posting Event Thread in #${channel.name} [${event.id}]`,
        );

        const { competitors } = event.competitions[0];
        const away = competitors.find((c: any) => c.homeAway === "away");
        const home = competitors.find((c: any) => c.homeAway === "home");

        const header = {
          type: "header",
          text: {
            type: "plain_text",
            text: `${away.team.displayName} ${
              flags[away.team.abbreviation]
            } v ${flags[home.team.abbreviation]} ${home.team.displayName}`,
            emoji: true,
          },
        };

        slackClient.chat
          .postMessage({
            channel: channel.id || "",
            text: event.name,
            blocks: [header],
          })
          .then((res) => {
            if (!res.ts) return;

            console.log(
              `đŹ Event Thread Posted in #${channel.name} [${event.id}]`,
            );

            db.set(`events.${event.id}.channels.${channel.id}.ts`, res.ts);
          });
      });
    });
  },
});

const keyEventsObserver = (
  slackClient: WebClient,
  db: Database.Database,
): Observer<unknown, [string, string]> => ({
  next: ([message, channel]) => {
    const [_, eventId, __] = channel.split(".");

    console.log(`đŹ New Key Moment [${eventId}]`);

    Slack.joinedChannels(slackClient).then((channels) => {
      channels.forEach((channel) => {
        db.get(`events.${eventId}.channels.${channel.id}.ts`).then((ts) => {
          if (!ts) return;

          console.log(
            `đŹ Posting Key Moment Reply in #${channel.name} [${eventId}]`,
          );

          const keyEvent = JSON.parse(message);

          slackClient.chat
            .postMessage({
              channel: channel.id || "",
              text: `${icons[keyEvent.type.text]} ${
                keyEvent.text || keyEvent.type.text
              }`,
              thread_ts: ts,
            })
            .then((res) => {
              if (!res.ts) return;

              console.log(`đŹ Key Moment Reply Posted [${eventId}]`);

              db.set(
                `events.${eventId}.channels.${channel.id}.keyEvents.${keyEvent.id}.ts`,
                res.ts,
              );
            });
        });
      });
    });
  },
});

const alwaysLog = (message: string) => () => {
  console.log(message);
};

const initializeSlack = pipe(
  Slack.start,
  map(tap(alwaysLog("â˝ď¸ FĂştbot is on the pitch!"))),
);

const initializeDB = pipe(
  Database.create(),
  map(tap(alwaysLog("đŹ Connected to Redis"))),
);

export const initialize = pipe(
  Do,
  apS("slack", initializeSlack),
  apS("db", initializeDB),
  map(({ slack, db }) => {
    Database.observe("events")(db)(eventsObserver(slack.client, db));

    Database.observe("events.*.keyEvents")(db)(
      keyEventsObserver(slack.client, db),
    );
  }),
);
