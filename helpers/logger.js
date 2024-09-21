class Logger {
    constructor(stat) {
      this.stat = stat;
    }
  
    log(...args) {
        process.stdout.write(`${this.stat}: `);
        this._writeMessage(...args); // print message
        process.stdout.write(`\n`);
    }
  
    success(...args) {
      process.stdout.write("\x1b[32m"); // set color to green
      process.stdout.write(`${this.stat}: `);
      this._writeMessage(...args); // print message
      process.stdout.write("\x1b[0m\n"); // reset color
    }
  
    error(...args) {
      process.stdout.write("\x1b[31m"); // set color to red
      process.stdout.write(`${this.stat}: `);
      this._writeMessage(...args); // print error message
      process.stdout.write("\x1b[0m\n"); // reset color
    }

    warn(...args) {
      process.stdout.write("\x1b[33m"); // set color to green
      process.stdout.write(`${this.stat}: `);
      this._writeMessage(...args); // print message
      process.stdout.write("\x1b[0m\n"); // reset color
    }
  
    _writeMessage(...args) {
      args.forEach(arg => {
        if (arg instanceof Error) {
            // If it's an Error, print its message and stack
            process.stdout.write(`${arg.message}\n${arg.stack} `);
        } else if (typeof arg === 'object') {
          // If it's an object, print it as a JSON string
          process.stdout.write(`\n${JSON.stringify(arg, null, 2)} \n`);
        } else {
          // For anything else (string, number, etc.), just print it
          process.stdout.write(`${arg} `);
        }
      });
    }
  }
  
  module.exports = Logger;
  