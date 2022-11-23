import { App } from "@slack/bolt";
import { get, getRequired } from "./Env";
import * as Database from "./Database";
import * as Slack from "./Slack";
import { Observer } from "./Observable";
import { WebClient } from "@slack/web-api";

const flags: Record<string, string> = {
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  BEL: "🇧🇪",
  BRA: "🇧🇷",
  CMR: "🇨🇲",
  CAN: "🇨🇦",
  CRC: "🇨🇷",
  CRO: "🇭🇷",
  DEN: "🇩🇰",
  ECU: "🇪🇨",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  GHA: "🇬🇭",
  IRN: "🇮🇷",
  JPN: "🇯🇵",
  MEX: "🇲🇽",
  MAR: "🇲🇦",
  NED: "🇳🇱",
  POL: "🇵🇱",
  POR: "🇵🇹",
  QAT: "🇶🇦",
  KSA: "🇸🇦",
  SEN: "🇸🇳",
  SRB: "🇷🇸",
  KOR: "🇰🇷",
  ESP: "🇪🇸",
  SUI: "🇨🇭",
  TUN: "🇹🇳",
  USA: "🇺🇸",
  URU: "🇺🇾",
  WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

const eventsObserver = (
  slackClient: WebClient,
  db: Database.Database,
): Observer<unknown, [string, string]> => ({
  next: ([message, channel]) => {
    const event = JSON.parse(message);

    console.log(`💬 New Event [${event.id}]`);

    Slack.joinedChannels(slackClient).then((channels) => {
      channels.forEach((channel) => {
        console.log(
          `💬 Posting Event Thread in #${channel.name} [${event.id}]`,
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
              `💬 Event Thread Posted in #${channel.name} [${event.id}]`,
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

    console.log(`💬 New Key Moment [${eventId}]`);

    Slack.joinedChannels(slackClient).then((channels) => {
      channels.forEach((channel) => {
        db.get(`events.${eventId}.channels.${channel.id}.ts`).then((ts) => {
          if (!ts) return;

          console.log(
            `💬 Posting Key Moment Reply in #${channel.name} [${eventId}]`,
          );

          const keyEvent = JSON.parse(message);

          slackClient.chat
            .postMessage({
              channel: channel.id || "",
              text: keyEvent.text || keyEvent.type.text,
              thread_ts: ts,
            })
            .then((res) => {
              if (!res.ts) return;

              console.log(`💬 Key Moment Reply Posted [${eventId}]`);

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

export const initialize = () => {
  const slack = new App({
    token: getRequired("SLACK_BOT_TOKEN"),
    signingSecret: getRequired("SLACK_SIGNING_SECRET"),
  });

  slack.start(get("PORT") || 3000).then(() => {
    console.log("⚽️ Fútbot is on the pitch!");
  });

  Database.connect().then((db) => {
    console.log("💬 Connected to Redis");

    Database.observe("events")(db)(eventsObserver(slack.client, db));

    Database.observe("events.*.keyEvents")(db)(
      keyEventsObserver(slack.client, db),
    );
  });
};
