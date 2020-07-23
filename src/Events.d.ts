import { DataExport } from '@advanced-rest-client/arc-types';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcNativeDataExport} ArcNativeDataExport */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */

export const dataValue: symbol;
export const exportOptionsValue: symbol;
export const providerOptionsValue: symbol;
export const fileValue: symbol;
export const passphraseValue: symbol;
export const methodValue: symbol;

declare interface ResultEventDetail<T> {
  result?: Promise<T>;
}

/**
 * An event to be dispatched when requesting ARC native data export.
 */
export class ArcDataExportEvent extends CustomEvent<ResultEventDetail<DataExport.ArcExportResult>> {
  /**
   * The data to export
   */
  readonly data: DataExport.ArcNativeDataExport;

  /**
   * Export options
   */
  readonly exportOptions: DataExport.ExportOptions;

  /**
   * Options passed to the export provider
   */
  readonly providerOptions: DataExport.ProviderOptions;

  /**
   * @param data The data to export
   * @param exportOptions Export options
   * @param providerOptions Options passed to the export provider
   */
  constructor(data: DataExport.ArcNativeDataExport, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions);
}

/**
 * An event to be dispatched when requesting any data export
 */
export class ArcExportEvent extends CustomEvent<ResultEventDetail<DataExport.ArcExportResult>> {
  /**
   * The data to export
   */
  readonly data: any;

  /**
   * Export options
   */
  readonly exportOptions: DataExport.ExportOptions;

  /**
   * Options passed to the export provider
   */
  readonly providerOptions: DataExport.ProviderOptions;

  /**
   * @param data The data to export
   * @param exportOptions Export options
   * @param providerOptions Options passed to the export provider
   */
  constructor(data: any, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions);
}

/**
 * A base class for all events related to data store provides.
 * This includes `filesystem` and `google drive` file providers.
 */
export class ArcExportProviderEvent extends CustomEvent<ResultEventDetail<DataExport.ArcExportResult>> {
  /**
   * The data to export
   */
  readonly data: any;

  /**
   * Options passed to the export provider
   */
  readonly providerOptions: DataExport.ProviderOptions;

  /**
   * @param type Event type
   * @param data The data to export
   * @param providerOptions Options passed to the export provider
   */
  constructor(type: string, data: any, providerOptions: DataExport.ProviderOptions);
}

/**
 * An event to be dispatched to stored the data by the native filesystem provider.
 */
export class ArcExportFilesystemEvent extends ArcExportProviderEvent {
  /**
   * @param {ArcNativeDataExport} data The data to export
   * @param {ProviderOptions} providerOptions Options passed to the export provider
   */
  constructor(data: any, providerOptions: DataExport.ProviderOptions);
}

/**
 * An event to be dispatched to stored the data by the Google Drive provider.
 */
export class ArcExportGoogleDriveEvent extends ArcExportProviderEvent {
  /**
   * @param {ArcNativeDataExport} data The data to export
   * @param {ProviderOptions} providerOptions Options passed to the export provider
   */
  constructor(data: any, providerOptions: DataExport.ProviderOptions);
}

/**
 * An event to be dispatched when a data to be encrypted
 */
export class ArcEncryptEvent extends CustomEvent<ResultEventDetail<string>> {
  /**
   * The data to export
   */
  readonly data: any;
  /**
   * The passphrase to use in 2-way data encryption
   */
  readonly passphrase: string;
  /**
   * Encryption method to use
   */
  readonly method: string;

  /**
   * @param data The data to export
   * @param passphrase The passphrase to use in 2-way data encryption
   * @param method Encryption method to use
   */
  constructor(data: any, passphrase: string, method: string);
}

/**
 * Dispatches an event handled by the export factory to export ARC's native data.
 *
 * @param target A node on which to dispatch the event.
 * @param data The data to export
 * @param passphrase The passphrase to use in 2-way data encryption
 * @param method Encryption method to use
 * @returns Promise resolved to the encryption result
 */
export declare function encryptAction(target: EventTarget, data: any, passphrase: string, method: string): Promise<string>;

/**
 * Dispatches an event handled by the export factory to export ARC's native data.
 *
 * @param target A node on which to dispatch the event.
 * @param data The data to export
 * @param exportOptions Export options
 * @param providerOptions Options passed to the export provider
 * @returns Promise resolved to the export result
 */
export declare function nativeExportAction(target: EventTarget, data: DataExport.ArcNativeDataExport, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

/**
 * Dispatches an event handled by the export factory to export any data.
 *
 * @param target A node on which to dispatch the event.
 * @param data The data to export
 * @param exportOptions Export options
 * @param providerOptions Options passed to the export provider
 * @returns Promise resolved to the export result
 */
export declare function customDataExportAction(target: EventTarget, data: any, exportOptions: DataExport.ExportOptions, providerOptions: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

/**
 * Dispatches an event handled by the filesystem provider to store data on user's filesystem.
 *
 * @param target A node on which to dispatch the event.
 * @param data The data to export
 * @param options Options passed to the export provider
 * @returns Promise resolved to the export result
 */
export declare function storeFilesystemAction(target: EventTarget, data: any, options: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;

/**
 * Dispatches an event handled by the Google Drive provider to store data on the drive.
 *
 * @param target A node on which to dispatch the event.
 * @param data The data to export
 * @param options Options passed to the export provider
 * @returns Promise resolved to the export result
 */
export declare function storeGoogleDriveAction(target: EventTarget, data: any, options: DataExport.ProviderOptions): Promise<DataExport.ArcExportResult>;
