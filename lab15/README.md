# Laboratornaya rabota 15

Parfenok Ivan Nikolaevich, gruppa 477, variant 17.

Node.js 22+. Ustanovka: `npm ci`. Zapusk iz papki lab15: `npm run task1` ... `npm run task5`. Kazhdoe zadanie zapuskaetsya otdelno na http://127.0.0.1:3000. Ostanovka: Ctrl+C. Port i gruppu mozhno nastroit v `.env` po `.env.example`.

1. HTML-stranica na `/` s gruppoi i tekushchim vremenem.
2. GET/POST `/api/users`, GET/PUT/DELETE `/api/users/:id`, validaciya i oshibki 400/404.
3. Logirovanie nachala, okonchaniya i dlitelnosti zaprosa. `/protected` trebuet nepustoi Authorization po usloviyu metodichki. Eto uchebnaya proverka nalichiya zagolovka, ne proverka podlinnosti tokena. `/error` vozvrashchaet JSON oshibki 500.
4. CRUD `/students`, filtr `?group=477`, chastichnoe obnovlenie, kurs 1-4.
5. 50 studentov na osnove gruppy 477; `limit`, `offset`, `sort=name`, `sort=-name`, `sort=course`, `search` bez ucheta registra. Otvet spiska: `{total, limit, offset, students}`. Dannye hranyatsya v pamyati i sbrasyvayutsya pri perezapuske.

Proverka: `npm test`. Testy zapuskayut vse pyat serverov cherez Node.js na svobodnyh portah, proveryayut CRUD, validaciyu, poisk, sortirovku, paginaciyu i obrabotku oshibok.

Snimki realnyh HTTP-otvetov i logov: `../screenshots_lab15/` otnositelno kornya repozitoriya. V metodichke 15 net otdelnogo spiska snimkov, poetomu sohraneny vse proverennye scenarii po zadaniyam.
