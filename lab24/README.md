# Лабораторная работа 24

Парфёнок Иван Николаевич, группа 477. Node.js 22, MongoDB 7+.

`npm ci`, скопировать .env.example в .env, указать MongoDB URI и два случайных JWT-секрета длиной не менее 32 символов. `npm run seed` добавляет 100 студентов и администратора с паролем ADMIN_PASSWORD. `npm run migrate` создаёт индексы и записывает миграцию. `npm run task1` … `npm run task5` запускают последовательные версии API на порту 3000. Код каждого этапа доступен через отдельную точку входа; общие слои находятся в src/.

1. CRUD, заголовок X-Group: 477, ошибки 400/404/409.
2. Модель User, сервис, контроллеры, Joi и middleware; пароли bcrypt (10 раундов), email-уведомления имитируются через nodemailer и сохраняются в outbox/ без внешней отправки.
3. Пагинация page/limit, фильтры, сортировка, текстовый поиск, статистика и CSV/JSON экспорт (до 10000 пользователей).
4. JWT access 15 минут, refresh 7 дней, атомарная ротация refresh, отзыв сессии при logout. Роли user/admin/moderator. DELETE и PUT доступны владельцу или администратору. Роль нельзя передать через публичный API; администратора создаёт seed. Пароль и его хэш не возвращаются в API. Лимит 100 запросов в минуту/IP, CORS whitelist, Helmet.
5. /api-docs, /openapi.json, /health, /ready, /metrics, JSON-логи Pino, WebSocket /ws?token=ACCESS_TOKEN, аватары PNG/JPEG до 1 MiB, импорт JSON/CSV администратором, мягкое удаление. Импорт сначала валидирует все строки, затем возвращает результат каждой вставки; дубликаты отмечаются отдельно. Удалённый email остаётся зарезервирован.

Документация генерируется swagger-jsdoc из зарегистрированных маршрутов и схем без JSDoc-комментариев — соблюдено требование не добавлять комментарии в код. swagger-ui-express формирует HTML, который отдаёт Koa.

Проверки: `npm run lint`, `npm test`, `npm run test:coverage`. Jest, Supertest и настоящий mongod через mongodb-memory-server; первый запуск скачивает MongoDB. Порог покрытия всех файлов src/ — 81% для строк, инструкций, функций и ветвей.

Docker: заполнить JWT_SECRET, JWT_REFRESH_SECRET, DB_PASSWORD, MONGO_ROOT_PASSWORD в .env; `docker compose up --build -d --wait`. MongoDB не публикует порт наружу, приложение использует пользователя student с readWrite только на lab24. Многоэтапный образ node:22-alpine, процесс работает от пользователя node. Для HTTPS с собственным доменом: задать DOMAIN и добавить `-f docker-compose.yml -f docker-compose.production.yml`; Caddy завершает TLS.

Workflow хранится внутри lab24/.github/workflows/ci.yml. Чтобы не менять корень общего репозитория, его рабочая копия размещается в отдельном [репозитории CI](https://github.com/FreMinEr/nodejs-labs-477-ci/actions). Он проверяет feature/lab-24, собирает Docker, запускает временный staging на GitHub runner, выполняет HTTP-проверки, публикует образ GHCR и сохраняет отчёты. Временный staging выключается после проверки; постоянный внешний сервер и домен не предоставлялись.

## Скриншоты для отчёта

[Открыть все скриншоты (39 PNG)](screenshots/README.md)
