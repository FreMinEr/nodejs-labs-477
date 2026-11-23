function report(error) {
  console.error(`Oshibka: ${error.code === 'ENOENT' ? 'Fail konfiguracii ili dannyh ne naiden' : error.message}`);
  if (process.env.NODE_ENV === 'development') console.error(error.stack);
  process.exitCode = 1;
}
function install() {
  process.on('uncaughtException', report);
  process.on('unhandledRejection', report);
}
module.exports = { report, install };
