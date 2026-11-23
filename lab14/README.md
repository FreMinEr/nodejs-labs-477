# Laboratornaya rabota 14

Student: Parfenok Ivan Nikolaevich. Gruppa: 477. Variant: 17.

Trebuetsya Node.js 22 ili novee. Vse komandy vypolnyayutsya iz papki `lab14`.

```sh
npm ci
npm run task1
npm run task2
npm run task3 -- project_17
npm run task4
npm run task5
```

Konfiguraciya po umolchaniyu sootvetstvuet studentu i variantu. Pri neobhodimosti skopiruite `.env.example` v `.env`. Skripty npm podhvatyvayut etot fail avtomaticheski. Zapusk kazhdogo zadaniya napryamuyu: `node task1.js`, `node task2.js` i tak dalee.

1. `task1.js`: sozdaet `student_17.txt`, dobavlyaet kolichestvo strok do dobavleniya itogovoi stroki i pechataet soderzhimoe.
2. `task2.js`: sozdaet `project_17`, `info.txt` vo vseh papkah, komponenty 1-3 dlya nechetnogo varianta; pechataet derevo do i posle izmenenii.
3. `task3.js [katalog]`: schitaet faily, papki i razmer, gruppiruet faily po rasshireniyu, nahodit top-5 i imena s nomerom 17; pishet `report_17.json`. Bez argumenta analiziruet tekushchuyu papku. Simvolicheskie ssylki propuskayutsya. Kornevaya papka ne vhodyt v schetchik papok. Otchet otrazhaet sostoyanie do zapisi samogo otcheta.
4. `task4.js`: sozdaet 100000 strok, obrabatyvaet potokom s buferom 64 KB; schitaet statistiku sluchainyh chisel iz vtorogo stolbca i medianu cherez chastoty 1-1000. Progress schitaetsya po prochitannym baitam. Rezultat: `processed_17.txt`.
5. `task5.js`: sozdaet 20 failov v korne i 3 papki s failami, manifest, rezervnuyu kopiyu i ZIP cherez `yazl`. Rasshireniya izobrazhenii ispolzuyutsya dlya testovyh baitovyh failov. Tekst kopiruetsya potokami; faily bolshe 1 MB peredayutsya chankami po 512 KB v odin celevoi fail. Sravnenie soderzhimogo vypolnyaetsya cherez SHA-256. Manifest opisyvaet 23 testovyh faila, ne vklyuchaya samogo sebya.

```sh
node task5.js compare
```

Rezhim `compare` obnovlyaet `sync_report_17.txt` bez kopirovaniya. Dobavlennyi fail est tolko v istochnike; udalennyi est tolko v rezervnoi kopii; izmenennyi imeet drugoe soderzhimoe.

Zadaniya 2 i 5 ne perezapisyvayut sushchestvuyushchie katalogi proekta i rezervnoi kopii. Dlya povtornogo polnogo zapuska ispolzuite novuyu rabochuyu papku ili sohranite i peremestite predydushchie rezultaty. Vse puti k dannym otnositelny tekushchei rabochei direktorii.

Provereno zapuskom cherez Node.js: vse 5 zadanii; schetchiki failov i baitov; 100000 strok, summa, srednee, minimum, maksimum i mediana; sovpadenie vseh 24 failov v source, backup i ZIP; obnaruzhenie dobavleniya, udaleniya i izmeneniya; oshibki otsutstvuyushchei direktorii i povtornogo sozdaniya.

Snimki realnyh logov dlya otcheta nahodyatsya v `../screenshots_lab14/` otnositelno kornya repozitoriya. V metodichke net otdelnogo perechnya snimkov, poetomu podgotovleny rezultaty kazhdogo zadaniya, poisk po variantu, proverka razlichii i prosmotr ZIP.

## Скриншоты для отчёта

[Открыть все скриншоты (12 PNG)](screenshots/README.md)
