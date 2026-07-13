# BotHost database schema fix

The startup script forcibly appends `schema=channel_os_dev_agent` to the
`DATABASE_URL` received from BotHost before Prisma or the bot starts.

BotHost startup file: `start.js`

The database URL in BotHost may be the normal PostgreSQL connection string;
the startup script will isolate this agent in the `channel_os_dev_agent` schema.
