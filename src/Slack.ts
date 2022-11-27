import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { tryCatch } from "fp-ts/lib/TaskEither";
import { getRequired, get } from "./Env";

export const start = tryCatch(
  () => {
    const app = new App({
      token: getRequired("SLACK_BOT_TOKEN"),
      signingSecret: getRequired("SLACK_SIGNING_SECRET"),
    });
    return app.start(get("PORT") || 3000).then(() => app);
  },
  (reason) =>
    reason instanceof Error ? reason : new Error(`SlackError: ${reason}`),
);

export const joinedChannels = (client: WebClient) =>
  client.conversations
    .list({ limit: 1000, exclude_archived: true })
    .then((res) => res.channels || [])
    .then((channels) => channels.filter((channel) => channel.is_member));
