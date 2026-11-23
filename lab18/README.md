# Laboratornaya rabota 18

Parfenok Ivan Nikolaevich, gruppa 477, variant 17. Node.js 22+. Zavisimosti ne trebuyutsya.

V metodichke tolko 4 zadaniya. `npm run task1` — platforma i arhitektura; `npm run task2` — CPU, pamyat, loadavg; `npm run task3` — set, maskirovannye MAC i polzovatel; `npm run task4` — monitoring kazhdye 2 sekundy. Ostanovka Ctrl+C. Vse dannye poluchayutsya iz node:os.

`node task4.js --samples 3` ogranichivaet chislo zamerov. `node task2.js --demo-low-memory` proveryaet preduprezhdenie na yavnom testovom znachenii 15%; ne zanimaet pamyat mashiny. `node task4.js --samples 2 --demo-alerts` pokazyvaet realnye zamery i otdelno testiruet porogi CPU/RAM; testovye zapisi v monitor.log pomecheny TEST. Bez etih flagov dannye tolko realnye. Na Windows os.loadavg nedostupen, UNIX root/UID/GID ne primenyayutsya.

`npm test` proveryaet formulu CPU, porogi i maskirovanie MAC. monitor.log ne dobavlyaetsya v Git. Setevye i polzovatelskie dannye sohranyayutsya tolko v lokalnyh snimkah dlya otcheta.

## Скриншоты для отчёта

[Открыть все скриншоты (16 PNG)](screenshots/README.md)
