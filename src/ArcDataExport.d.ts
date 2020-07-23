import { DataExport } from '@advanced-rest-client/arc-types';

export const appVersionValue: symbol;
export const electronCookiesValue: symbol;
export const exportHandler: symbol;
export const nativeExportHandler: symbol;
export const exportFile: symbol;
export const exportDrive: symbol;
export const queryCookies: symbol;
export const encryptData: symbol;
export const getClientCertificatesEntries: symbol;

/**
 * An element to handle data export for ARC.
 */
export declare class ArcDataExport extends HTMLElement {
  appVersion?: string;
  electronCookies?: boolean;
  attributeChangedCallback(name: any, oldValue: any, newValue: any): void;

  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;

  /**
   * Exports any data with any of the export providers.
   * @param data The data to export
   * @param exportOptions Export options
   * @param providerOptions Options passed to the export provider
   * @returns Promise resolved to a result of saving a file.
   */
  dataExport(data: any, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

  /**
   * Generates and saves ARC export object from user data.
   * @param data The data to export
   * @param exportOptions Export options
   * @param providerOptions Options passed to the export provider
   * @returns Promise resolved to a result of saving a file.
   */
  arcExport(data: DataExport.ArcNativeDataExport, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

  /**
   * Creates an input data structure from datastore for further processing.
   * @param data A map of datastores to export.
   */
  getExportData(data: DataExport.ArcNativeDataExport): Promise<DataExport.ArcExportProcessedData[]>;

  /**
   * @param key THe key for the data
   * @param data A map of datastores to export.
   */
  prepareExportData(key: keyof DataExport.ArcNativeDataExport, data: DataExport.ArcNativeDataExport): Promise<DataExport.ArcExportProcessedData>;

  /**
   * Creates an export object for the data.
   *
   * @param data
   * @param options Export configuration object
   * @returns ARC export object declaration.
   */
  createExportObject(data: DataExport.ArcExportProcessedData[], options: DataExport.ExportOptions): DataExport.ArcExportObject;
}
