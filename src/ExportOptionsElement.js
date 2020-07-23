import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import { archive, driveColor } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@polymer/iron-form/iron-form.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import elementStyles from './styles/ExportOptions.js';

const listfolderstype = 'googledrivelistappfolders';

const gdrivelistappfoldersValue = Symbol('gdrivelistappfoldersValue');

/**
 * `export-options`
 *
 * Export options dialog for ARC.
 */
export class ExportOptionsElement extends LitElement {
  static get styles() {
    return elementStyles;
  }

  render() {
    const {
      file,
      skipImport,
      compatibility,
      outlined
    } = this;
    return html`
    <h3>Export options</h3>
    <iron-form>
      <form method="post" enctype="application/json" autocomplete="on">
        <anypoint-input
          name="file"
          autocomplete="on"
          .value="${file}"
          @input="${this._inputHandler}"
          required
          autovalidate
          invalidmessage="File name is required"
          ?compatibility="${compatibility}"
          ?outlined="${outlined}">
          <label slot="label">File name</label>
        </anypoint-input>
        ${this._destinationTemplate()}
        ${this._driveInputTemplate()}
        <div class="toggle-option">
          <anypoint-checkbox
            .checked="${skipImport}"
            name="skipImport"
            @checked-changed="${this._checkedChanged}"
            ?compatibility="${compatibility}"
            title="With this option the file will be read directly to requests workspace instead showing import panel."
          >
            Skip import dialog
          </anypoint-checkbox>
          ${this._encryptionTemplate()}
        </div>
        <div class="actions">
          <anypoint-button @click="${this.cancel}">Cancel</anypoint-button>
          <anypoint-button @click="${this.confirm}" class="action-button">Export</anypoint-button>
        </div>
      </form>
    </iron-form>`;
  }

  _driveInputTemplate() {
    const {
      isDrive
    } = this;
    if (!isDrive) {
      return '';
    }
    const {
      providerOptions,
      compatibility,
      outlined,
      _driveSuggestions
    } = this;
    return html`<anypoint-chip-input
      name="providerOptions.parents"
      .chipsValue="${providerOptions.parents}"
      @chips-changed="${this._providerParentsHandler}"
      .source="${_driveSuggestions}"
      @overlay-opened="${this._stopEvent}"
      @overlay-closed="${this._stopEvent}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}">
        <label slot="label">Drive folders name (optional)</label>
      </anypoint-chip-input>`;
  }

  _destinationTemplate() {
    const {
      provider,
      compatibility,
      outlined
    } = this;
    return html`<anypoint-dropdown-menu
      class="provider-selector"
      name="provider"
      @select="${this._destinationHandler}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}">
      <label slot="label">Destination</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${provider}"
        attrforselected="value"
        selectedvalue="value"
        ?compatibility="${compatibility}">
        <anypoint-icon-item
          class="menu-item"
          value="file"
          ?compatibility="${compatibility}"
        >
          <span class="icon" slot="item-icon">${archive}</span>
          Export to file
        </anypoint-icon-item>
        <anypoint-icon-item
          class="menu-item"
          value="drive"
          ?compatibility="${compatibility}"
        >
          <span class="icon" slot="item-icon">${driveColor}</span>
          Export to Google Drive
        </anypoint-icon-item>
        <slot name="export-option"></slot>
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  _encryptionTemplate() {
    if (!this.withEncrypt) {
      return '';
    }
    const {
      encryptFile,
      compatibility
    } = this;
    return html`<anypoint-checkbox
      .checked="${encryptFile}"
      name="encryptFile"
      @checked-changed="${this._checkedChanged}"
      ?compatibility="${compatibility}"
      title="Encrypts the file with password so it is not store in plain text."
    >
      Encrypt file
    </anypoint-checkbox>
    ${this._encyptionPasswordTemplate()}`;
  }

  _encyptionPasswordTemplate() {
    if (!this.encryptFile) {
      return;
    }
    const {
      passphrase
    } = this;
    return html`<anypoint-masked-input
      name="passphrase"
      .value="${passphrase}"
      @value-changed="${this._inputHandler}"
    >
      <label slot="label">Encryption passphrase</label>
    </anypoint-masked-input>`;
  }

  static get properties() {
    return {
      /**
       * Export file name.
       */
      file: { type: String },
      /**
       * Export provider. By default it is `drive` or `file`.
       */
      provider: { type: String },
      /**
       * Google Drive export options. Only relevant when `file` is set to
       * `drive`.
       *
       * The object contains `parents` property which is an array of provided
       * by the user names of folder to create or IDs of already created
       * folders.
       *
       * The `accept` event will contain processed lsit of parents where
       * each item is an object with `name` and optional `id` property.
       * If the `id` property is not set then new folder to be created when
       * uploading the item to Google Drive.
       */
      providerOptions: { type: Object },
      /**
       * Tells the application to set configuration on the export file to
       * skip import and insert project directly into workspace.
       */
      skipImport: { type: Boolean },
      /**
       * Computed value, true when current provider is Google Drive.
       */
      isDrive: { type: Boolean },
      driveFolders: { type: Array },
      /**
       * Enables Anypoint compatibility
       */
      compatibility: { type: Boolean },
      /**
       * Enables outlined theme.
       */
      outlined: { type: Boolean },
      /**
       * When set the encrypt file option is enabled.
       */
      encryptFile: { type: Boolean },
      /**
       * Encryption passphrase
       */
      passphrase: { type: String },
      /**
       * When set it renders encryption options.
       */
      withEncrypt: { type: Boolean },

      _driveSuggestions: Array
    };
  }

  get provider() {
    return this._provider;
  }

  set provider(value) {
    const old = this._provider;
    if (old === value) {
      return;
    }
    this._provider = value;
    this.requestUpdate('provider', value);
    this.isDrive = value === 'drive';
    this._isDriveChanged();
  }

  get driveFolders() {
    return this._driveFolders;
  }

  set driveFolders(value) {
    const old = this._driveFolders;
    if (old === value) {
      return;
    }
    this._driveFolders = value;
    this._driveFoldersChanged(value);
  }

  /**
   * @return {EventListener} Previously registered handler for `googledrivelistappfolders` event
   */
  get ongoogledrivelistappfolders() {
    return this[gdrivelistappfoldersValue];
  }

  /**
   * Registers a callback function for `googledrivelistappfolders` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set ongoogledrivelistappfolders(value) {
    if (this[gdrivelistappfoldersValue]) {
      this.removeEventListener(listfolderstype, this[gdrivelistappfoldersValue]);
    }
    if (typeof value !== 'function') {
      this[gdrivelistappfoldersValue] = null;
      return;
    }
    this[gdrivelistappfoldersValue] = value;
    this.addEventListener(listfolderstype, value);
  }

  /**
   * @return {EventListener} Previously registered handler for `accept` event
   */
  get onaccept() {
    return this._onaccept;
  }

  /**
   * Registers a callback function for `accept` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onaccept(value) {
    this._registerCallback('accept', value);
  }

  /**
   * @return {EventListener} Previously registered handler for `cancel` event
   */
  get oncancel() {
    return this._oncancel;
  }

  /**
   * Registers a callback function for `cancel` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set oncancel(value) {
    this._registerCallback('cancel', value);
  }

  /**
   * @return {EventListener} Previously registered handler for `resize` event
   */
  get onresize() {
    return this._onresize;
  }

  /**
   * Registers a callback function for `resize` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onresize(value) {
    this._registerCallback('resize', value);
  }

  get _form() {
    return this.shadowRoot.querySelector('iron-form');
  }

  constructor() {
    super();
    this.providerOptions = {};
    this.isDrive = false;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this._isAttached = true;
    setTimeout(() => {
      if (this.provider === 'drive' && !this.driveFolders) {
        this._listDriveFolders();
      }
    });
  }

  _registerCallback(eventType, value) {
    const key = `_on${eventType}`;
    if (this[key]) {
      this.removeEventListener(eventType, this[key]);
    }
    if (typeof value !== 'function') {
      this[key] = null;
      return;
    }
    this[key] = value;
    this.addEventListener(eventType, value);
  }

  confirm() {
    if (!this._form.validate()) {
      return;
    }
    const data = this._getValues();
    this.dispatchEvent(new CustomEvent('accept', {
      detail: data
    }));
  }

  cancel() {
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  _destinationHandler(e) {
    this.provider = e.target.selected;
  }

  _getValues() {
    const result = {
      options: {
        file: this.file,
        provider: this.provider,
        skipImport: this.skipImport
      }
    };
    if (this.isDrive) {
      result.providerOptions = {
        parents: this._getDriveFolders()
      };
    }
    if (this.encryptFile) {
      result.options.encrypt = true;
      result.options.passphrase = this.passphrase || '';
    }
    return result;
  }

  /**
   * Computes return valye for Gogole Drive folder.
   * It creates a list of objects with `name` and optional `id` property
   * which indicates whether the folder has to be created or not.
   * @return {Array<Object>} Parent folders definition.
   */
  _getDriveFolders() {
    let parents;
    if (this.providerOptions.parents) {
      parents = Array.from(this.providerOptions.parents);
    } else {
      parents = [];
    }
    const folders = this.driveFolders;
    for (let i = 0; i < parents.length; i++) {
      const name = parents[i];
      const item = {
        name
      };
      if (folders) {
        const folder = this._findFolder(folders, name);
        if (folder) {
          item.name = folder.name;
          item.id = folder.id;
        }
      }
      parents[i] = item;
    }
    return parents;
  }

  _findFolder(folders, id) {
    return folders.find((item) => item.id === id);
  }

  /**
   * Called automatically when `isDrive` property change.
   * Dispatches `resize` custom event so parent elements can position this element
   * in e.g dialogs.
   */
  _isDriveChanged() {
    this.dispatchEvent(new CustomEvent('resize', {
      bubbles: true,
      composed: true
    }));
    if (this.isDrive) {
      this._listDriveFolders();
    }
  }

  /**
   * Attempts to read application settings by dispatching `settings-read`
   * with type `google-drive`. It expects to return `appFolders` with a list
   * of folder created by the app. This value is set as a suggestions on
   * folder input.
   * @return {Promise} This function is called automatically, this returns is
   * for tests.
   */
  async _listDriveFolders() {
    if (!this._isAttached) {
      return;
    }
    this.driveFolders = undefined;
    const e = this._dispatchReadDriveSettings();
    if (!e.defaultPrevented) {
      return;
    }
    try {
      const folders = await e.detail.result;
      this.driveFolders = folders && folders.length ? folders : undefined;
    } catch (_) {
      this.driveFolders = undefined;
    }
  }

  /**
   * Dispatches `settings-read` custom event with type `google-drive`
   * @return {CustomEvent} e
   */
  _dispatchReadDriveSettings() {
    const e = new CustomEvent(listfolderstype, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {}
    });
    this.dispatchEvent(e);
    return e;
  }

  /**
   * Transforms meta data related to created by the application Google Drive
   * folders to a list of suggestions.
   *
   * Google Drive folders meta are stores in the following structure:
   *
   * ```json
   * {
   *   "id": "Drive id",
   *   "name": "Folder name"
   * }
   * ```
   *
   * This produces suggestions for anypoint-chip-input in form:
   * ```json
   * {
   *   "value": "Folder name",
   *   "id": "Drive id"
   * }
   * ```
   * @param {?Array<Object>} folders List of folder.
   */
  _driveFoldersChanged(folders) {
    if (!folders || !(folders instanceof Array) || !folders.length) {
      this._driveSuggestions = undefined;
      return;
    }
    const result = [];
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      if (!folder || !folder.id || !folder.name) {
        continue;
      }
      result[result.length] = {
        value: folder.name,
        id: folder.id
      };
    }
    this._driveSuggestions = result;
  }

  _stopEvent(e) {
    e.stopPropagation();
  }

  _inputHandler(e) {
    const { name, value } = e.target;
    this[name] = value;
  }

  _providerParentsHandler(e) {
    const {value} = e.detail;
    this.providerOptions.parents = value;
  }

  _checkedChanged(e) {
    const { name, checked } = e.target;
    this[name] = checked;
  }
}
