import * as config from 'config'

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
declare const jd;
declare const App;
declare const Page;
declare const getApp;

function isMatch(): boolean {
  if (typeof jd === 'undefined') {
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
  // if (!jd.onAppHide) {
  //   return false;
  // }
  // if (!jd.offAppHide) {
  //   return false;
  // }
  // if (!jd.onAppShow) {
  //   return false;
  // }
  // if (!jd.offAppShow) {
  //   return false;
  // }
  if (!jd.getSystemInfoSync) {
    return false;
  }
  if (!jd.getStorageSync) {
    return false;
  }
  if (!jd.setStorageSync) {
    return false;
  }
  if (!jd.connectSocket) {
    return false;
  }
  if (!jd.request) {
    return false;
  }

  try {
    if (!jd.getSystemInfoSync()) {
      return false;
    }

    // if (jd.getSystemInfoSync().AppPlatform !== 'jd') {
    //   return false;
    // }

  } catch (e) {
    return false;
  }




  return true;
}

export class JDRequest extends AbstractSDKRequest {
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
      const task = jd.request({
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
      const task = jd.uploadFile({
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
      const task = jd.downloadFile({
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

export const jdMpStorage: StorageInterface = {
  setItem(key: string, value: any) {
    jd.setStorageSync(key, value);
  },
  getItem(key: string): any {
    return jd.getStorageSync(key);
  },
  removeItem(key: string) {
    jd.removeStorageSync(key);
  },
  clear() {
    jd.clearStorageSync();
  }
};

export class JDMpWebSocket {
  constructor(url: string, options: object = {}) {
    const ws = jd.connectSocket({
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
  console.log('jdMpStorage :', jdMpStorage);
  // 小程序无sessionStorage
  const adapter: SDKAdapterInterface = {
    root: jd,
    reqClass: JDRequest,
    wsClass: JDMpWebSocket as WebSocketContructor,
    localStorage: jdMpStorage,
    primaryStorage: StorageType.local,
    getAppSign() {
      // 兼容写法
      return config.appId || ''
    }
    // getAppSign() {
    //   const info = jd.getAccountInfoSync();
    //   return info && info.miniProgram ? info.miniProgram.appId : '';
    // }
  };
  console.log('adapter :', adapter);
  return adapter;
}

const adapter = {
  genAdapter,
  isMatch,
  runtime: 'jd_mp'
};

try {
  console.log('1 :', 1);
  jd.adapter = adapter;
  jd.tcbAdapterJDMp = adapter;
  console.log('jd.adapter :', jd);
} catch (e) {
  console.log('e :', e);
}

console.log('2 :', 2);
export { adapter };
export default adapter;