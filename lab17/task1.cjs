const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help') console.log('Ispolzovanie: my-cli <komanda> [argumenty]\ngreet <imya> - privetstvie\ninfo - informaciya o gruppe');
else if (command === 'greet' && args.length === 1) console.log(`Privet, ${args[0]}! Dobro pozhalovat v CLI gruppy 477.`);
else if (command === 'info' && !args.length) console.log(`Gruppa: 477\nStudent: Parfenok Ivan Nikolaevich\nLaboratornaya rabota: 17\nData: ${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' })}`);
else { console.error('Oshibka: neizvestnaya komanda ili nevernye argumenty. Ispolzuite --help'); process.exitCode = 1; }
