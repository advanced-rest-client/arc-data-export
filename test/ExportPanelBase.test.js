import { fixture, assert, nextFrame, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import {
  GoogleDriveEventTypes,
} from '@advanced-rest-client/arc-events';
import {
  driveFoldersChanged,
  driveSuggestionsValue,
  parentNameValue,
  formValue,
  buildExportOptions,
  buildProviderOptions,
} from '../src/ExportPanelBase.js';
import { ExportOptionsElement } from '../index.js';
import '../export-options.js';

/** @typedef {import('../index.js').ExportOptionsElement} ExportOptionsElement */


/**
 * These are test for ExportPanelBase but since the `ExportOptionsElement` extends
 * this class this test uses it to perform the tests.
 */
describe('ExportPanelBase', () => {
  /**
   * @return {Promise<ExportOptionsElement>}
   */
  async function basicFixture() {
    return (fixture(`<export-options></export-options>`));
  }
  //
  // /**
  //  * @return {Promise<ExportOptionsElement>}
  //  */
  // async function validFixture() {
  //   return (fixture(`<export-options
  //     file="test-file"
  //     provider="file"></export-options>`));
  // }

  /**
   * @return {Promise<ExportOptionsElement>}
   */
  async function fullDriveFixture() {
    return (fixture(`
    <export-options
      file="test-file.json"
      provider="drive"
      skipimport
      parentId="test-parent"
      withEncrypt
      encryptFile
      passphrase="test-passwd"
    ></export-options>`));
  }

  describe('#[formValue]', () => {
    it('returns a reference to the form', async () => {
      const element = await basicFixture();
      assert.ok(element[formValue]);
    });
  });

  describe('contructor()', () => {
    let element = /** @type ExportOptionsElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets isDrive', () => {
      assert.isFalse(element.isDrive);
    });

    it('sets compatibility', () => {
      assert.isFalse(element.compatibility);
    });

    it('sets outlined', () => {
      assert.isFalse(element.outlined);
    });

    it('sets encryptFile', () => {
      assert.isFalse(element.encryptFile);
    });

    it('sets withEncrypt', () => {
      assert.isFalse(element.withEncrypt);
    });

    it('sets skipImport', () => {
      assert.isFalse(element.skipImport);
    });
  });

  describe('connectedCallback()', () => {
    it('lists for drive folders when connected to the DOM', async () => {
      const element = new ExportOptionsElement();
      element.isDrive = true;
      document.body.appendChild(element);
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, spy);
      await aTimeout(0);
      document.body.removeChild(element);
    });
  });

  describe('[buildExportOptions]', () => {
    let element = /** @type ExportOptionsElement */ (null);
    beforeEach(async () => {
      element = await fullDriveFixture();
    });

    it('returns an object', () => {
      const result = element[buildExportOptions]();
      assert.typeOf(result, 'object');
    });

    it('has the provider', () => {
      const result = element[buildExportOptions]();
      assert.equal(result.provider, 'drive');
    });

    it('has the skipImport', () => {
      const result = element[buildExportOptions]();
      assert.isTrue(result.skipImport);
    });

    it('has the encrypt', () => {
      const result = element[buildExportOptions]();
      assert.isTrue(result.encrypt);
    });

    it('has the passphrase', () => {
      const result = element[buildExportOptions]();
      assert.equal(result.passphrase, 'test-passwd');
    });

    it('has no passphrase when no encrypt options', () => {
      element.encryptFile = false;
      const result = element[buildExportOptions]();
      assert.isUndefined(result.passphrase);
    });

    it('has no encrypt when no encrypt options', () => {
      element.encryptFile = false;
      const result = element[buildExportOptions]();
      assert.isUndefined(result.encrypt);
    });
  });

  describe('[buildProviderOptions]', () => {
    let element = /** @type ExportOptionsElement */ (null);
    beforeEach(async () => {
      element = await fullDriveFixture();
    });

    it('returns an object', () => {
      const result = element[buildProviderOptions]();
      assert.typeOf(result, 'object');
    });

    it('has the file', () => {
      const result = element[buildProviderOptions]();
      assert.equal(result.file, 'test-file.json');
    });

    it('has the parent', () => {
      const result = element[buildProviderOptions]();
      assert.equal(result.parent, 'test-parent');
    });

    it('has no parent when no drive', () => {
      element.isDrive = false;
      const result = element[buildProviderOptions]();
      assert.isUndefined(result.parent);
    });
  });

  describe('google drive provider', () => {
    it('dispatches "resize" event when changing to "drive" provider', async () => {
      const element = await basicFixture();
      const spy = sinon.spy();
      element.addEventListener('resize', spy);
      element.provider = 'drive';
      assert.isTrue(spy.calledOnce);
    });

    it('requests for google drive folders', async () => {
      const element = await basicFixture();
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, spy);
      element.provider = 'drive';
      assert.isTrue(spy.calledOnce);
    });

    it('sets google drive folders', async () => {
      const element = await basicFixture();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, function f(e) {
        element.removeEventListener(GoogleDriveEventTypes.listAppFolders, f);
        // @ts-ignore
        e.detail.result = Promise.resolve([{ id: 'f1', name: 'n1' }]);
      });
      element.provider = 'drive';
      await nextFrame();
      assert.deepEqual(element.driveFolders, [{ id: 'f1', name: 'n1' }]);
    });

    it('sets google drive to undefined when empty array', async () => {
      const element = await basicFixture();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, function f(e) {
        element.removeEventListener(GoogleDriveEventTypes.listAppFolders, f);
        // @ts-ignore
        e.detail.result = Promise.resolve([]);
      });
      element.provider = 'drive';
      await nextFrame();
      assert.isUndefined(element.driveFolders);
    });

    it('sets google drive to undefined when error', async () => {
      const element = await basicFixture();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, function f(e) {
        element.removeEventListener(GoogleDriveEventTypes.listAppFolders, f);
        // @ts-ignore
        e.detail.result = Promise.reject(new Error('test'));
      });
      element.provider = 'drive';
      await nextFrame();
      assert.isUndefined(element.driveFolders);
    });

    it('sets suggestions value', async () => {
      const element = await basicFixture();
      element.addEventListener(GoogleDriveEventTypes.listAppFolders, function f(e) {
        element.removeEventListener(GoogleDriveEventTypes.listAppFolders, f);
        // @ts-ignore
        e.detail.result = Promise.resolve([{ id: 'f1', name: 'n1' }]);
      });
      element.provider = 'drive';
      await nextFrame();
      const ac = element.shadowRoot.querySelector('anypoint-autocomplete');
      // @ts-ignore
      assert.deepEqual(ac.source, [{ id: 'f1', value: 'n1' }]);
    });
  });

  describe('[driveFoldersChanged]()', () => {
    let element = /** @type ExportOptionsElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('clears [driveSuggestionsValue] when no argument', () => {
      element[driveSuggestionsValue] = [];
      element[driveFoldersChanged](undefined);
      assert.isUndefined(element[driveSuggestionsValue]);
    });

    it('clears [driveSuggestionsValue] when passing empty array', () => {
      element[driveSuggestionsValue] = [];
      element[driveFoldersChanged]([]);
      assert.isUndefined(element[driveSuggestionsValue]);
    });

    it('sets list of suggestions source', () => {
      element[driveFoldersChanged]([{ id: 'i1', name: 'n1' }]);
      // @ts-ignore
      assert.deepEqual(element[driveSuggestionsValue], [{ id: 'i1', value: 'n1' }]);
    });

    it('sets [parentNameValue] from selected folder', () => {
      element.parentId = 'i1';
      element[driveFoldersChanged]([{ id: 'i1', name: 'n1' }, { id: 'i2', name: 'n2' }]);
      assert.equal(element[parentNameValue], 'n1');
    });
  });

  describe('ongoogledrivelistappfolders', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.ongoogledrivelistappfolders);
      const f = () => {};
      element.ongoogledrivelistappfolders = f;
      assert.isTrue(element.ongoogledrivelistappfolders === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.ongoogledrivelistappfolders = f;
      element.provider = 'drive';
      element.ongoogledrivelistappfolders = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.ongoogledrivelistappfolders = f1;
      element.ongoogledrivelistappfolders = f2;
      element.provider = 'drive';
      element.ongoogledrivelistappfolders = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });
});
