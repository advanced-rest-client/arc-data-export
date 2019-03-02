/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * An element to handle data export for ARC.
 *
 * @customElement
 * @polymer
 * @memberof LogicElements
 */
export class ArcDataExport extends PolymerElement {
  static get importMeta() {
    return import.meta;
  }
  static get properties() {
    return {
      /**
       * Hosting application version number. If not set it sends `app-version`
       * custom event to query for the application version number.
       */
      appVersion: {type: String, value: 'unknown'},
      /**
       * A size of datastore read operation in one call.
       */
      dbChunk: {
        type: Number,
        value: 1000
      },
      /**
       * If set it uses arc electron session state module to read cookie data
       */
      electronCookies: Boolean
    };
  }

  constructor() {
    super();
    this._exportHandler = this._exportHandler.bind(this);
    this._arcExportHandler = this._arcExportHandler.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('export-data', this._exportHandler);
    window.addEventListener('arc-data-export', this._arcExportHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('export-data', this._exportHandler);
    window.removeEventListener('arc-data-export', this._arcExportHandler);
    if (this._worker) {
      this._worker = undefined;
    }
  }
  /**
   * Handler for the `export-data` custom event.
   * This event is not meant to be used to export ARC datstre data.
   * @param {CustomEvent} e
   */
  _exportHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.detail.result = this.dataExport(e.detail);
  }
  /**
   * Handler for `arc-data-export` event that exports ARC data
   * (settings, requests, project, etc).
   * @param {CustomEvent} e Event dispatched by element requesting the export.
   */
  _arcExportHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.detail.result = this.arcExport(e.detail);
  }

  dataExport(opts) {
    const file = opts.file || 'arc-data-export.json';
    const destination = opts.destination;
    let data = opts.data;
    switch (destination) {
      case 'file': return this._exportFile(data, file, opts.providerOptions);
      case 'drive': return this._exportDrive(data, file, opts.providerOptions);
      default: return Promise.reject(`Unknown destination ${destination}`);
    }
  }
  /**
   * Generates and saves ARC export object from user data.
   * @param {Object} detail Export configuration. See
   * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/export-event.md
   * for details.
   * @return {Promise} Promise resolved to a result of saving a file.
   * Google Drive results with create response.
   */
  arcExport(detail) {
    let {data, options, providerOptions} = detail;
    if (!options) {
      return Promise.reject(new Error('The "options" property is not set.'));
    }
    if (!options.provider) {
      return Promise.reject(new Error('The "options.provider" property is not set.'));
    }
    if (!options.file) {
      return Promise.reject(new Error('The "options.file" property is not set.'));
    }
    const dataKeys = Object.keys(data);
    const exportData = {};
    let databases = [];
    for (let i = 0, len = dataKeys.length; i < len; i++) {
      const key = dataKeys[i];
      const value = data[key];
      if (typeof value === 'boolean' && value) {
        databases[databases.length] = key;
      } else if (value instanceof Array) {
        exportData[key] = value;
      } else {
        console.warn(`Unknown export data configuration. ${key}.`);
      }
    }
    databases = this._getDatabasesInfo(databases);
    const promises = [];
    if (this.electronCookies && 'cookies' in databases) {
      promises.push(this._queryCookies());
      delete databases.cookies;
    }
    Object.keys(databases).forEach((name) => {
      promises.push(this._getDatabaseEntries(name));
    });
    return Promise.all(promises)
    .then((result) => {
      result.forEach((data) => {
        if (data.name === 'cookies' && this.electronCookies) {
          databases.cookies = 'cookies';
        }
        exportData[databases[data.name]] = data.data;
      });
      return exportData;
    })
    .then((exportData) => this.createExportObject(exportData, options))
    .then((data) => {
      data = JSON.stringify(data);
      if (!providerOptions) {
        providerOptions = {};
      }
      providerOptions.contentType = 'application/restclient+data';
      switch (options.provider) {
        case 'file': return this._exportFile(data, options.file, providerOptions);
        case 'drive': return this._exportDrive(data, options.file, providerOptions);
        default: return Promise.reject(new Error(`Unknown destination ${options.provider}`));
      }
    });
  }
  /**
   * Creates an export object for the data.
   *
   * @param {Object} data Export options. Available keys:
   * -   `requests` (Array) List of requests to export
   * -   `projects` (Array) List of projects to export
   * -   `history` (Array) List of history requests to export
   * -   `websocket-url-history` (Array) List of url history object for WS to export
   * -   `url-history` (Array) List of URL history objects to export
   * -   `variables` (Array) List of variables to export
   * -   `auth-data` (Array) List of the auth data objects to export
   * -   `cookies` (Array) List of cookies to export
   * -   `kind` (String) The `kind` property of the top export declaration.
   *      Default to `ARC#AllDataExport`
   * @param {Object} options Export configuration object
   * @return {Object} ARC export object declaration.
   */
  createExportObject(data, options) {
    options = options || {};
    if (options) {
      options = Object.assign({}, options);
    } else {
      options = {};
    }
    options.appVersion = this.appVersion || 'Unknown version';
    if (!options.kind) {
      options.kind = 'ARC#AllDataExport';
    }
    return new Promise((resolve, reject) => {
      const worker = this._ensureWorker();
      const callbacks = {
        err: (e) => {
          worker.removeEventListener('message', callbacks.data);
          worker.removeEventListener('error', callbacks.err);
          const err = e.message.replace('Uncaught Error: ', '');
          reject(err);
        },
        data: (e) => {
          worker.removeEventListener('message', callbacks.data);
          worker.removeEventListener('error', callbacks.err);
          resolve(e.data);
        }
      };
      worker.addEventListener('message', callbacks.data);
      worker.addEventListener('error', callbacks.err);
      worker.postMessage({data, options});
    });
  }
  /**
   * Creates a worker and references it as `_worker` property.
   *
   * @return {Worker} Reference to the data processing worker/
   */
  _ensureWorker() {
    if (this._worker) {
      return this._worker;
    }
    const url = this.importPath + 'workers/data-processing.js';
    const worker = new Worker(url);
    this._worker = worker;
    return this._worker;
  }
  /**
   * A function used with `electronCookies` flag.
   * It queries `electron-session-state` node module for cookies instead of
   * the database.
   * @return {Promise}
   */
  _queryCookies() {
    const e = this._dispatchCookieList();
    if (!e.defaultPrevented) {
      console.warn('electron-session-state module not active');
      return Promise.resolve({
        name: 'cookies',
        data: []
      });
    }
    return e.detail.result
    .then((data) => {
      return {
        name: 'cookies',
        data
      };
    });
  }
  /**
   * Disaptches `session-cookie-list-all` event and returns it.
   * @return {CustomEvent}
   */
  _dispatchCookieList() {
    const e = new CustomEvent('session-cookie-list-all', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this.dispatchEvent(e);
    return e;
  }
  /**
   * Checks if `type` is one of the allowed export types defined in
   * `exportType`.
   *
   * @param {String|Array} exportType Export type name or list of export types
   * names allowed to be exported.
   * @param {String} type An export type to test
   * @return {Boolean} True if the `type` is allowed
   */
  _isAllowedExport(exportType, type) {
    if (exportType instanceof Array) {
      return exportType.indexOf(type) !== -1;
    }
    return exportType === type || exportType === 'all' || exportType === true;
  }
  /**
   * Creats a map of database name <--> export object key name mapping.
   *
   * @param {String|Array} type Name of the database or list of databases names
   * to export
   * @return {Object} A map where keys are database name and values are
   * export object properties where the data will be put.
   */
  _getDatabasesInfo(type) {
    const databases = {};
    if (this._isAllowedExport(type, 'history')) {
      databases['history-requests'] = 'history';
    }
    if (this._isAllowedExport(type, 'saved')) {
      databases['saved-requests'] = 'requests';
      databases['legacy-projects'] = 'projects';
    }
    if (this._isAllowedExport(type, 'websocket')) {
      databases['websocket-url-history'] = 'websocket-url-history';
    }
    if (this._isAllowedExport(type, 'url-history')) {
      databases['url-history'] = 'url-history';
    }
    if (this._isAllowedExport(type, 'variables')) {
      databases.variables = 'variables';
    }
    if (this._isAllowedExport(type, 'auth')) {
      databases['auth-data'] = 'auth-data';
    }
    if (this._isAllowedExport(type, 'cookies')) {
      databases.cookies = 'cookies';
    }
    if (this._isAllowedExport(type, 'host-rules')) {
      databases['host-rules'] = 'host-rules';
    }
    return databases;
  }
  /**
   * Returns all data from a database.
   *
   * @param {String} dbName Name of the datastore t get the data from.
   * @return {Promise} Resolved promise to array of objects. It always
   * resolves.
   */
  _getDatabaseEntries(dbName) {
    const options = {
      limit: this.dbChunk,
      // jscs:disable
      include_docs: true
      // jscs:enable
    };
    /* global PouchDB */
    const db = new PouchDB(dbName);
    let result = [];
    return new Promise((resolve) => {
      function fetchNextPage() {
        db.allDocs(options, function(err, response) {
          if (response && response.rows && response.rows.length > 0) {
            options.startkey = response.rows[response.rows.length - 1].id;
            options.skip = 1;
            const docs = response.rows.map((item) => item.doc);
            result = result.concat(docs);
            return fetchNextPage();
          } else {
            resolve({
              name: dbName,
              data: result
            });
          }
        });
      }
      fetchNextPage();
    });
  }
  /**
   * Requests application to export data to file.
   *
   * @param {Object|String} data Data to export
   * @param {String} file File name
   * @param {Object} options Provider options
   * @return {Promise}
   */
  _exportFile(data, file, options) {
    if (!options) {
      options = {};
    }
    if (!options.contentType) {
      options.contentType = 'application/restclient+data';
    }
    const e = new CustomEvent('file-data-save', {
      cancelable: true,
      bubbles: true,
      composed: true,
      detail: {
        content: data,
        file,
        options
      }
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      return Promise.reject(new Error('File export module not found.'));
    }
    return e.detail.result;
  }
  /**
   * Requests application to export data to Google Drive.
   *
   * @param {Object|String} data Data to export
   * @param {String} file File name
   * @param {Object} options Provider options
   * @return {Promise}
   */
  _exportDrive(data, file, options) {
    if (!options) {
      options = {};
    }
    if (!options.contentType) {
      options.contentType = 'application/restclient+data';
    }
    const e = new CustomEvent('google-drive-data-save', {
      cancelable: true,
      bubbles: true,
      composed: true,
      detail: {
        content: data,
        file,
        options
      }
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      return Promise.reject(new Error('Google Drive export module not found.'));
    }
    return e.detail.result;
  }
  /**
   * Fired when any element request to export data outside the application
   *
   * @event file-data-save
   * @param {Any} data The data to export.
   * @param {String} contentType Data content type.
   * @param {String} file Export file name.
   */
  /**
   * Dispatched when file data to be saved on Google Drive.
   *
   * @event google-drive-data-save
   * @param {Any} data The data to export.
   * @param {String} contentType Data content type.
   * @param {String} file Export file name.
   */
}
window.customElements.define('arc-data-export', ArcDataExport);