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