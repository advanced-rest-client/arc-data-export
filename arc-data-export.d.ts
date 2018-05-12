/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   arc-data-export.html
 */

/// <reference path="../polymer/types/polymer-element.d.ts" />
/// <reference path="../app-pouchdb/pouchdb.d.ts" />

declare namespace LogicElements {

  /**
   * An element to handle data export preparation for ARC.
   *
   * It gets requested data from the datastore and creates an export object or accept
   * external data to create export object.
   *
   * It does not include any logic related to actual data export (to file or
   * to drive) as implementation may be different depending on the plaform.
   *
   * ## Event based API
   *
   * The element supports event based API. When adding the element anywhere to the DOM
   * it attaches event listeners on the `window` object.
   *
   * All events are canceled and the propagation is stopped.
   *
   * ### `export-project` event
   *
   * Creates an export object and fires `export-data` to export generated data.
   *
   * #### Properties
   *
   * -   **project** (Object, required) Project object to export.
   * -   **requests** (Array, required) Requests list to export.
   * -   **variables** (Array, optional) List of variables to add to export.
   *
   * #### event.detail.result
   *
   * Object, export object
   *
   * #### Example
   *
   * ```javascript
   * const e = new CustomEvent('export-project', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      project: {...},
   *      requests: [...]
   *    }
   * });
   * document.body.dispatchEvent(e);
   * if (e.defaultPrevented) {
   *    console.log(e.detail.result);
   * }
   * ```
   *
   * ### `export-request` event
   *
   * Creates an export object for a single request and fires `export-data` to export
   * generated data.
   *
   * #### Properties
   *
   * -   **request** (Object, required) Requests to export.
   * -   **variables** (Array, optional) List of variables to add to export.
   *
   * #### event.detail.result
   *
   * Object, export object
   *
   * #### Example
   *
   * ```javascript
   * var event = new CustomEvent('export-request', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      request: {...},
   *      variables: [...] // This is optional
   *    }
   *  });
   *  document.body.dispatchEvent(event);
   *  if (event.defaultPrevented) {
   *    console.log(event.detail.result);
   *  }
   * ```
   *
   * ### `export-requests` event
   *
   * Creates an export object for a single request and fires `export-data` to export
   * generated data.
   *
   * #### Properties
   *
   * -   **requests** (Array, required) List of requests to export.
   * -   **variables** (Array, optional) List of variables to add to export.
   *
   * #### event.detail.result
   *
   * Object, export object
   *
   * #### Example
   *
   * ```javascript
   * var event = new CustomEvent('export-requests', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      requests: [{...}],
   *      variables: [...] // This is optional
   *    }
   *  });
   *  document.body.dispatchEvent(event);
   *  if (event.defaultPrevented) {
   *    console.log(event.detail.result);
   *  }
   * ```
   *
   * ### `export-create-object` event
   *
   * Similar to events described above but creates an export object for
   * any supported export data.
   *
   * Required `types` property on the `detail` object is a map od data to be exported.
   * Supported keys are:
   *
   * -   `requests` (Array) List of requests to export
   * -   `projects` (Array) List of projects to export
   * -   `history` (Array) List of history requests to export
   * -   `websocket-url-history` (Array) List of url history object for WS to export
   * -   `url-history` (Array) List of URL history objects to export
   * -   `variables` (Array) List of variables to export
   * -   `headers-sets` (Array) List of the headers sets objects to export
   * -   `auth-data` (Array) List of the auth data objects to export
   * -   `cookies` (Array) List of cookies to export
   *
   * #### Properties
   *
   * -   **types** (Object, required) List of requests to export.
   * -   **kind** (String, optional) The `kind` property of the top export declaration. Default to `ARC#AllDataExport`
   *
   * #### event.detail.result
   *
   * Object, export object
   *
   * #### Example
   *
   * ```javascript
   * cont e = new CustomEvent('export-create-object', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      types: {
   *        requests: [{...}],
   *        projects: [{...}],
   *        ...
   *      },
   *      kind: 'any-value'
   *    }
   *  });
   *  document.body.dispatchEvent(e);
   *  if (e.defaultPrevented) {
   *    console.log(e.detail.result);
   *  }
   *  ```
   *
   * ### `export-user-data` event
   *
   * Gets user data from the datastore and creates an export object. Fires the
   * `export-data` event when the data are ready to be exported.
   *
   * Required `type` property on the `detail` object is a name of the data type
   * or list of names of data types to export. Supported values are:
   *
   * -   `saved` To export list of saved requests with projects
   * -   `history` To export list of history requests
   * -   `websocket` To export list of websocket URL history
   * -   `history-url` To export list of requests URL history
   * -   `variables` To export list of all variables`
   * -   `headers-sets` To export list of variables sets
   * -   `auth` To export authorization data stored for the requests
   * -   `cookies` (Array) To export all cookies data
   *
   * Special value of `all` exports all stored in local datastore data.
   *
   * #### Properties
   *
   * -   **type** (String or Array of String, required) A data type name or list of data type names
   * -   **noExport** (Boolean, optional) If set it will not send `export-data` event.
   * -   **file** (String, optional) Suggested file name in the save file dialog.
   *
   * #### event.detail.result
   *
   * Promise, Resolved promise to export result object of the underlying export
   * module (file, Drive).
   *
   * #### Example
   *
   * ```javascript
   * const e = new CustomEvent('export-user-data', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      type: ['request', 'history'], // or type: 'all'
   *      destination: 'file',
   *      file: 'arc-data-export.arc'
   *    }
   *  });
   *  document.body.dispatchEvent(e);
   *  if (e.defaultPrevented) {
   *    e.detail.result.then((data) => console.log(data));
   * }
   * ```
   *
   * ### `export-data-prepare` event
   *
   * Prepares data to export as with `export-user-data` event but does not trigger
   * export event.
   *
   * #### Properties
   *
   * -   **type** See `export-user-data` for details
   *
   * #### event.detail.result
   *
   * Promise, Resolved promise to the export object
   *
   * #### Example
   *
   * ```javascript
   * const e = new CustomEvent('export-data-prepare', {
   *    cancelable: true,
   *    composed: true,
   *    bubbles: true,
   *    detail: {
   *      type: ['all']
   *    }
   *  });
   *  document.body.dispatchEvent(e);
   *  if (e.defaultPrevented) {
   *    e.detail.result.then((data) => console.log(data));
   * }
   * ```
   *
   * ## Changes in version 2
   * - `export-data` event renamed to `export-file`
   * - `google-drive-data-save` event renamed to `export-google-drive`
   * - `export-user-data` event handler sets export data resutls (from a module
   * that handles export) and not the actual data. Use `export-data-prepare`
   * and corresponding module event instead.
   */
  class ArcDataExport extends Polymer.Element {

    /**
     * Hosting application version number. If not set it sends `app-version`
     * custom event to query for the application version number.
     */
    appVersion: string|null|undefined;

    /**
     * A size of datastore read operation in one call.
     */
    dbChunk: number|null|undefined;
    connectedCallback(): void;
    disconnectedCallback(): void;

    /**
     * Fires `app-version` to ask the hosting app for its version number.
     * The hosting application should handle this event by setting
     * `version` property on event's `detail` object.
     */
    queryAppVersion(): any;

    /**
     * Creates an export object for the data.
     *
     * @param opts Export options. Available keys:
     * -   `requests` (Array) List of requests to export
     * -   `projects` (Array) List of projects to export
     * -   `history` (Array) List of history requests to export
     * -   `websocket-url-history` (Array) List of url history object for WS to export
     * -   `url-history` (Array) List of URL history objects to export
     * -   `variables` (Array) List of variables to export
     * -   `headers-sets` (Array) List of the headers sets objects to export
     * -   `auth-data` (Array) List of the auth data objects to export
     * -   `cookies` (Array) List of cookies to export
     * -   `kind` (String) The `kind` property of the top export declaration.
     *      Default to `ARC#AllDataExport`
     * @returns ARC export object declaration.
     */
    createExportObject(opts: object|null): object|null;
    _prepareRequestsList(requests: any): any;
    _prepareProjectsList(projects: any): any;
    _prepareHistoryDataList(history: any): any;
    _prepareWsUrlHistoryData(history: any): any;
    _prepareUrlHistoryData(history: any): any;
    _prepareVariablesData(variables: any): any;
    _prepareHeadersSetsData(sets: any): any;
    _prepareAuthData(authData: any): any;
    _prepareCookieData(authData: any): any;
    _prepareHostRulesData(hostRules: any): any;

    /**
     * Checks if `type` is one of the allowed export types defined in
     * `exportType`.
     *
     * @param exportType Export type name or list of export types
     * names allowed to be exported.
     * @param type An export type to test
     * @returns True if the `type` is allowed
     */
    _isAllowedExport(exportType: String|any[]|null, type: String|null): Boolean|null;

    /**
     * Creats a map of database name <--> export object key name mapping.
     *
     * @param type Name of the database or list of databases names
     * to export
     * @returns A map where keys are database name and values are
     * export object properties where the data will be put.
     */
    _getDatabasesInfo(type: String|any[]|null): object|null;

    /**
     * Prepares an export object from requested databases.
     *
     * @param opts An object with required `type` property. See
     * `_getDatabasesInfo(type)` for description.
     * @returns Resolved promise to ARC export object with all data
     * from requested databases.
     */
    prepareExport(opts: object|null): Promise<any>|null;

    /**
     * Returns all data from a database.
     *
     * @param dbName Name of the datastore t get the data from.
     * @returns Resolved promise to array of objects. It always
     * resolves.
     */
    _getDatabaseEntries(dbName: String|null): Promise<any>|null;

    /**
     * Handler for the `export-project` custom event. Creates the export
     * object from the passed project and request list data in the event detail
     * object. It adds the `result` property to the `detail` object with the
     * export data. Also it sends `export-data` custom event to inform
     * application to export the data.
     */
    _projectExportHandler(e: any): void;

    /**
     * Handler for the `export-requests` custom event. Creates the export
     * object from the passed request list data in the event detail
     * object. It adds the `result` property to the `detail` object with the
     * export data. Also it sends `export-data` custom event to inform
     * application to export the data.
     */
    _requestsExportHandler(e: any): void;

    /**
     * Exports a single request. Creates an export object for a single request
     * with relevant settings.
     */
    _requestExportHandler(e: any): void;

    /**
     * Handler for the `export-create-object` event.
     * It requires the `types` object to be set on the `detail` object.
     * Description of the object structure is at `createExportObject(opts)`.
     *
     * The hander cancels the event and stops its propagation.
     */
    _createObjectHandler(e: any): void;

    /**
     * Handler for `export-data-prepare` custom event.
     */
    _prepareDataHandler(e: CustomEvent|null): void;

    /**
     * Handler for the `export-user-data` event.
     * It requires the `type` property to be set on the `detail` object.
     * See description of `prepareExport(opts)` for more info.
     *
     * The hander cancels the event and stops its propagation.
     */
    _exportDataHandler(e: CustomEvent|null): void;

    /**
     * Sends export event depending on `destination`
     *
     * @param data Data to be exported.
     * @param filename Export file name
     * @param destination Export destination. `file` or `drive` is
     * supported. Default to file.
     * @returns A promise resolved when data are expored.
     */
    _sendExport(data: object|String|null, filename: String|null, destination: String|null): Promise<any>|null;

    /**
     * Requests application to export data to file.
     *
     * @param data Data to export
     * @param file File name
     */
    _exportFile(data: object|String|null, file: String|null): any;

    /**
     * Requests application to export data to Google Drive.
     *
     * @param data Data to export
     * @param file File name
     */
    _exportDrive(data: object|String|null, file: String|null): any;
  }
}

interface HTMLElementTagNameMap {
  "arc-data-export": LogicElements.ArcDataExport;
}
