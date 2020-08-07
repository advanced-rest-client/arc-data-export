import { TemplateResult, LitElement } from 'lit-element';
import { IronFormElement } from '@polymer/iron-form';
import { DataExport, GoogleDrive } from '@advanced-rest-client/arc-types';

/** @typedef {import('@advanced-rest-client/arc-types').GoogleDrive.AppFolder} AppFolder */

export const destinationTemplate: unique symbol;
export const fileInputTemplate: unique symbol;
export const driveInputTemplate: unique symbol;
export const encyptionPasswordTemplate: unique symbol;
export const encryptionTemplate: unique symbol;
export const skipImportTemplate: unique symbol;
export const buildExportOptions: unique symbol;
export const buildProviderOptions: unique symbol;
export const formValue: unique symbol;
declare const isDriveChanged: unique symbol;
declare const listDriveFolders: unique symbol;
declare const driveFoldersChanged: unique symbol;
declare const inputHandler: unique symbol;
declare const destinationHandler: unique symbol;
declare const parentsInputHandler: unique symbol;
declare const checkedHandler: unique symbol;

export declare class ExportPanelBase extends LitElement {
  /**
   * Export file name.
   */
  file?: string;
  /**
   * The identifier of the parent. It can be a file path for local filesystem
   * or Google Drive folder name.
   */
  parentId?: string;
  /**
   * Export provider. By default it is `drive` or `file`.
   */
  provider?: string;
  /**
   * Tells the application to set configuration on the export file to
   * skip import and insert project directly into workspace.
   */
  skipImport?: boolean;
  /**
   * Computed value, true when current provider is Google Drive.
   */
  isDrive?: boolean;
  /**
   * List of Google Drive folders created by this application.
   */
  driveFolders?: GoogleDrive.AppFolder[]
  /**
   * Enables Anypoint compatibility
   */
  compatibility?: boolean;
  /**
   * Enables outlined theme.
   */
  outlined?: boolean;
  /**
   * When set the encrypt file option is enabled.
   */
  encryptFile?: boolean;
  /**
   * Encryption passphrase
   */
  passphrase?: string;
  /**
   * When set it renders encryption options.
   */
  withEncrypt?: boolean;

  /**
   * The `googledrivelistappfolders` event handler
   */
  ongoogledrivelistappfolders: EventListener;

  constructor();

  connectedCallback(): void;

  [formValue](): IronFormElement;

  [buildExportOptions](): DataExport.ExportOptions;

  [buildProviderOptions](): DataExport.ProviderOptions;

  /**
   * Called automatically when `isDrive` property change.
   * Dispatches `resize` custom event so parent elements can position this element
   * in e.g dialogs.
   */
  [isDriveChanged](): void;

  /**
   * Attempts to read application settings by dispatching `settings-read`
   * with type `google-drive`. It expects to return `appFolders` with a list
   * of folder created by the app. This value is set as a suggestions on
   * folder input.
   */
  [listDriveFolders](): Promise<void>;

  /**
   * Transforms AppFolder model into the suggestions value.
   *
   * @param folders List of application folders.
   */
  [driveFoldersChanged](folders: GoogleDrive.AppFolder[]): void;

  [inputHandler](e: CustomEvent): void;

  [parentsInputHandler](e: CustomEvent): void;

  [checkedHandler](e: CustomEvent): void;

  [destinationHandler](e: CustomEvent): void;

  [driveInputTemplate](): TemplateResult;

  [destinationTemplate](): TemplateResult;

  [skipImportTemplate](): TemplateResult;

  [encryptionTemplate](): TemplateResult;

  [encyptionPasswordTemplate](): TemplateResult;

  [fileInputTemplate](): TemplateResult;
}
