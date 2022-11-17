import { app, shell } from 'electron';
import log from 'electron-log';

const isDev = process.env.NODE_ENV === 'development';

export class Logger {
  private static instance: Logger;

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  init() {
    Object.assign(console, log.functions);
    console.log('log init');
    /**
     * electron log
     * 文件位置：例如
     * /Users/wangguanyu/Library/Logs/Aragorn/main.log
     */
    console.log(`log path: ${log.transports.file.getFile().path}`);
  }

  /**
   * 以桌面的默认方式打开日志文件。
   */
  open() {
    console.log('open log');
    shell.openPath(log.transports.file.getFile().path);
  }
}
