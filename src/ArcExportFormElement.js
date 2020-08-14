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
import { html } from 'lit-element';
import '@polymer/iron-form/iron-form.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '@polymer/paper-toast/paper-toast.js';
import {
  ExportEvents,
  DataExportEventTypes,
} from '@advanced-rest-client/arc-events';
import elementStyles from './styles/ExportForm.js';
import {
  ExportPanelBase,
  destinationTemplate,
  fileInputTemplate,
  driveInputTemplate,
  encryptionTemplate,
  skipImportTemplate,
  encyptionPasswordTemplate,
  buildExportOptions,
  buildProviderOptions,
} from './ExportPanelBase.js';
import { generateFileName } from './Utils.js';

/** @typedef {import('@anypoint-web-components/anypoint-checkbox').AnypointCheckbox} AnypointCheckbox */
/** @typedef {import('@advanced-rest-client/arc-types').GoogleDrive.AppFolder} AppFolder */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportResult} ArcExportResult */
/** @typedef {import('@polymer/paper-toast').PaperToastElement} PaperToastElement */

export const loadingProperty = Symbol('loadingProperty');
export const loadingValue = Symbol('loadingValue');
export const loadingChangeHandler = Symbol('loadingChangeHandler');
export const arcnativeexportHandler = Symbol('arcnativeexportHandler');
export const notifySuccess = Symbol('notifySuccess');
export const notifyError = Symbol('notifyError');
export const prepare = Symbol('prepare');

function exportItemsTemplate() {
  return html`
  <anypoint-checkbox name="authdata" checked>Saved passwords</anypoint-checkbox>
  <anypoint-checkbox name="clientcertificates" checked>Client certificates</anypoint-checkbox>
  <anypoint-checkbox name="cookies" checked>Cookies</anypoint-checkbox>
  <anypoint-checkbox name="history" checked>Requests history</anypoint-checkbox>
  <anypoint-checkbox name="hostrules" checked>Host rules</anypoint-checkbox>
  <anypoint-checkbox name="saved" checked>Projects and saved request list</anypoint-checkbox>
  <anypoint-checkbox name="variables" checked>Variables data</anypoint-checkbox>
  <anypoint-checkbox name="websocketurlhistory" checked>Web sockets history</anypoint-checkbox>
  <anypoint-checkbox name="urlhistory" checked>URL history</anypoint-checkbox>
  `;
}
/**
 * Export data form with export flow logic.
 *
 * Provides the UI and and logic to export data from the data store to `destination`
 * export method provider. It uses events API to communicate with other elements.
 *
 * Required elements to be present in the DOM:
 *
 * -   `arc-data-export` - getting data from the datastore
 * -   element that handles `file-data-save` event
 * -   element that handles `google-drive-data-save` event

 * ### Example
 *
 * ```html
 * <arc-data-export app-version="12.0.0" electron-cookies></arc-data-export>
 * <google-drive-upload></google-drive-upload>
 * <file-save></file-save>
 *
 * <export-panel></export-panel>
 * ```
 */
export class ArcExportFormElement extends ExportPanelBase {
  static get styles() {
    return elementStyles;
  }

  get loading() {
    return this[loadingProperty];
  }

  get [loadingProperty]() {
    return this[loadingValue];
  }

  set [loadingProperty](value) {
    const old = this[loadingValue];
    if (old === value) {
      return;
    }
    this[loadingValue] = value;
    this.requestUpdate('loading', old);
    this.dispatchEvent(new CustomEvent('loadingchange'));
  }

  /**
   * @return {EventListener} Previously registered handler for `loading-changed` event
   */
  get onloadingchange() {
    return this[loadingChangeHandler];
  }

  /**
   * Registers a callback function for `loading-changed` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onloadingchange(value) {
    if (this[loadingChangeHandler]) {
      this.removeEventListener('loadingchange', this[loadingChangeHandler]);
    }
    if (typeof value !== 'function') {
      this[loadingChangeHandler] = null;
      return;
    }
    this[loadingChangeHandler] = value;
    this.addEventListener('loadingchange', value);
  }

  /**
   * @return {EventListener} Previously registered handler for `arc-data-export` event
   */
  get onarcnativeexport() {
    return this[arcnativeexportHandler];
  }

  /**
   * Registers a callback function for `arc-data-export` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onarcnativeexport(value) {
    if (this[arcnativeexportHandler]) {
      this.removeEventListener(DataExportEventTypes.nativeData, this[arcnativeexportHandler]);
    }
    if (typeof value !== 'function') {
      this[arcnativeexportHandler] = null;
      return;
    }
    this[arcnativeexportHandler] = value;
    this.addEventListener(DataExportEventTypes.nativeData, value);
  }

  constructor() {
    super();
    this.file = generateFileName();
  }

  /**
   * Handler for click event. Calls `startExport()` function.
   */
  [prepare]() {
    this.startExport();
  }

  /**
   * Selects all items on the list.
   */
  selectAll() {
    const nodes = /** @type NodeListOf<AnypointCheckbox> */ (this.shadowRoot.querySelectorAll('form anypoint-checkbox'));
    Array.from(nodes).forEach((node) => {
      const option = /** @type AnypointCheckbox */ (node);
      option.checked = true;
    })
  }

  /**
   * Uses currend form data to start export flow.
   * This function is to expose public API to export data.
   *
   * @return {Promise<ArcExportResult>} A promise resolved when export finishes
   */
  async startExport() {
    const form = this.shadowRoot.querySelector('iron-form');
    const data = form.serializeForm();
    Object.keys(data).forEach((key) => {
      data[key] = true;
    });
    const exportOptions = this[buildExportOptions]();
    const providerOptions = this[buildProviderOptions]();
    this[loadingProperty] = true;
    try {
      if (!exportOptions.provider) {
        throw new Error('Export provider is not set');
      }
      if (exportOptions.encrypt && !exportOptions.passphrase) {
        throw new Error('The passphrase is required with encryption.');
      }
      if (!providerOptions.file) {
        throw new Error('The file name is required.');
      }
      const result = await ExportEvents.nativeData(this, data, exportOptions, providerOptions);
      this[notifySuccess]();
      this[loadingProperty] = false;
      return result;
    } catch (cause) {
      this[notifyError](cause.message);
      this[loadingProperty] = false;
      throw cause;
    }
  }

  [notifySuccess]() {
    const toast = /** @type PaperToastElement */ (this.shadowRoot.querySelector('#exportComplete'));
    toast.opened = true;
  }

  [notifyError](message) {
    const toast = /** @type PaperToastElement */ (this.shadowRoot.querySelector('#exportError'));
    toast.text = message;
    toast.opened = true;
  }

  render() {
    const { compatibility } = this;
    return html`
      <div class="toggle-option">
        ${this[skipImportTemplate]()}
        ${this[encryptionTemplate]()}
      </div>
      ${this[encyptionPasswordTemplate]()}
      ${this[destinationTemplate]()}

      ${this[fileInputTemplate]()}
      ${this[driveInputTemplate]()}

      <iron-form>
        <form enctype="application/json">
          <h3>Data to export</h3>
          ${exportItemsTemplate()}
        </form>
      </iron-form>

      <div class="actions">
        <anypoint-button
          @click="${this[prepare]}"
          emphasis="high"
          ?compatibility="${compatibility}"
          ?disabled="${this[loadingProperty]}"
          class="action-button"
          data-action="export"
        >Export</anypoint-button>
        ${this[loadingProperty] ? html`Exporting data...` : ''}
      </div>

      <p class="prepare-info">Depending on the data size it may take a minute</p>
      <paper-toast id="exportError" class="error-toast"></paper-toast>
      <paper-toast id="exportComplete" text="Export complete"></paper-toast>
    `;
  }
}
