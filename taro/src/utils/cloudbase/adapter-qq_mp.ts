import {
  IRequestOptions,
  AbstractSDKRequest,
  IUploadRequestOptions,
  StorageInterface,
  WebSocketInterface,
  SDKAdapterInterface,
  WebSocketContructor,
  StorageType,
  formatUrl,
  IRequestConfig,
  IRequestMethod
} from '@cloudbase/adapter-interface';

// eslint-disable-next-line
declare const qq;
declare const App;
declare const Page;
declare const getApp;

function isMatch(): boolean {
  if (typeof qq === 'undefined') {
    return false;
  }
  if (typeof App === 'undefined') {
    return false;
  }
  if (typeof Page === 'undefined') {
    return false;
  }
  if (typeof getApp !== 'function') {
    return false;
  }
  if (!qq.onAppHide) {
    return false;
  }
  if (!qq.offAppHide) {
    return false;
  }
  if (!qq.onAppShow) {
    return false;
  }
  if (!qq.offAppShow) {
    return false;
  }
  if (!qq.getSystemInfoSync) {
    return false;
  }
  if (!qq.getStorageSync) {
    return false;
  }
  if (!qq.setStorageSync) {
    return false;
  }
  if (!qq.connectSocket) {
    return false;
  }
  if (!qq.request) {
    return false;
  }

  try {
    if (!qq.getSystemInfoSync()) {
      return false;
    }

    if (qq.getSystemInfoSync().AppPlatform !== 'qq') {
      return false;
    }

  } catch (e) {
    return false;
  }

  return true;
}

export class QQRequest extends AbstractSDKRequest {
  // 默认不限超时
  private readonly _timeout: number;
  // 超时提示文案
  private readonly _timeoutMsg: string;
  // 超时受限请求类型，默认所有请求均受限
  private readonly _restrictedMethods: IRequestMethod[];
  constructor(config: IRequestConfig = {}) {
    super();
    const { timeout, timeoutMsg, restrictedMethods } = config;
    this._timeout = timeout || 0;
    this._timeoutMsg = timeoutMsg || '请求超时';
    this._restrictedMethods = restrictedMethods || ['get', 'post', 'upload', 'download'];
  }
  public post(options: IRequestOptions) {
    const self = this;
    return new Promise((resolve, reject) => {
      let timer = null;
      const {
        url,
        data,
        headers
      } = options;
      const task = qq.request({
        url: formatUrl('https:', url),
        data,
        method: 'POST',
        header: headers,
        success(res) {
          self._clearTimeout(timer);
          resolve(res);
        },
        fail(err) {
          self._clearTimeout(timer);
          reject(err);
        }
      });
      timer = self._setTimeout('post', task);
    });
  }
  public upload(options: IUploadRequestOptions) {
    const self = this;
    return new Promise(resolve => {
      let timer = null;
      const {
        url,
        file,
        data,
        headers
      } = options;
      const task = qq.uploadFile({
        url: formatUrl('https:', url),
        // 固定字段
        name: 'file',
        formData: {
          ...data,
          file
        },
        filePath: file,
        header: headers,
        success(res) {
          self._clearTimeout(timer);
          const result = {
            statusCode: res.statusCode,
            data: res.data || {}
          };
          // 200转化为201（如果指定）
          if (res.statusCode === 200 && data.success_action_status) {
            result.statusCode = parseInt(data.success_action_status, 10);
          }
          resolve(result);
        },
        fail(err) {
          self._clearTimeout(timer);
          resolve(err);
        }
      });
      timer = self._setTimeout('upload', task);
    });
  }
  public download(options: IRequestOptions) {
    const self = this;
    return new Promise((resolve, reject) => {
      let timer = null;
      const {
        url,
        headers
      } = options;
      const task = qq.downloadFile({
        url: formatUrl('https:', url),
        header: headers,
        success(res) {
          self._clearTimeout(timer);
          if (res.statusCode === 200 && res.tempFilePath) {
            // 由于涉及权限问题，只返回临时链接不保存到设备
            resolve({
              statusCode: 200,
              tempFilePath: res.tempFilePath
            });
          } else {
            resolve(res);
          }
        },
        fail(err) {
          self._clearTimeout(timer);
          reject(err);
        }
      });
      timer = self._setTimeout('download', task);
    });
  }
  private _clearTimeout(timer: number | null) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  private _setTimeout(method: IRequestMethod, task): number | null {
    if (!this._timeout || this._restrictedMethods.indexOf(method) === -1) {
      return null;
    }
    const timer = setTimeout(() => {
      console.warn(this._timeoutMsg);
      task.abort();
    }, this._timeout);
    return timer;
  }
}

export const qqMpStorage: StorageInterface = {
  setItem(key: string, value: any) {
    qq.setStorageSync(key, value);
  },
  getItem(key: string): any {
    return qq.getStorageSync(key);
  },
  removeItem(key: string) {
    qq.removeStorageSync(key);
  },
  clear() {
    qq.clearStorageSync();
  }
};

export class QQMpWebSocket {
  constructor(url: string, options: object = {}) {
    const ws = qq.connectSocket({
      url,
      ...options
    });

    const socketTask: WebSocketInterface = {
      set onopen(cb) {
        ws.onOpen(cb);
      },
      set onmessage(cb) {
        ws.onMessage(cb);
      },
      set onclose(cb) {
        ws.onClose(cb);
      },
      set onerror(cb) {
        ws.onError(cb);
      },
      send: (data) => ws.send({
        data
      }),
      close: (code?: number, reason?: string) => ws.close({
        code,
        reason
      }),
      get readyState() {
        return ws.readyState;
      },
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    };
    return socketTask;
  }
}

function genAdapter() {
  // 小程序无sessionStorage
  const adapter: SDKAdapterInterface = {
    root: qq,
    reqClass: QQRequest,
    wsClass: QQMpWebSocket as WebSocketContructor,
    localStorage: qqMpStorage,
    primaryStorage: StorageType.local,
    getAppSign() {
      const info = qq.getAccountInfoSync();
      return info && info.miniProgram ? info.miniProgram.appId : '';
    }
  };
  return adapter;
}

const adapter = {
  genAdapter,
  isMatch,
  runtime: 'qq_mp'
};

try {
  qq.adapter = adapter;
  qq.tcbAdapterQQMp = adapter;
} catch (e) { }

export { adapter };
export default adapter;