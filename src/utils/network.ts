import * as http from 'http';
import * as https from 'https';

function httpNetwork(method: 'GET' | 'POST', url: string, params: string = ''): Promise<any> {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(params)
    }
    const options = {
      method,
      headers
    }
    const req: http.ClientRequest = http.request(url, options, (res) => {
      let err = null;
      const contentType: string = <string>res.headers['content-type'];

      // 任何 2xx 状态码都表示成功的响应
      if (Math.floor(<number>res.statusCode / 100) !== 2) err = new Error(`请求失败，状态码: ${res.statusCode}`);

      if (err) {
        // 释放内存
        res.resume();
        reject(err)
      }

      switch (contentType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/jpg':
          res.setEncoding('base64');
          break;
        default:
          res.setEncoding('utf8');
          //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
          break;
      }

      let raw_data: any = '';

      res.on('data', (chunk: any) => { raw_data += chunk; });
      res.on('end', () => {
        // 若 data 为 json 则转换
        if (/^application\/json/.test(contentType)) {
          raw_data = JSON.parse(raw_data);
        }

        resolve(raw_data)
      });
    }).on('error', (err: Error) => {
      reject(err);
    }).on('timeout', () => {
      reject(`Timeout: ${url}`);
    });

    // 将数据写入请求 body
    req.write(params);
    // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
    req.end();
  })
}

function httpsNetwork(method: 'GET' | 'POST', url: string, params: string = ''): Promise<any> {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(params)
    }
    const options = {
      method,
      headers
    }
    const req: http.ClientRequest = https.request(url, options, (res) => {
      let err = null;
      const contentType: string = <string>res.headers['content-type'];

      // 任何 2xx 状态码都表示成功的响应
      if (Math.floor(<number>res.statusCode / 100) !== 2) err = new Error(`请求失败，状态码: ${res.statusCode}`);

      if (err) {
        // 释放内存
        res.resume();
        reject(err);
      }

      switch (contentType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/jpg':
          res.setEncoding('base64');
          break;
        default:
          res.setEncoding('utf8');
          //   err = new Error(`无效的 content-type ，接收到的是 ${contentType}`);
          break;
      }

      let raw_data: any = '';

      res.on('data', (chunk: any) => { raw_data += chunk; });
      res.on('end', () => {
        // 若 data 为 json 则转换
        if (/^application\/json/.test(contentType)) {
          raw_data = JSON.parse(raw_data);
        }

        resolve(raw_data)
      });
    }).on('error', (err: Error) => {
      reject(err);
    }).on('timeout', () => {
      reject(`Timeout: ${url}`);
    });

    // 将数据写入请求 body
    req.write(params);
    // 使用 request() 时，必须始终调用 req.end() 来表示请求的结束
    req.end();
  })
}

/**
 * http 网络请求
 */
const httpRequest = {
  /**
   * 发起 http get 请求
   * @param url 网络请求 url
   * @param params url 参数
   */
  get: (url: string, params: string = ''): Promise<any> => {
    return new Promise((resolve, reject) => {
      httpNetwork('GET', `${url}${params}`)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err);
        })
    })
  },

  /**
   * 发起 http post 请求
   * @param url 网络请求 url
   * @param params post 参数
   */
  post: (url: string, params: string | undefined): Promise<any> => {
    return new Promise((resolve, reject) => {
      httpNetwork('POST', url, params)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err);
        })
    })
  }

}

/**
 * https 网络请求
 */
const httpsRequest = {
  /**
   * 发起 https get 请求
   * @param url 网络请求 url
   * @param params url 参数
   */
  get: (url: string, params: string = ''): Promise<any> => {
    return new Promise((resolve, reject) => {
      httpsNetwork('GET', `${url}${params}`)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err);
        })
    })
  },

  /**
   * 发起 https post 请求
   * @param url 网络请求 url
   * @param params post 参数
   */
  post: (url: string, params: string | undefined): Promise<any> => {
    return new Promise((resolve, reject) => {
      httpsNetwork('POST', url, params)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err);
        })
    })
  }
}

export {
  httpRequest, httpsRequest
}