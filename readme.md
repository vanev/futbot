# ⚽️ Fútbot

This is a Slack bot that posts updates about World Cup games based on [ESPN's hidden API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b).

## Contributing

### Setup

You'll need [Redis](https://redis.io/), [Node.js](https://nodejs.org/en/), and [Yarn](https://yarnpkg.com/).

```
brew install redis
brew services start redis

brew install nvm
nvm use

brew install yarn
yarn install
```

Also, put together a `.env` file with a `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and `REDIS_URL`.

You get the Slack environment variables by creating [a Slack App](https://api.slack.com/apps) and giving it the `chat:write` and `channel:read` permissions.

I've deployed this project to [Railway.app](https://railway.app/) with a Node.js application and a Redis application.
