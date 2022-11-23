import { WebClient } from "@slack/web-api";

export const joinedChannels = (client: WebClient) =>
  client.conversations
    .list({ limit: 1000, exclude_archived: true })
    .then((res) => res.channels || [])
    .then((channels) => channels.filter((channel) => channel.is_member));
