import { app } from 'electron';
import ElectronStore from 'electron-store';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';

const devConfigDir = path.resolve(__dirname, '../../../../appDevConfig');
console.log('devConfigDir1', devConfigDir);

/**
 * app.getPath('userData')
 * userData: 储存你应用程序配置文件的文件夹，默认是 appData 文件夹附加应用的名称
 * 按照习惯用户存储的数据文件应该写在此目录，同时不建议在这写大文件，因为某些环境会备份此目录到云端存储。
 */
const cwd = isDev ? devConfigDir : app.getPath('userData');

export const historyStore = new ElectronStore({ name: 'history', cwd });

export const settingStore = new ElectronStore({ name: 'setting', cwd });

export const uploaderProfilesStore = new ElectronStore({ name: 'uploaderProfiles', cwd });

/**
 * 检查`${cwd}/config.json`文件是否存在
 * fs.existsSync Returns true if the path exists, false otherwise.
 */
if (fs.existsSync(`${cwd}/config.json`)) {
  let oldVersionUploaderProfiles = [] as any;

  const oldStore = new ElectronStore({ name: 'config', cwd });

  const userSdkList = oldStore.get('userSdkList', []) as any[];

  oldVersionUploaderProfiles = userSdkList.map(item => {
    const newItem = {} as any;
    newItem.id = item.uuid;
    newItem.name = item.name;
    newItem.uploaderName = item.sdkName;
    newItem.uploaderOptions = item.configurationList;
    return newItem;
  });

  uploaderProfilesStore.set('uploaderProfiles', oldVersionUploaderProfiles);

  // fs.unlinkSync () 方法用于从文件系统中同步删除文件或符号链接。此函数不适用于目录，因此建议使用 fs.rmdir() 删除目录
  fs.unlinkSync(`${cwd}/config.json`);
}
