/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

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
import { LitElement } from 'lit-element';
import {
  EncryptionEvents,
  ProcessEvents,
  DataImportEventTypes,
  ImportEvents,
  WorkspaceEvents,
  RestApiEvents,
} from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { ImportDataStore } from './lib/ImportDataStore.js';
import { ArcLegacyTransformer } from './transformers/ArcLegacyTransformer.js';
import { ArcDexieTransformer } from './transformers/ArcDexieTransformer.js';
import { ArcPouchTransformer } from './transformers/ArcPouchTransformer.js';
import { PostmanDataTransformer } from './transformers/PostmanDataTransformer.js';
import {
  isSingleRequest,
  isPostman,
  isArcFile,
  prepareImportObject,
  readFile,
} from './Utils.js';

/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportNormalizeEvent} ArcImportNormalizeEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportEvent} ArcImportEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportFileEvent} ArcImportFileEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcImportDataEvent} ArcImportDataEvent */
/** @typedef {import('@advanced-rest-client/arc-events').FileImportOptions} FileImportOptions */
/** @typedef {import('@advanced-rest-client/arc-models').IndexableRequest} IndexableRequest */

export const notifyIndexer = Symbol('notifyIndexer');
export const normalizeHandler = Symbol('normalizeHandler');
export const importHandler = Symbol('importHandler');
export const processFileHandler = Symbol('processFileHandler');
export const processDataHandler = Symbol('processDataHandler');
export const decryptIfNeeded = Symbol('decryptIfNeeded');
export const notifyApiParser = Symbol('notifyApiParser');

/**
 * An element that imports data into the ARC datastore.
 *
 * Supported data import types:
 *
 * -   legacy (the first one) ARC data system
 * -   legacy Dexie and HAR based data system
 * -   current ARC export object
 * -   Postman data export
 *
 * To import data it must be first normalized by calling `normalizeImportData`
 * function. It creates datastore objects that are resdy to be inserted into the
 * datastore.
 *
 * Objects that are missing IDs will be assigned a new ID. Because of that data
 * duplication may occur.
 * Request objects will generate the same ID unless the request is assigned to a
 * project and project has new ID generated.
 *
 * Conflicts are resolved by replacing existing data with new one.
 *
 * ### Example
 *
 * ```javascript
 * const importer = document.querySelector('arc-data-import');
 * const data = await getFileContent();
 * data = await importer.normalizeImportData();
 * const errors = await importer.storeData(data);
 * if (errors && errors.length) {
 *    console.log(errors);
 * }
 * ```
 *
 * ## Changes in version 2.x
 * - The component no longer includes PouchDB. Use your own version of the
 * library from Bower, npm, csd etc.
 */
export class ArcDataImportElement extends LitElement {
  constructor() {
    super();
    this[normalizeHandler] = this[normalizeHandler].bind(this);
    this[importHandler] = this[importHandler].bind(this);
    // A handler for when a file is selected
    this[processFileHandler] = this[processFileHandler].bind(this);
    // A case when JSON file is already parsed and is ready to be processed.
    this[processDataHandler] = this[processDataHandler].bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener(DataImportEventTypes.normalize, this[normalizeHandler]);
    window.addEventListener(DataImportEventTypes.dataimport, this[importHandler]);
    window.addEventListener(DataImportEventTypes.processfile, this[processFileHandler]);
    window.addEventListener(DataImportEventTypes.processdata, this[processDataHandler]);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    window.removeEventListener(DataImportEventTypes.normalize, this[normalizeHandler]);
    window.removeEventListener(DataImportEventTypes.dataimport, this[importHandler]);
    window.removeEventListener(DataImportEventTypes.processfile, this[processFileHandler]);
    window.removeEventListener(DataImportEventTypes.processdata, this[processDataHandler]);
  }

  /**
   * Handler for the `import-normalize`cutom event.
   * It sets `result` property on the event's detail object which is the result
   * of calling `normalizeImportData` function call.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   *
   * @param {ArcImportNormalizeEvent} e
   */
  [normalizeHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(new Error('The data property was not set'));
      return;
    }
    e.detail.result = this.normalizeImportData(data);
  }

  /**
   * Handler for the `import-data` cutom event.
   * It sets `result` property on the event's detail object which is a result
   * of calling `storeData` function.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   *
   * @param {ArcImportEvent} e
   */
  [importHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(
        new Error('The "data" property was not set')
      );
      return;
    }
    e.detail.result = this.storeData(data);
  }

  /**
   * Handles file import event dispatched by the UI.
   * @param {ArcImportFileEvent} e
   */
  [processFileHandler](e) {
    if (!e || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { file, options } = e;
    if (!file) {
      e.detail.result = Promise.reject(
        new Error('The "file" property was not set')
      );
      return;
    }
    e.detail.result = this.processFileData(file, options);
  }

  /**
   * @param {ArcImportDataEvent} e
   */
  [processDataHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(
        new Error('The "data" property was not set')
      );
      return;
    }
    e.detail.result = this.processData(data);
  }

  /**
   * Normalizes passed data to the import object and processes the import.
   *
   * @param {string|object} data The data to normalize and import
   * @return {Promise<void>} A promiose resolved when the data was processed.
   */
  async processData(data) {
    const normalized = await this.normalizeImportData(data);
    await this.handleNormalizedFileData(normalized);
  }

  /**
   * Stores import data in the datastore.
   * It must be normalized by `normalizeImportData` first or it returns an
   * error.
   *
   * @param {ArcExportObject} importObject ARC import data
   * @return {Promise<string[]|undefined>} Resolved promise to list of errors or `undefined`
   * if error were not reported.
   */
  async storeData(importObject) {
    if (!importObject) {
      throw new Error('Missing required argument.');
    }
    if (!importObject.kind || importObject.kind !== 'ARC#Import') {
      throw new Error('Data not normalized for import.');
    }
    const store = new ImportDataStore();
    const result = await store.importData(importObject);
    const { savedIndexes, historyIndexes } = store;
    setTimeout(() => {
      this[notifyIndexer](savedIndexes, historyIndexes);
      ImportEvents.dataimported(this);
    });
    return result;
  }

  /**
   * Dispatches `url-index-update` event handled by `arc-models/url-indexer`.
   * It will index URL data for search function.
   * @param {IndexableRequest[]} saved List of saved requests indexes
   * @param {IndexableRequest[]} history List of history requests indexes
   */
  [notifyIndexer](saved, history) {
    let indexes = [];
    if (saved) {
      indexes = indexes.concat(saved);
    }
    if (history) {
      indexes = indexes.concat(history);
    }
    if (!indexes.length) {
      return;
    }
    ArcModelEvents.UrlIndexer.update(this, indexes);
  }

  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * @param {string|object} data Data from the import file.
   * @return {Promise<ArcExportObject>} Normalized data import object.
   */
  async normalizeImportData(data) {
    if (typeof data === 'string') {
      data = await this[decryptIfNeeded](data);
    }
    data = prepareImportObject(data);
    if (isPostman(data)) {
      return this.normalizePostmap(data);
    }
    if (isArcFile(data)) {
      return this.normalizeArcData(data);
    }
    throw new Error('File not recognized');
  }

  /**
   * Normalizes any previous and current ARC file expot data to common model.
   *
   * @param {object} data Imported data.
   * @return {Promise<ArcExportObject>} A promise resolved to ARC data export object.
   */
  async normalizeArcData(data) {
    switch (data.kind) {
      case 'ARC#SavedHistoryDataExport':
      case 'ARC#AllDataExport':
      case 'ARC#SavedDataExport':
      case 'ARC#SavedExport':
      case 'ARC#HistoryDataExport':
      case 'ARC#HistoryExport':
      case 'ARC#Project':
      case 'ARC#SessionCookies':
      case 'ARC#HostRules':
      case 'ARC#ProjectExport':
        return this.normalizeArcPouchSystem(data);
      case 'ARC#requestsDataExport':
        return this.normalizeArcDexieSystem(data);
      default:
        return this.normalizeArcLegacyData(data);
    }
  }

  /**
   * Normalizes export data from the GWT system.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcLegacyData(data) {
    const transformer = new ArcLegacyTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes export data from Dexie powered data store.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcDexieSystem(data) {
    const transformer = new ArcDexieTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes ARC's data exported in PouchDB system
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcPouchSystem(data) {
    const transformer = new ArcPouchTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes Postman data into ARC's data model.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizePostmap(data) {
    const transformer = new PostmanDataTransformer();
    return transformer.transform(data);
  }

  /**
   * Processes import file data.
   * It tests if the file is API data or ARC/Postan dump.
   * If it is an API definition (zip file or actuall API file) then it
   * dispatches a custom event handled by the API processing factory.
   * Otherwise it tries to import file data.
   *
   * @param {File|Uint8Array|Buffer} file User file from the web or electron environment.
   * @param {FileImportOptions=} opts Additional options. `driveId` is only supported.
   * @return {Promise}
   */
  async processFileData(file, opts) {
    const apiTypes = [
      'application/zip',
      'application/yaml',
      'application/x-yaml',
      'application/raml',
      'application/x-raml',
      'application/x-zip-compressed',
    ];
    const typedFile = /** @type File */ (file);
    const isFile = !(file instanceof Uint8Array);

    if (isFile && apiTypes.indexOf(typedFile.type) !== -1) {
      return this[notifyApiParser](typedFile);
    }

    // RAML files
    if (isFile && typedFile.name &&
      (typedFile.name.indexOf('.raml') !== -1 ||
        typedFile.name.indexOf('.yaml') !== -1 ||
        typedFile.name.indexOf('.zip') !== -1)
    ) {
      return this[notifyApiParser](typedFile);
    }

    const id = new Date().toISOString();
    ProcessEvents.loadingstart(this, id, 'Procerssing file data');
    let content;
    if (!isFile) {
      content = file.toString();
    } else {
      content = await readFile(typedFile);
    }
    content = content.trim();
    content = await this[decryptIfNeeded](content);
    if (content[0] === '#' && content.indexOf('#%RAML') === 0) {
      return this[notifyApiParser](typedFile);
    }
    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      ProcessEvents.loadingstop(this, id);
      throw new Error('Unknown file format');
    }
    if (data.swagger) {
      ProcessEvents.loadingstop(this, id);
      return this[notifyApiParser](typedFile);
    }
    const importData = await this.normalizeImportData(data);
    ProcessEvents.loadingstop(this, id);
    return this.handleNormalizedFileData(importData, opts);
  }

  /**
   * Processes normalized file import data.
   * When it is a single request object it dispatches `request-workspace-append`
   * event to apped request to the workspace. Otherwise it dispatches
   * `import-data-inspect` custom event.
   * @param {ArcExportObject} data Normalized data
   * @param {FileImportOptions=} opts Additional options. `driveId` is only supported.
   * @return {ArcExportObject} passed data
   */
  handleNormalizedFileData(data, opts) {
    if (!data) {
      throw new Error('File has no import data');
    }
    if (isSingleRequest(data)) {
      const obj = data.requests[0];
      if (opts && opts.driveId) {
        obj.driveId = opts.driveId;
      }
      delete obj.kind;
      obj._id = obj.key;
      delete obj.key;
      WorkspaceEvents.appendrequest(this, obj);
    } else if (data.loadToWorkspace) {
      WorkspaceEvents.appendexport(this, data);
    } else {
      ImportEvents.inspect(this, data);
    }
    return data;
  }

  /**
   * Dispatches `api-process-file` to parse API data usingseparate module.
   * In ARC electron it is `@advanced-rest-client/electron-amf-service`
   * node module. In other it might be other component.
   * @param {File} file User file.
   * @return {Promise<void>}
   */
  async [notifyApiParser](file) {
    const result = await RestApiEvents.processfile(this, file);
    if (!result) {
      throw new Error('API processor not available');
    }
    RestApiEvents.dataready(this, result.model, result.type);
  }

  /**
   * Processes incomming data and if encryption is detected then id processes
   * the file for decryption.
   *
   * @param {string} content File content
   * @return {Promise<string>} The content of the file.
   */
  async [decryptIfNeeded](content) {
    const headerIndex = content.indexOf('\n');
    const header = content.substr(0, headerIndex).trim();
    if (header === 'aes') {
      const data = content.substr(headerIndex + 1);
      content = await EncryptionEvents.decrypt(this, data, '', 'aes');
    }
    return content;
  }
}
