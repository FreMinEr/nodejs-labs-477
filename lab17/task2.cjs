const fs = require('node:fs/promises');
const path = require('node:path');
const { finished } = require('node:stream/promises');
const PDFDocument = require('pdfkit');
const program = require('./utils/program.cjs')();
const { report } = require('./utils/errors.cjs');
program.command('generate').description('Sgenerirovat otchet').option('-t, --type <type>', 'Tip: html, pdf, json, csv', 'html').option('-o, --output <path>', 'Put sohraneniya').option('-f, --force', 'Perezapisat fail').option('--dry-run', 'Proverka bez zapisi').action(async options => {
  if (!['html', 'pdf', 'json', 'csv'].includes(options.type)) throw new Error('Nedopustimyi tip. Dopustimy html, pdf, json, csv');
  const target = path.resolve(options.output ?? `output.${options.type}`);
  if (options.dryRun) { console.log(`DRY-RUN: tip ${options.type}\nFail: ${target}\nDeistviya ne vypolneny`); return; }
  if (program.opts().verbose) console.error(`Podrobno: generaciya ${options.type}, fail ${target}`);
  const data = { student: 'Parfenok Ivan Nikolaevich', group: '477', lab: 17 };
  const content = options.type === 'html' ? `<html><meta charset="utf-8"><h1>Otchet</h1><p>${data.student}, gruppa ${data.group}</p></html>` : options.type === 'csv' ? `student,group,lab\n${data.student},477,17\n` : JSON.stringify(data, null, 2);
  if (options.type === 'pdf') {
    const handle = await fs.open(target, options.force ? 'w' : 'wx');
    const stream = handle.createWriteStream();
    const doc = new PDFDocument();
    const completion = finished(stream);
    doc.on('error', error => stream.destroy(error));
    doc.pipe(stream); doc.text('Otchet: Lab 17').text(`${data.student}, gruppa 477`); doc.end();
    await completion;
  } else await fs.writeFile(target, content, { flag: options.force ? 'w' : 'wx' });
  console.log(`Otchet sozdan: ${target}`);
});
program.command('convert').description('Konvertirovat JSON v CSV').requiredOption('-i, --input <path>', 'Vhodnoi JSON').requiredOption('-o, --output <path>', 'Vyhodnoi CSV').action(async options => {
  const data = JSON.parse(await fs.readFile(options.input, 'utf8'));
  if (!Array.isArray(data) || !data.length || data.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('Trebuetsya massiv obektov');
  const keys = Object.keys(data[0]);
  const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  await fs.writeFile(options.output, [keys.map(quote).join(','), ...data.map(row => keys.map(key => quote(row[key])).join(','))].join('\n'), { flag: 'wx' });
  console.log('Konvertaciya zavershena');
});
program.parseAsync().catch(error => { if (!['commander.helpDisplayed', 'commander.version'].includes(error.code)) report(error); });
