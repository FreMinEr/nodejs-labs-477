# Laboratornaya rabota 16

Parfenok Ivan Nikolaevich, gruppa 477, variant 17. Node.js 22+.

Iz papki lab16: `npm ci`, zatem odna komanda `npm run task1` ... `npm run task5`. Port po umolchaniyu 3000, ostanovka Ctrl+C. Skripty nezavisimy i zapuskayutsya po ocheredi.

1. `/`, `/about`, `/contacts`: HTML, gruppa, data, avtor i marshruty.
2. CRUD `/api/books`, `/api/books/:id`, poisk `/api/books/search?author=Tolstoi`, validaciya.
3. Logger, gzip/deflate, 100 zaprosov v minutu na IP, JSON oshibki, `/error`, `/async-error`.
4. Filtry author/year/yearFrom/yearTo, page/limit, sort=title/-year, search, `/api/books/stats`. Proverka dublikatov, zhurnal `operations.log`.
5. 100 knig s unikalnymi ISBN-13; JWT, roli, otzyvy, CSV/JSON, Swagger i kesh na 5 minut s ochistkoi pri izmeneniyah.

Skopiruite `.env.example` v `.env`. Dlya administratora zadayte sobstvennyi `ADMIN_PASSWORD` (minimum 8 simvolov); email po umolchaniyu `admin@example.test`. Dlya postoyannogo klyucha JWT zadayte sluchainyi `JWT_SECRET`. Bez nego klyuch generiruetsya pri kazhdom zapuske, i starye tokeny perestayut deistvovat. Bez ADMIN_PASSWORD administrator ne sozdaetsya. Registraciya ne pozvolyaet naznachit sebe rol admin.

`POST /auth/register`: email, password, name. `POST /auth/login`: email, password. Dalnee peredavaite `Authorization: Bearer TOKEN`. Vse `/api/books` trebuyut JWT. Dobavlenie, udalenie i import knig trebuyut admin. `PUT` dostupen avtorizovannym chitatelyam po usloviyu raboty.

Kniga: title, author, year, genre, isbn, available. Zhanry: roman, fantastika, detektiv, poeziya, nauka. Otzyv: `POST /api/books/:id/reviews` s rating (1-5), text. Eksport: `GET /api/books/export?format=csv` ili `format=json`. Import: `POST /api/books/import`, multipart pole `file`, zagolovki CSV: title,author,year,genre,isbn,available. Import atomarnyi: oshibka v lyuboi stroke otmenyaet ves paket.

`/api/books/recommendations?genre=roman`, `/api/books/available`, `/api/admin`. Dokumentaciya `/api-docs/`, OpenAPI `/openapi.json` generiruetsya iz zaregistrirovannyh marshrutov. In-memory dannye i kesh sbrasyvayutsya pri perezapuske; paroli hranyatsya v pamyati kak scrypt-heshi s individualnoi solyu.

Proverka: `npm test`. Testy zapuskayut vse 5 zadanii cherez Node.js, proveryayut CRUD, HTTP oshibki, szhatie, limit, JWT/roli, ISBN, CSV import/eksport, Swagger, kesh i ego ochistku. Vremennye paroli generiruyutsya testom i ne popadayut v logi.

## Скриншоты для отчёта

[Открыть все скриншоты (21 PNG)](screenshots/README.md)
