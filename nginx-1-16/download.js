/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-else-return */

const request = require('request');
const fs = require('fs');
const path = require('path');
const os = require('os');
const extract = require('extract-zip');

const fileInDir = (loc) => {
  if (fs.existsSync(loc)) {
    const files = fs.readdirSync(path.join(loc));
    return files.length;
  }
  return 0;
};

const mac = 'nginx-darwin.zip';
const win = 'nginx-win32.zip';
const bin = path.join(__dirname, 'bin');
let downloadlink = 'https://cdn.stackabl.io/dependency/';

let filePath = '';
let flag = true;
const platform = os.platform();
if (platform === 'win32') {
  filePath = path.join(bin, win);
  downloadlink = `${downloadlink}${win}`;
} else {
  filePath = path.join(bin, mac);
  downloadlink = `${downloadlink}${mac}`;
}

const len = fileInDir(path.join(bin, platform));
if (len > 1) {
  flag = false;
}

const removeFile = (file_path) => {
  if (fs.existsSync(file_path)) {
    fs.unlinkSync(file_path);
  }
};

/**
 *
 * @description Used from splash screen to verify resources
 * @param {string} target_url - Url to download
 * @param {string} file_path - local path of file download
 * @return {}
 */

const downloadFile = (target_url, file_path) => {
  return new Promise((resolve, reject) => {
    let statusCode;
    let headers;
    let size = 0;
    let totalsize = 0;
    const file = fs.createWriteStream(file_path);
    const req = request.get(target_url, { timeout: 5000, gzip: true });

    req
      .on('error', (err) => {
        file.close();

        // log.error(`[ Download error: ${err} ${err.code}`);
        statusCode = 50000;
        if (err.code !== 'ESOCKETTIMEDOUT') {
          removeFile(file_path);
        }
        return reject(err);
      })
      .on('response', (response) => {
        totalsize = Number(response.headers['content-length']);
        statusCode = Number(response.statusCode);
        // log.info(response.statusCode, 'statusCode');
        headers = response.headers;
      })
      .on('data', (chunk) => {
        size += chunk.length;
      })
      .on('complete', () => {
        if (!file.writableFinished) {
          file.destroy();
        }

        // ApplyChecksum
        if (statusCode === 200) {
          if (size === totalsize) {
            return resolve(file_path);
          } else if (size < totalsize) {
            return reject(
              new Error(`${statusCode} Failed to download required files`)
            );
          } else {
            removeFile(file_path);

            return reject(
              new Error(`${statusCode} Failed to download required files`)
            );
          }
        } else if (statusCode === 50000) {
          return reject(
            new Error(`${statusCode} Failed to download required files`)
          );
        } else {
          removeFile(file_path);
          return reject(
            new Error(`${statusCode} Failed to download required files`)
          );
        }
      })
      .pipe(file);
  });
};

/**
 *
 * @description used to start downloading or resume downloading based on local file status
 * @param {string} target_url - Url to download
 * @param {string} file_path - local path of file download
 * @callback  {checkfileExists~callback} - Callback to handle status of  file
 * @return {}
 */

/**
 * @callback callback
 * @param error
 * @param status - status 1 for resume download , 0 for redonwload , 2 for file already exists no download required
 * @param currentSize
 * @param totalSize
 */
const checkfileExists = (file_path, target_url, callback) => {
  const exist = fs.existsSync(file_path);
  if (exist) {
    const stats = fs.statSync(file_path);
    // getting headers for s3 bucket file
    request.head(target_url, (err, result) => {
      if (err) {
        return callback(err);
      }
      const totalSize = Number(result.headers['content-length']);

      if (stats.size < totalSize) {
        return callback(err, 1, stats.size, totalSize);
      }
      if (stats.size === totalSize) {
        return callback(err, 2);
      }
      removeFile(file_path);
      return callback(err, 0);
    });
  } else {
    return callback(null, 0);
  }
};

/**
 * @description Used from splash screen to verify resources
 * @param {string} target_url - Url to download
 * @param {string} file_path - local path of file download
 * @param {function} actionToRun - Action to perform once downloading completed
 * @param {function} reactCallback - Callback from react page to modify state.
 * @param {function} callback - Callback to handle response from downloadResourceAndPerformAction
 * @return {}
 */

const resumeFile = (target_url, file_path, currentSize = 0, totalsize = 0) => {
  return new Promise((resolve, reject) => {
    let size = currentSize;
    const file = fs.createWriteStream(file_path, { flags: 'a' });
    let status_code;
    let headers;
    const header = {
      headers: { Range: `bytes=${size}-${totalsize}` },
      timeout: 5000,
    };
    const req = request(target_url, header);
    req
      .on('error', (err) => {
        status_code = 50000;
        file.close();
        if (err.code !== 'ESOCKETTIMEDOUT') {
          removeFile(file_path);
        }
        return reject(err);
      })
      .on('response', (response) => {
        status_code = Number(response.statusCode);
        headers = response.headers;
      })
      .on('data', (chunk) => {
        size += chunk.length;
      })
      .on('complete', () => {
        if (!file.writableFinished) {
          file.end();
        }

        if (
          typeof status_code === 'number' &&
          [200, 206].includes(status_code)
        ) {
          if (size === totalsize) {
            resolve(file_path);
          } else if (size < totalsize) {
            return reject(
              new Error(`${status_code} Failed to download required files`)
            );
          } else {
            removeFile(file_path);
            return reject(
              new Error(`${status_code} Failed to download required files`)
            );
          }

          // actionToRun(file_path, reactCallback, callback);
          // eslint-disable-next-line no-else-return
        } else {
          removeFile(file_path);
          return reject(
            new Error(`${status_code} Failed to download required filess`)
          );
        }
      })
      .pipe(file);
  });
};

/* ***********************mainmethods ******************************************************** *\

/**
 * @description - function to  resume or complete download
 * @param target_url
 * @param file_path
 */

const commonDownload = (target_url, file_path) => {
  return new Promise((resolve, reject) => {
    checkfileExists(
      file_path,
      target_url,
      async (err, status, currentSize, totalSize) => {
        if (err) {
          return reject(err);
        }
        try {
          if (status === 1) {
            await resumeFile(target_url, file_path, currentSize, totalSize);
          }
          if (status === 0) {
            await downloadFile(target_url, file_path);
          }
          return resolve(file_path);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/* ************************************************End main methods******************************** */

if (flag) {
  if (!fs.existsSync(bin)) {
    fs.mkdirSync(bin);
  }

  commonDownload(downloadlink, filePath)
    .then(() => {
      console.info('Download');
      console.info(downloadlink);
      return extract(filePath, {
        dir: bin,
      });
    })
    .then(() => {
      console.info('Extracted');
      console.info(filePath);
      removeFile(filePath);
      return 0;
    })

    .catch((err) => {
      console.error(err);
    });
} else {
  console.log('Skip Download');
}
