class DebugLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  log(component, message, data = null) {
    const timestamp = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      component,
      message,
      data,
      time: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    console.log(`🔍 [${timestamp}ms] ${component}: ${message}`, data || '');
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const debug = new DebugLogger();