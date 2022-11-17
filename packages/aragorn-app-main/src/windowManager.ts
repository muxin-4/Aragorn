import { app, BrowserWindow } from 'electron';
import { Ipc } from './ipc';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export class WindowManager {
  private static instance: WindowManager;

  static getInstance() {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  mainWindow?: BrowserWindow;

  createWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: 950,
      height: 700,
      titleBarStyle: 'hidden',
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, './preload.js'),
        nodeIntegration: true,
        enableRemoteModule: true
      }
    });
    const devtools = new BrowserWindow();

    if (isDev) {
      window.loadURL(`http://localhost:${process.env.RENDERER_DEV_PORT}`);
      window.webContents.setDevToolsWebContents(devtools.webContents);
      window.webContents.openDevTools({ mode: 'right' });
    } else {
      // Event: 'did-finish-load' 导航完成时触发，即选项卡的旋转器将停止旋转，并指派onload事件后。
      // 在窗口中加载指定文件，filePath 必须是一个相对于你的应用程序根目录的 HTML 文件路径。
      window.loadFile(path.resolve(__dirname, '../renderer/index.html'));
    }

    return window;
  }

  showWindow() {
    // Mac 显示 dock icon
    app?.dock?.show();

    // 打开的窗口数量为9
    if (BrowserWindow.getAllWindows().length === 0) {
      this.mainWindow = this.createWindow();
      Ipc.win = this.mainWindow;
    } else {
      // 显示并给予窗口焦点
      this.mainWindow?.show();
    }
  }

  handleSecondInstance() {
    if (this.mainWindow && BrowserWindow.getAllWindows().length !== 0) {
      // 窗口是否最小化
      if (this.mainWindow.isMinimized()) {
        // 将窗口从最小化状态恢复到以前的状态
        this.mainWindow.restore();
      }
      // 聚焦在窗口上
      this.mainWindow.focus();
    }
  }
}
