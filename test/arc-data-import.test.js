import { assert, fixture } from '@open-wc/testing';
import sinon from 'sinon';
import { ArcModelEventTypes } from '@advanced-rest-client/arc-models';
import { RestApiEventTypes, ProcessEventTypes, WorkspaceEventTypes, DataImportEventTypes } from '@advanced-rest-client/arc-events';
import { DataHelper } from './DataHelper.js';
import { notifyIndexer, notifyApiParser } from '../src/ArcDataImportElement.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('ArcDataImportElement', () => {
  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  describe('[notifyIndexer]()', () => {
    let element = /** @type ArcDataImportElement */ (null);
    let saved;
    let history;
    beforeEach(async () => {
      element = await basicFixture();
      saved = [{ id: 1, type: 'saved', url: 'https://domain.com' }];
      history = [{ id: 2, type: 'history', url: 'https://api.com' }];
    });

    it('Dispatches the event', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      element[notifyIndexer](saved, history);
      assert.isTrue(spy.called);
    });

    it('passes "saved" indexes only', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      element[notifyIndexer](saved, []);
      const data = spy.args[0][0].requests;
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 1);
    });

    it('Passes "history" indexes only', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      element[notifyIndexer](undefined, history);
      const data = spy.args[0][0].requests;
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 1);
    });

    it('Event is not dispatched when no indexes', () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlIndexer.update, spy);
      element[notifyIndexer]([], []);
      assert.isFalse(spy.called);
    });
  });

  describe('processFileData()', () => {
    let element = /** @type ArcDataImportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    function apiParserHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve({ api: true });
    }

    function apiParserErrorHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.reject(new Error('test-error'));
    }

    afterEach(() => {
      window.removeEventListener(RestApiEventTypes.processfile, apiParserHandler);
      window.removeEventListener(RestApiEventTypes.processfile, apiParserErrorHandler);
    });

    [
      'application/zip', 'application/yaml', 'application/x-yaml',
      'application/raml', 'application/x-raml', 'application/x-zip-compressed'
    ].forEach((type) => {
      it(`Calls [notifyApiParser]() for file type ${type}`, () => {
        const file = /** @type File */ ({ type });
        window.addEventListener(RestApiEventTypes.processfile, apiParserHandler);
        const spy = sinon.spy(element, notifyApiParser);
        element.processFileData(file);
        assert.isTrue(spy.called);
        assert.deepEqual(spy.args[0][0], file);
      });
    });

    [
      'api.raml', 'api.yaml', 'project.zip'
    ].forEach((name) => {
      it(`Calls [notifyApiParser]() for file with extension ${name}`, () => {
        const file = /** @type File */ ({ type: '', name });
        window.addEventListener(RestApiEventTypes.processfile, apiParserHandler);
        const spy = sinon.spy(element, notifyApiParser);
        element.processFileData(file);
        assert.isTrue(spy.called);
        assert.deepEqual(spy.args[0][0], file);
      });
    });

    it('returns a promise', () => {
      const file = DataHelper.generateArcImportFile();
      const result = element.processFileData(file);
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('dispatches processloadingstart event', async () => {
      const file = DataHelper.generateArcImportFile();
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingstart, spy);
      await element.processFileData(file);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.message, 'Procerssing file data');
    });

    it('calls toString() on Electron buffer', async () => {
      const file = DataHelper.generateElectronBuffer();
      const spy = sinon.spy(file, 'toString');
      await element.processFileData(file);
      assert.isTrue(spy.called);
    });

    it('calls [notifyApiParser]() for unknown file with RAML spec', async () => {
      const file = DataHelper.generateRamlUnknownFile();
      window.addEventListener(RestApiEventTypes.processfile, apiParserHandler);
      const spy = sinon.spy(element, notifyApiParser);
      await element.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].size, file.size);
    });

    it('Calls [notifyApiParser]() for unknown file with OAS 2 JSON spec', async () => {
      const file = DataHelper.generateOas2JsonUnknownFile();
      window.addEventListener(RestApiEventTypes.processfile, apiParserHandler);
      const spy = sinon.spy(element, notifyApiParser);
      await element.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].size, file.size);
    });

    it('rejects when JSON file is not valid', async () => {
      const file = DataHelper.generateJsonErrorFile();
      let message;
      try {
        await element.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown file format');
    });

    it('rejects when api processor not in the DOM', async () => {
      const file = DataHelper.generateRamlUnknownFile();
      let message;
      try {
        await element.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'API processor not available');
    });

    it('rejects when api processor error', async () => {
      window.addEventListener(RestApiEventTypes.processfile, apiParserErrorHandler);
      const file = DataHelper.generateRamlUnknownFile();
      let message;
      try {
        await element.processFileData(file);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'test-error');
    });

    it('dispatches processloadingstop event on error', async () => {
      let id;
      element.addEventListener(ProcessEventTypes.loadingstart, function f(e) {
        element.removeEventListener(ProcessEventTypes.loadingstart, f);
        // @ts-ignore
        id = e.detail.id;
      });
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingstop, spy);
      window.addEventListener(RestApiEventTypes.processfile, apiParserHandler);
      const file = DataHelper.generateOas2JsonUnknownFile();
      try {
        await element.processFileData(file);
      } catch (e) {
        // ...
      }
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.id, id);
    });

    it('calls normalizeImportData()', async () => {
      const file = DataHelper.generateArcImportFile();
      const spy = sinon.spy(element, 'normalizeImportData');
      await element.processFileData(file);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0], {
        createdAt: '2019-02-02T21:58:25.467Z',
        kind: 'ARC#Import',
        requests: [],
        version: '13.0.0-alpha.3'
      });
    });

    it('dispatches processloadingstop event when ready', async () => {
      let id;
      element.addEventListener(ProcessEventTypes.loadingstart, function f(e) {
        element.removeEventListener(ProcessEventTypes.loadingstart, f);
        // @ts-ignore
        id = e.detail.id;
      });
      const spy = sinon.spy();
      element.addEventListener(ProcessEventTypes.loadingstop, spy);
      const file = DataHelper.generateArcImportFile();
      try {
        await element.processFileData(file);
      } catch (e) {
        // ...
      }

      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0].detail.id, id);
    });

    it('Calls handleNormalizedFileData() with processed data', async () => {
      const spy = sinon.spy(element, 'handleNormalizedFileData');
      const file = DataHelper.generateArcImportFile();
      try {
        await element.processFileData(file);
      } catch (e) {
        // ...
      }

      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0], {
        createdAt: '2019-02-02T21:58:25.467Z',
        kind: 'ARC#Import',
        requests: [],
        version: '13.0.0-alpha.3'
      });
    });

    it('passes options to handleNormalizedFileData()', async () => {
      const opts = { driveId: 'test' };
      const spy = sinon.spy(element, 'handleNormalizedFileData');
      const file = DataHelper.generateArcImportFile();
      try {
        await element.processFileData(file, opts);
      } catch (e) {
        // ...
      }
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][1], opts);
    });
  });

  describe('handleNormalizedFileData()', () => {
    let element = /** @type ArcDataImportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('throws when no data', () => {
      assert.throws(() => {
        // @ts-ignore
        element.handleNormalizedFileData();
      });
    });

    it('dispatches request-workspace-append event', () => {
      const spy = sinon.spy();
      element.addEventListener(WorkspaceEventTypes.appendrequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      element.handleNormalizedFileData(request);
      assert.isTrue(spy.called);
    });

    it('Dispatches workspace append for project with forced open', () => {
      const spy = sinon.spy();
      element.addEventListener(WorkspaceEventTypes.appendexport, spy);
      const data = DataHelper.generateProjectImportOpen();
      element.handleNormalizedFileData(data);
      assert.deepEqual(spy.args[0][0].detail.data, data);
    });

    it('Removes key and kind properties', () => {
      const spy = sinon.spy();
      element.addEventListener(WorkspaceEventTypes.appendrequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      element.handleNormalizedFileData(request);
      assert.isUndefined(spy.args[0][0].detail.request.key);
      assert.isUndefined(spy.args[0][0].detail.request.kind);
    });

    it('Sets request _id', () => {
      const spy = sinon.spy();
      element.addEventListener(WorkspaceEventTypes.appendrequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      element.handleNormalizedFileData(request);
      assert.equal(spy.args[0][0].detail.request._id, '11013905-9b5a-49d9-adc8-f76ec3ead2f1');
    });

    it('Adds driveId', () => {
      const spy = sinon.spy();
      element.addEventListener(WorkspaceEventTypes.appendrequest, spy);
      const request = DataHelper.generateSingleRequestImport();
      element.handleNormalizedFileData(request, { driveId: 'test' });
      assert.equal(spy.args[0][0].detail.request.driveId, 'test');
    });

    it('Dispatches import data inspect event', () => {
      const spy = sinon.spy();
      element.addEventListener(DataImportEventTypes.inspect, spy);
      const request = DataHelper.generateMultiRequestImport();
      element.handleNormalizedFileData(request);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0].detail.data, request);
    });
  });
});
