# Laboratornaya rabota 19

Parfenok Ivan Nikolaevich, gruppa 477, variant 17. Node.js 22+, bez vneshnih zavisimostei.

`npm run task1` ... `npm run task5`. Zadaniya 1-4 zavershayutsya sami; zadanie 5 zapuskaet HTTP-server na 127.0.0.1:3000, Ctrl+C dlya ostanovki. PORT zadayotsya peremennoi okruzheniya.

1. EventEmitter, greet/info/bye, emit true/false.
2. on/once/addListener, listenerCount/listeners, removeListener/removeAllListeners, poryadok.
3. DatabaseConnection — uchebnaya model v pamyati s connect/query/close/error. `node task3.js --unhandled` namerenno zavershaetsya s oshibkoi dlya demonstracii otsutstviya error-slushatelya.
4. PluginManager, meta-sobytiya, rost do 1010 slushatelei i ochistka, async i setImmediate. Preduprezhdenie MaxListenersExceededWarning ozhidaemo v demonstracii utechek.
5. EventBus: prioritet, stabilnyi poryadok, once, onAny/offAny, off, metriki, sync/async oshibki. GET /metrics uchityvaet tekushchii HTTP-zapros; raz v 2 sekundy sobytie system s dannymi os. Vremya poslednego vyzova i schetchiki oshibok vhodyat v metriki.

`npm test` proveryaet prioritet, reentrant once, wildcard, otpiski, sync/async oshibki i nezavisimost kopii metrik.

## Скриншоты для отчёта

[Открыть все скриншоты (24 PNG)](screenshots/README.md)
