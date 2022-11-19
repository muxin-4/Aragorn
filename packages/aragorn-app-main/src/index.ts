import { config as dotenvConfig } from 'dotenv';
import { app } from 'electron';
import reloader from 'electron-reloader';
import { Logger } from './logger';
import { Tray } from './tray';
import { WindowManager } from './windowManager';
import { WebServer } from './webServer';
import { Setting } from './setting';
import { Ipc } from './ipc';

/**
 * Simple auto-reloading for Electron apps during development
 * 自动更新
 */
try {
  module.filename = __filename;
  reloader(module, {
    watchRenderer: false
  });
} catch (err) {
  console.error(err);
}

/**
 * 记录Electron初始化时间的日志
 */
Logger.getInstance().init();

/**
 * 加载根路径的.env文件中的配置到process.env
 */
console.log('process.env0', process.env);
dotenvConfig({ path: '../../.env' });

/**
 * 客户端开启单实例
 *
 * requestSingleInstanceLock 此方法的返回值表示你的应用程序实例是否成功取得了锁。 如果它取得锁失败，你可以假设另一个应用实例已经取得了锁并且仍旧在运行，并立即退出。
 * 即: 如果当前进程是应用程序的主要实例，则此方法返回true，同时你的应用会继续运行。 如果当它返回 false如果你的程序没有取得锁，它应该立刻退出，并且将参数发送给那个已经取到锁的进程。
 */
const gotTheLock = app.requestSingleInstanceLock();

const windowManager = WindowManager.getInstance();

if (gotTheLock) {
  /**
   * 当 Electron 完成初始化时，发出一次。
   */
  app.on('ready', () => {
    console.log('app ready');
    Ipc.getInstance();
    Tray.getInstance().init();
    windowManager.showWindow();
    Setting.getInstance().registerUploadShortcutKey();
    WebServer.getInstance().init();
  });

  /**
   * 当所有的窗口都被关闭时触发。
   */
  app.on('window-all-closed', function () {
    console.log('app all window closed');
    app?.dock?.hide();
  });

  /**
   * 当应用被激活时发出。
   * 各种操作都可以触发此事件, 例如首次启动应用程序、尝试在应用程序已运行时或单击应用程序的坞站或任务栏图标时重新激活它。
   */
  app.on('activate', () => {
    console.log('app activate');
    windowManager.showWindow();
  });

  /**
   * 当第二个实例被执行并且调用 app.requestSingleInstanceLock() 时，这个事件将在你的应用程序的首个实例中触发
   */
  app.on('second-instance', () => {
    console.warn('app second instance emit');
    windowManager.handleSecondInstance();
  });
} else {
  app.quit();
}
