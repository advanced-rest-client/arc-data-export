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
import 'pouchdb/dist/pouchdb.js';
import { ExportProcessor } from './ExportProcessor.js';
/**
 * An element to handle data export for ARC.
 *
 * @customElement
 * @memberof LogicElements
 */
export class ArcDataExport extends HTMLElement {
  static get observedAttributes() {
    return [
      'appversion', 'electroncookies'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'appversion': this.appVersion = newValue; break;
      case 'electroncookies': this.electronCookies = newValue; break;
    }
  }
  /**
   * @return {String} Hosting application version number. If not set it sends `app-version`
   * custom event to query for the application version number.
   */
  get appVersion() {
    return this._appVersion;
  }

  set appVersion(value) {
    const old = this._appVersion;
    if (old === value) {
      return;
    }
    value = String(value);
    this._appVersion = value;
    if (this.getAttribute('appversion') !== value) {
      this.setAttribute('appversion', value);
    }
  }
  /**
   * @return {Boolean} If set it uses arc electron session state module to read cookie data
   */
  get electronCookies() {
    return this._electronCookies;
  }

  set electronCookies(value) {
    if (value === null || value === false || value === undefined) {
      value = false;
    } else {
      value = true;
    }
    const old = this._electronCookies;
    if (old === value) {
      return;
    }
    this._electronCookies = value;
    if (value) {
      if (!this.hasAttribute('electroncookies')) {
        this.setAttribute('electroncookies', '');
      }
    } else {
      if (this.hasAttribute('electroncookies')) {
        this.removeAttribute('electroncookies');
      }
    }
  }

  constructor() {
    super();
    this._exportHandler = this._exportHandler.bind(this);
    this._arcExportHandler = this._arcExportHandler.bind(this);
    /**
     * A size of datastore read operation in one call.
     */
    this.dbChunk = 1000;
  }

  connectedCallback() {
    window.addEventListener('export-data', this._exportHandler);
    window.addEventListener('arc-data-export', this._arcExportHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('export-data', this._exportHandler);
    window.removeEventListener('arc-data-export', this._arcExportHandler);
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

  async dataExport(opts) {
    const file = opts.file || 'arc-data-export.json';
    const destination = opts.destination;
    let data = opts.data;
    if (opts.encrypt) {
      data = await this._encryptFile(data, opts.passphrase);
    }
    switch (destination) {
      case 'file': return this._exportFile(data, file, opts.providerOptions);
      case 'drive': return this._exportDrive(data, file, opts.providerOptions);
      default: return Promise.reject(new Error(`Unknown destination ${destination}`));
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
  async arcExport(detail) {
    let { data, options, providerOptions } = detail;
    if (!options) {
      throw new Error('The "options" property is not set.');
    }
    if (!options.provider) {
      throw new Error('The "options.provider" property is not set.');
    }
    if (!options.file) {
      throw new Error('The "options.file" property is not set.');
    }
    const exportData = await this._getExportData(data);
    let payload = JSON.stringify(this.createExportObject(exportData, options));
    if (!providerOptions) {
      providerOptions = {};
    }
    providerOptions.contentType = 'application/restclient+data';
    if (options.encrypt) {
      payload = await this._encryptFile(payload, options.passphrase);
    }
    switch (options.provider) {
      case 'file': return await this._exportFile(payload, options.file, providerOptions);
      case 'drive': return await this._exportDrive(payload, options.file, providerOptions);
      default: throw new Error(`Unknown destination ${options.provider}`);
    }
  }
  /**
   * Creates an input data structure from datastore for further processing.
   * @param {Object} data A map of datastores to export.
   * The key is the export name (defined in `export-panel`). The value is either
   * a boolean value which fetches all entries from the data store, or a list of
   * objects to export (no datastore query is made).
   * @return {Promise}
   */
  async _getExportData(data) {
    const dataKeys = Object.keys(data);
    const exportData = {};
    for (let i = 0, len = dataKeys.length; i < len; i++) {
      const key = dataKeys[i];
      const value = data[key];
      if (typeof value === 'boolean' && value) {
        if (key === 'cookies' && this.electronCookies) {
          exportData[key] = await this._queryCookies();
        } else if (key === 'client-certificates') {
          exportData[key] = await this._getClientCertificatesEntries();
        } else {
          const dbName = this._getDatabaseName(key);
          const exportKey = this._getExportKeyName(key);
          exportData[exportKey] = await this._getDatabaseEntries(dbName);
          if (key === 'saved') {
            exportData.projects = await this._getDatabaseEntries('legacy-projects');
          }
        }
      } else if (value instanceof Array) {
        exportData[key] = this._copyObjectArray(value);
      }
    }
    // client certificates support
    if (exportData.saved) {
      exportData.saved = await this._processRequestsArray(exportData.saved, exportData);
    }
    if (exportData.history) {
      exportData.history = await this._processRequestsArray(exportData.history, exportData);
    }
    return exportData;
  }
  /**
   * Creates a shallow copy of each object in the array.
   *
   * @param {Array<Object>} arr The array to copy
   * @return {Array<Object>}
   */
  _copyObjectArray(arr) {
    return arr.map((item) => Object.assign({}, item));
  }

  /**
   * Maps export key from the event to database name.
   * @param {String} key Export data type name from the event.
   * @return {String} Database name
   */
  _getDatabaseName(key) {
    switch (key) {
      case 'history': return 'history-requests';
      case 'saved': return 'saved-requests';
      case 'websocket': return 'websocket-url-history';
      case 'auth': return 'auth-data';
      default: return key;
    }
  }
  /**
   * Maps export key from the event to export object proeprty name.
   * @param {String} key Export data type name from the event.
   * @return {String} Export property name.
   */
  _getExportKeyName(key) {
    switch (key) {
      case 'saved': return 'requests';
      case 'websocket': return 'websocket-url-history';
      case 'auth': return 'auth-data';
      default: return key;
    }
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

    const processor = new ExportProcessor();
    return processor.createExportObject(data, options);
  }
  /**
   * A function used with `electronCookies` flag.
   * It queries `electron-session-state` node module for cookies instead of
   * the database.
   * @return {Promise}
   */
  async _queryCookies() {
    const e = this._dispatchCookieList();
    if (!e.defaultPrevented) {
      return [];
    }
    return await e.detail.result;
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
   * Safely reads a datastore entry. It returns undefined if the entry does not exist.
   *
   * @param {String} dbName Name of the datastore to get the data from.
   * @param {String} id The id of the entry
   * @return {Promise} Resolved promise to the document or undefined.
   */
  async _getDatabaseEntry(dbName, id) {
    /* global PouchDB */
    const db = new PouchDB(dbName);
    try {
      return await db.get(id);
    } catch (e) {
      // ...
    }
  }
  /**
   * Returns all data from a database.
   *
   * @param {String} dbName Name of the datastore to get the data from.
   * @return {Promise} Resolved promise to array of objects. It always
   * resolves.
   */
  async _getDatabaseEntries(dbName) {
    const options = {
      limit: this.dbChunk,
      include_docs: true
    };
    const db = new PouchDB(dbName);
    let result = [];
    let hasMore = true;
    do {
      const data = await this._fetchEntriesPage(db, options);
      if (data) {
        result = result.concat(data);
        if (data.length < this.dbChunk) {
          // prohibits additional DB fetch when it's clear that there's no
          // more results.
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } while(hasMore);
    return result;
  }
  /**
   * Fetches a single page of results from the database.
   * @param {Object} db PouchDB instance
   * @param {Object} options Fetch options. This object is altered during fetch.
   * @return {Promise} Promise resolved to the list of documents.
   */
  async _fetchEntriesPage(db, options) {
    try {
      const response = await db.allDocs(options);
      if (response.rows && response.rows.length > 0) {
        /* eslint-disable require-atomic-updates */
        options.startkey = response.rows[response.rows.length - 1].id;
        options.skip = 1;
        return response.rows.map((item) => item.doc);
      }
    } catch (e) {
      // ..
    }
  }

  async _getClientCertificatesEntries() {
    const index = await this._getDatabaseEntries('client-certificates');
    if (!index.length) {
      return;
    }
    const data = await this._getDatabaseEntries('client-certificates-data');
    const result = [];
    for (let i = 0, len = index.length; i < len; i++) {
      const item = index[i];
      let dataItem;
      const { dataKey } = item;
      for (let j = 0, jLen = data.length; j < jLen; j++) {
        if (data[j]._id === dataKey) {
          dataItem = data[j];
          data.splice(j, 1);
          break;
        }
      }
      if (dataItem) {
        result[result.length] = [item, dataItem];
      }
    }
    return result;
  }
  /**
   * Requests application to export data to file.
   *
   * @param {Object|String} data Data to export
   * @param {String} file File name
   * @param {Object} options Provider options
   * @return {Promise}
   */
  async _exportFile(data, file, options) {
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
      throw new Error('File export module not found.');
    }
    return await e.detail.result;
  }
  /**
   * Requests application to export data to Google Drive.
   *
   * @param {Object|String} data Data to export
   * @param {String} file File name
   * @param {Object} options Provider options
   * @return {Promise}
   */
  async _exportDrive(data, file, options) {
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
      throw new Error('Google Drive export module not found.');
    }
    return await e.detail.result;
  }
  /**
   * Dispatches `encryption-encode` and await for the result.
   * @param {String} data Data to encode
   * @param {String} passphrase Passphrase to use to encode the data
   * @return {Promise} Encoded data.
   */
  async _encryptFile(data, passphrase) {
    if (typeof passphrase !== 'string') {
      throw new Error('Encryption passphrase needs to be a string.');
    }
    const e = new CustomEvent('encryption-encode', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        data,
        passphrase,
        method: 'aes'
      }
    });
    this.dispatchEvent(e);
    let encoded = await e.detail.result;
    if (encoded) {
      encoded = `aes\n${encoded}`;
      return encoded;
    }
    return data;
  }
  /**
   * Processes request data for required export properties after the data
   * has been received from the data store but before creating export object.
   *
   * @param {Array<Object>} requests A list of requests to process
   * @param {Object} exportData The reference to generated export object
   * @return {Promise<Array<Object>>} Promise resolved to altered list of requests.
   */
  async _processRequestsArray(requests, exportData) {
    for (let i = 0, len = requests.length; i < len; i++) {
      const request = requests[i];
      const { auth={}, authType } = request;
      if (!auth || authType !== 'client certificate') {
        continue;
      }
      await this._addClientCertificate(auth, exportData);
    }
    return requests;
  }
  /**
   * Dispatches `client-certificate-get` to read certificate data from
   * `@advanced-rest-client/arc-models`.
   *
   * It adds a certificate object to the export list if the request contains
   * client certificate authorization and a valid certificate.
   * This does not change the request object. Import processor has to associate
   * the `id` from the `auth` object with exported certificates.
   *
   * @param {Object} auth Client certificates authorization configuration
   * @param {Object} exportData The reference to generated export object
   * @return {Promise}
   */
  async _addClientCertificate(auth, exportData) {
    const { id } = auth;
    if (!id) {
      return;
    }
    if (Array.isArray(exportData['client-certificates'])) {
      const cert = exportData['client-certificates'].find(([item]) => item._id === id);
      if (cert) {
        return;
      }
    }
    const index = await this._getDatabaseEntry('client-certificates', id);
    if (!index) {
      delete auth.id;
      return;
    }
    const data = await this._getDatabaseEntry('client-certificates-data', index.dataKey);
    if (!data) {
      delete auth.id;
      return;
    }
    if (!exportData['client-certificates']) {
      exportData['client-certificates'] = [];
    }
    exportData['client-certificates'].push([index, data]);
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

  /**
   * Dispatched when file encryption was requested
   *
   * @event encryption-encode
   * @param {String} data The data to encode.
   * @param {String} passphrase Passphrase to use to encode the data
   * @param {String} method Encryption method. Set to `aes`.
   */

  /**
   * @event client-certificate-get
   * @param {String} id
   */
}
