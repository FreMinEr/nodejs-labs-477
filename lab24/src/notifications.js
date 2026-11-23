const nodemailer = require('nodemailer');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
function notifications(directory, log) { const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' }); return async user => { const mail = await transport.sendMail({ from: 'lab477@example.test', to: user.email, subject: 'Registraciya v gruppe 477', text: `Privet, ${user.name}. Registraciya zavershena.` }); await mkdir(directory, { recursive: true }); await writeFile(path.join(directory, `${user._id}.eml`), mail.message); log('[SERVICE] Email simulirovan, sohranen v outbox'); }; }
module.exports = { notifications };
