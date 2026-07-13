# Channel OS Dev Agent v0.1

Отдельный AI-агент для подготовки и публикации контента в Telegram-канал Channel OS Dev.

## Уже работает

- генерация поста через Gemini;
- структурированный ответ: заголовок, текст, идея визуала;
- сохранение черновиков в PostgreSQL;
- предпросмотр в управляющем Telegram-боте;
- публикация после нажатия кнопки;
- перегенерация и отклонение черновика;
- доступ только для владельца по Telegram ID.

## Запуск локально

1. Создайте Telegram-бота через BotFather.
2. Добавьте его администратором в Channel OS Dev с правом публикации.
3. Получите Gemini API key в Google AI Studio.
4. Скопируйте `.env.example` в `.env` и заполните значения.
5. Запустите PostgreSQL.
6. Выполните:

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Запуск через Docker

В `.env` используйте:

```env
DATABASE_URL=postgresql://channelos:change_me@postgres:5432/channel_os_dev_agent?schema=public
```

Затем:

```bash
docker compose up --build -d
```

## Команды

- `/start` — открыть меню;
- `/post <тема>` — создать публикацию.

## Ограничение v0.1

Кнопка «Новости» пока не выполняет веб-поиск. Она создаёт безопасный шаблон без выдуманных фактов. Сбор, проверка и ранжирование свежих новостей добавляются в v0.2.

## Деплой на BotHost

BotHost устанавливает production-зависимости, поэтому `prisma` и `tsx` находятся в `dependencies`.
Команда запуска:

```bash
npm start
```

При старте агент автоматически выполняет `prisma db push`, затем запускает `src/index.ts` через `tsx`.
Файл `prisma/schema.prisma` должен находиться в корне репозитория в папке `prisma`.


## BotHost fix v0.1.3

`postinstall` удалён намеренно. Некоторые сборщики BotHost устанавливают npm-зависимости до копирования папки `prisma`, поэтому генерация Prisma во время `npm install` завершалась ошибкой. Теперь `prisma generate` и `prisma db push` выполняются в `npm start`, когда весь проект уже находится в контейнере.

## BotHost startup file
Set the startup file in BotHost to:

```text
start.js
```

Do not paste a shell command into the startup-file field. BotHost runs that field as `node <file>`.
