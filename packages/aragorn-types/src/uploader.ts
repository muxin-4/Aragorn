export interface Uploader {
  /** 名称 全局唯一 */
  name: string;
  /** SDK 相关文档地址 */
  docUrl?: string;
  /** 默认配置项 */
  defaultOptions: UploaderOptions;
  /** 配置项 方法调用时需要调用 changeOptions 方法修改 */
  options: UploaderOptions;
  /** 改变options */
  changeOptions: (newOptions: UploaderOptions, proxy?: string) => void;
  /** 批量上传模式 并发和顺序 */
  batchUploadMode?: BatchUploadMode;
  /** 文件上传 */
  upload: (options: UploadOptions) => Promise<UploadResponse>;
  /** 获取文件列表 */
  getFileList?: (directoryPath?: string) => Promise<FileListResponse>;
  /** 删除文件 */
  deleteFile?: (fileNames: string[]) => Promise<DeleteFileResponse>;
  /** 创建目录 */
  createDirectory?: (directoryPath: string) => Promise<CreateDirectoryResponse>;
}

export interface UploadOptions {
  /** 文件路径或文件Buffer数据 */
  file: string | Buffer;
  fileName: string;
  directoryPath?: string;
  isFromFileManage?: boolean;
  [property: string]: any;
}

export type BatchUploadMode = 'Concurrent' | 'Sequence';

export type UploaderOptionValidationRule =
  | 'domain'
  | 'domainPath'
  | 'domainQuery'
  | { pattern: RegExp | string; message: string };

export type UploaderOptionValidationRuleArr = UploaderOptionValidationRule[];

export enum UploaderOptionsSpan {
  small = 4,
  middle = 8,
  large = 12
}

interface UploaderOption {
  /** 表单字段描述 */
  label: string;
  /** 表单字段名 */
  name: string;
  /** 默认值 */
  value: any;
  /** 值类型 */
  valueType: 'input' | 'switch' | 'select';
  /** form 控件长度 */
  span?: UploaderOptionsSpan | number;
  /** select 选项 */
  options?: { label: string; value: any }[];
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  validationRule?: UploaderOptionValidationRuleArr;
  /** 配置项描述 */
  desc?: string;
  [property: string]: any;
}

export type UploaderOptions = UploaderOption[];

export interface UploadResponseData {
  /** 文件名 */
  name?: string;
  /** 文件url */
  url: string;
  [property: string]: any;
}

interface UploadSuccessResponse {
  success: true;
  data: UploadResponseData;
}

interface UploadFailResponse {
  success: false;
  desc: string;
}

export type UploadResponse = UploadSuccessResponse | UploadFailResponse;

export interface ListFile {
  name: string;
  size?: number;
  url?: string;
  lastModified?: Date;
  type?: 'directory' | 'normal';
  [property: string]: any;
}

interface FileListSuccessResponse {
  success: true;
  data: ListFile[];
}

interface FileListFailResponse {
  success: false;
  desc?: string;
}

export type FileListResponse = FileListSuccessResponse | FileListFailResponse;

export interface DeleteFileResponse {
  success: boolean;
  desc?: string;
}

export interface CreateDirectoryResponse {
  success: boolean;
  desc?: string;
}
