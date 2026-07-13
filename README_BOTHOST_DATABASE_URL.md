# BotHost DATABASE_URL

In BotHost, create an environment variable named `DATABASE_URL`.

Paste only the URL as its value:

`postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

Do not paste `DATABASE_URL=` into the value field and do not wrap the value in quotes.

The startup script automatically adds the isolated schema `channel_os_dev_agent`.
