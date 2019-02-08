/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/tools/tree/master/packages/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   workers/data-processing.js
 */


// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

/**
 * global self
 */
declare class ExportProcessor {

  /**
   * Creates an export object for the data.
   *
   * @param data Export options. Available keys:
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
   * @param options Export configuration object
   * @returns ARC export object declaration.
   */
  createExportObject(data: object|null, options: object|null): object|null;
  _prepareRequestsList(requests: any): any;
  _prepareProjectsList(projects: any): any;
  _prepareHistoryDataList(history: any): any;
  _prepareWsUrlHistoryData(history: any): any;
  _prepareUrlHistoryData(history: any): any;
  _prepareVariablesData(variables: any): any;
  _prepareAuthData(authData: any): any;
  _prepareCookieData(authData: any): any;
  _prepareHostRulesData(hostRules: any): any;
}
