class Logger {
  constructor({ level = 'INFO', formatter = 'text', transport = 'console' } = {}) {
    this.level = level;
    this.transport = transport;
    this.fmt = formatter === 'json'
      ? entry => JSON.stringify(entry)
      : entry => `[${entry.timestamp}] [${entry.level}] ${entry.fn}: ${entry.message}`;
  }
 
  static LEVELS = { DEBUG: 0, INFO: 1, ERROR: 2 };
 
  _shouldLog(level) {
    return Logger.LEVELS[level] >= Logger.LEVELS[this.level];
  }
 
  log(level, fn, message) {
    if (!this._shouldLog(level)) return;
    const entry = { timestamp: new Date().toISOString(), level, fn, message };
    if (typeof this.transport === 'function') {
      this.transport(this.fmt(entry));
    } else {
      const method = level === 'ERROR' ? 'error' : 'log';
      console[method](this.fmt(entry));
    }
  }
}
function withLog(fn, logger) {
  return async function (...args) {
    const name  = fn.name || 'anonymous';
    const start = Date.now();
 
    logger.log('DEBUG', name, `args: ${JSON.stringify(args)}`);
 
    try {
      const result = await Promise.resolve(fn(...args));
      const ms = Date.now() - start;
 
      logger.log('INFO', name, `result: ${JSON.stringify(result)} (${ms}ms)`);
      return result;
 
    } catch (err) {
      const ms = Date.now() - start;
      logger.log('ERROR', name, `threw: ${err.message} (${ms}ms)`);
      throw err;
    }
  };
}
const add    = (a, b) => a + b;
const divide = (a, b) => { if (b === 0) throw new Error('Division by zero'); return a / b; };
const delay  = ms => new Promise(r => setTimeout(r, ms));
const fetchUser = async id => { await delay(50); return { id, name: 'Аня' }; };
 
const infoLogger  = new Logger({ level: 'INFO' });
const errorLogger = new Logger({ level: 'ERROR', formatter: 'json' });
const logs = [];
const debugLogger = new Logger({ level: 'DEBUG', transport: msg => logs.push(msg) });
 
const loggedAdd = withLog(add, infoLogger);
const loggedDivide = withLog(divide, errorLogger);
const loggedFetch = withLog(fetchUser, infoLogger);
const loggedAddDebug = withLog(add, debugLogger);
 
async function main() {
  console.log('INFO: add');
  await loggedAdd(3, 4);
 
  console.log('\nERROR-only: divide (success — не логується)');
  await loggedDivide(10, 2);
 
  console.log('\n ERROR-only: divide (помилка — логується)');
  try { await loggedDivide(10, 0); } catch (_) {}
 
  console.log('\nINFO: async fetchUser');
  await loggedFetch(42);
 
  console.log('\n DEBUG: custom transport ');
  await loggedAddDebug(1, 2);
  console.log('Captured logs:', logs);
}
 
main();