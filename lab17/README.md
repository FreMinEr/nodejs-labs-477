# Laboratornaya rabota 17

Parfenok Ivan Nikolaevich, gruppa 477, variant 17. Node.js 22+.

`npm ci`, zatem `npm run task1 -- info`, `npm run task2 -- --help`, `npm run task3 -- init`, `npm run task4 -- process --files a.txt`, `npm run task5 -- --help`.

1. Pozicionnye argumenty greet/info, spravka, kody 0/1.
2. Commander: generate (html/pdf/json/csv), convert (JSON massiv v CSV), --force, --dry-run, --verbose, --help, --version. PDF sozdaetsya cherez PDFKit.
3. Inquirer: input/list/checkbox/confirm/password. Token vvoditsya so zvezdochkami i ne sohranyaetsya. `--no-interactive` i peredacha imeni cherez stdin. Opcii TypeScript/ESLint/Prettier/Jest sohranyayutsya v konfiguracii sozdavaemogo proekta; ustanovka etih instrumentov ne vypolnyaetsya.
4. Chalk, ora, cli-progress: cveta i progress tolko v TTY. JSON rezultaty v stdout, oshibki v stderr. `--quiet` pri uspehe ne vyvodit nichego. Pri perenapravlenii stdout net ANSI-kodov.
5. `bin/`, `commands/`, `services/`, `utils/`. `init --name demo-app --type cli --git`, `build --config demo-app/config.json`, `test --config demo-app/config.json`, `deploy --config demo-app/config.json --env production --force`.

Deploy vypolnyaet realnoe lokalnoe razvertyvanie: kopiruet sborku v `deployed/<env>/`. Vneshnii hosting ne trebuetsya. Bez --force v TTY est podtverzhdenie, v avtomatizacii komanda otklonyaetsya. `NODE_ENV=development` pokazyvaet stek; production vyvodit kratkuyu oshibku. Obrabotchiki uncaughtException/unhandledRejection ustanovleny v bin.

`npm test`: 17 testov Mocha dlya validacii, spravki, kodov vozvrata, init/build/test/deploy, dry-run i obrabotki oshibok. `npm link` sozdaet komandu `my-cli`. `npm run package` sobiraet `dist/my-cli.exe` cherez podderzhivaemyi fork pkg (`@yao-pkg/pkg`). Provereny --version i init pri PATH tolko s Windows System32, bez dostupa k node.exe. Komanda test sozdavaemogo proekta trebuet Node.js; init/build/deploy i spravka samogo binarnika rabotayut avtonomno.

Faily demo i dist ne vhodyat v Git. Snimki: `../screenshots_lab17/` otnositelno kornya repozitoriya. Interaktivnye snimki polucheny iz realnogo ConPTY s sohraneniem cvetov i sostoyaniya terminala.
