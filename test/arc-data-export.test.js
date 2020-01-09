import { fixture, assert } from '@open-wc/testing';
import * as sinon from 'sinon';
import 'chance/dist/chance.min.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DataHelper } from './data-helper.js';
import '../arc-data-export.js';
/* global Chance */
const chance = new Chance();

describe('<arc-data-export>', function() {
  async function basicFixture() {
    return (await fixture(`<arc-data-export></arc-data-export>`));
  }

  async function versionFixture() {
    return (await fixture(`<arc-data-export appversion="1.0.0-test"></arc-data-export>`));
  }

  async function electronCookiesFixture() {
    return (await fixture(`<arc-data-export electroncookies></arc-data-export>`));
  }

  function waitUntilFileEvent(done) {
    window.addEventListener('file-data-save', function f(e) {
      window.removeEventListener('file-data-save', f);
      done(e);
    });
  }
  function waitUntilDriveEvent(done) {
    window.addEventListener('google-drive-data-save', function f(e) {
      window.removeEventListener('google-drive-data-save', f);
      done(e);
    });
  }

  function untilFileEvent() {
    return new Promise((resolve) => {
      window.addEventListener('file-data-save', function f(e) {
        window.removeEventListener('file-data-save', f);
        resolve(e);
      });
    });
  }

  describe('Basic', function() {
    function mockRev(data) {
      return data.map((item) => {
        item._rev = chance.string();
        return item;
      });
    }

    let element;

    describe('createExportObject()', function() {
      describe('Base properties()', () => {
        const opts = {};

        beforeEach(async () => {
          element = await basicFixture();
        });

        it('Sets createdAt property', function() {
          const result = element.createExportObject(opts);
          assert.typeOf(result.createdAt, 'string');
        });

        it('Default version is set', function() {
          const result = element.createExportObject(opts);
          assert.equal(result.version, 'Unknown version');
        });

        it('Sets version from attribute', function() {
          element.appVersion = 'test-version';
          const result = element.createExportObject(opts);
          assert.equal(result.version, 'test-version');
        });

        it('Uses set version', async () => {
          element = await versionFixture();
          const result = element.createExportObject(opts);
          assert.equal(result.version, '1.0.0-test');
        });
      });

      [
        ['History', 'history', 'generateHistoryRequestsData', 'ARC#HistoryData'],
        ['Host rules', 'host-rules', 'generateHostRulesData', 'ARC#HostRule'],
        ['Variables', 'variables', 'generateVariablesData', 'ARC#Variable'],
        ['Websockets URL history', 'websocket-url-history', 'generateUrlsData', 'ARC#WebsocketHistoryData'],
        ['URL History', 'url-history', 'generateUrlsData', 'ARC#UrlHistoryData'],
        ['Auth', 'auth-data', 'generateBasicAuthData', 'ARC#AuthData'],
        ['Cookies', 'cookies', 'generateCookiesData', 'ARC#Cookie'],
        ['Projects', 'projects', 'generateProjects', 'ARC#ProjectData'],
        ['Requests basic', 'requests', 'generateRequests', 'ARC#RequestData'],
        // ['Client certificates', 'client-certificates', 'generateClientCertificates', 'ARC#ClientCertificate'],
      ].forEach((item) => {
        describe(`${item[0]} data`, () => {
          const property = item[1];
          const opts = {};
          beforeEach(async () => {
            element = await basicFixture();
            opts[property] = mockRev(DataGenerator[item[2]]());
          });

          it(`${property} is set`, function() {
            const result = element.createExportObject(opts);
            assert.typeOf(result[property], 'array');
            assert.lengthOf(result[property], opts[property].length);
            assert.isUndefined(result[property][0]._rew, 'Array was processed');
          });

          it('Result is an array', function() {
            const result = element.createExportObject(opts);
            assert.typeOf(result[property], 'array');
          });

          it('_rev and _id is removed, key is added', function() {
            const result = element.createExportObject(opts);
            const data = result[property];
            for (let i = 0, len = data.length; i < len; i++) {
              assert.isUndefined(data[i]._id);
              assert.isUndefined(data[i]._rev);
              assert.typeOf(data[i].key, 'string');
            }
          });

          it('kind property is set', function() {
            const result = element.createExportObject(opts);
            assert.equal(result[property][0].kind, item[3]);
          });
        });
      });

      describe('Requests and saved', () => {
        let opts;
        beforeEach(async () => {
          element = await basicFixture();
          opts = {};
        });

        it('Uses "saved" as requests', () => {
          opts.saved = mockRev(DataGenerator.generateRequests());
          const result = element.createExportObject(opts);
          assert.lengthOf(result.requests, opts.saved.length);
        });

        it('Combines saved and requests', () => {
          opts.saved = mockRev(DataGenerator.generateRequests());
          opts.requests = mockRev(DataGenerator.generateRequests());
          const result = element.createExportObject(opts);
          assert.lengthOf(result.requests, (opts.saved.length + opts.requests.length));
        });

        it('Creates "projects" from legacyProject', () => {
          opts.requests = mockRev(DataGenerator.generateRequests());
          opts.requests[0].legacyProject = 'test-project';
          opts.requests[0].projects = undefined;
          const result = element.createExportObject(opts);
          assert.lengthOf(result.requests[0].projects, 1);
          assert.isUndefined(result.requests[0].legacyProject);
        });

        it('Adds legacyProject to "projects"', () => {
          opts.requests = mockRev(DataGenerator.generateRequests());
          opts.requests[0].legacyProject = 'test-project';
          opts.requests[0].projects = ['test-other'];
          const result = element.createExportObject(opts);
          assert.deepEqual(result.requests[0].projects, ['test-other', 'test-project']);
          assert.isUndefined(result.requests[0].legacyProject);
        });
      });
    });

    describe('arcExport()', () => {
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Rejects when no "options"', () => {
        return element.arcExport({})
            .then(() => {
              throw new Error('Should not resolve');
            })
            .catch((cause) => {
              assert.typeOf(cause.message, 'string');
              assert.equal(cause.message, 'The "options" property is not set.');
            });
      });

      it('Rejects when no "options.provider"', () => {
        return element.arcExport({
          options: {}
        })
            .then(() => {
              throw new Error('Should not resolve');
            })
            .catch((cause) => {
              assert.typeOf(cause.message, 'string');
              assert.equal(cause.message, 'The "options.provider" property is not set.');
            });
      });

      it('Rejects when no "options.file"', () => {
        return element.arcExport({
          options: {
            provider: 'file'
          }
        })
            .then(() => {
              throw new Error('Should not resolve');
            })
            .catch((cause) => {
              assert.typeOf(cause.message, 'string');
              assert.equal(cause.message, 'The "options.file" property is not set.');
            });
      });

      it('Rejects when destination is unknown', async () => {
        const cnf = {
          options: {
            provider: 'x',
            file: 'test'
          },
          data: {
            requests: [{
              _id: 'a',
              _rev: 'b'
            }]
          },
          providerOptions: {}
        };
        let err;
        try {
          await element.arcExport(cnf);
        } catch (e) {
          err = e;
        }
        assert.ok(err, 'Throws an error');
        assert.equal(err.message, 'Unknown destination x');
      });
    });
  });

  describe('arcExport()', function() {
    const sampleSzie = 15;

    before(async () => await DataHelper.generateData(sampleSzie));

    after(async () => await DataGenerator.destroyAll());

    const destination = 'file';

    describe('Generating data for a data type', function() {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      [
        ['saved', 'saved', 'requests'],
        ['saved', 'saved', 'projects'],
        ['history', 'history', 'history'],
        ['websocket', 'websocket', 'websocket-url-history'],
        ['url history', 'url-history', 'url-history'],
        ['variables', 'variables', 'variables'],
        ['authorization', 'auth', 'auth-data'],
        ['cookies', 'cookies', 'cookies'],
        ['host rules', 'host-rules', 'host-rules']
      ].forEach(([label, exportName, key]) => {
        it(`Generates ${label} data export`, function(done) {
          waitUntilFileEvent((e) => {
            e.preventDefault();
            const data = JSON.parse(e.detail.content);
            assert.typeOf(data[key], 'array');
            assert.lengthOf(data[key], 15);
            done();
          });
          const data = {};
          data[exportName] = true;
          element.arcExport({
            options: {
              provider: destination,
              file: 'test-123',
            },
            data
          }).catch((cause) => done(cause));
        });
      });

      it('Uses passed requests object', function(done) {
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.requests, 'array');
          assert.typeOf(data.projects, 'array');
          assert.lengthOf(data.requests, 5);
          assert.lengthOf(data.projects, 5);
          done();
        });
        const data = DataGenerator.generateSavedRequestData({
          projectsSize: 5,
          requestsSize: 5
        });
        element.arcExport({
          options: {
            provider: destination,
            file: 'test-123',
          },
          data
        });
      });

      it('Uses passed history object', function(done) {
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.history, 'array');
          assert.lengthOf(data.history, 5);
          done();
        });
        element.arcExport({
          options: {
            provider: destination,
            file: 'test-123',
          },
          data: {
            history: DataGenerator.generateHistoryRequestsData({
              requestsSize: 5
            })
          }
        });
      });

      it('queries for electron cookies', (done) => {
        element.addEventListener('session-cookie-list-all', (e) => {
          e.preventDefault();
          e.detail.result = Promise.resolve([{
            _id: 'a',
            _rev: 'b'
          }]);
        });
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.cookies, 'array');
          assert.lengthOf(data.cookies, 1);
          const cookie = data.cookies[0];
          assert.equal(cookie.key, 'a');
          assert.equal(cookie.kind, 'ARC#Cookie');
          done();
        });
        element.electronCookies = true;
        element.arcExport({
          options: {
            provider: destination,
            file: 'test-123',
          },
          data: {
            cookies: true
          }
        });
      });

      it('ignores unknown key values', (done) => {
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.isUndefined(data.cookies);
          done();
        });
        element.arcExport({
          options: {
            provider: destination,
            file: 'test-123',
          },
          data: {
            cookies: 'test'
          }
        });
      });
    });
  });

  describe('dataExport()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls _exportFile for file destination', () => {
      waitUntilFileEvent((e) => {
        e.preventDefault();
      });
      const spy = sinon.spy(element, '_exportFile');
      const result = element.dataExport({
        destination: 'file',
        data: {}
      });
      assert.isTrue(spy.called);
      return result;
    });

    it('Calls _exportDrive for file destination', () => {
      waitUntilDriveEvent((e) => {
        e.preventDefault();
      });
      const spy = sinon.spy(element, '_exportDrive');
      const result = element.dataExport({
        destination: 'drive',
        data: {}
      });
      assert.isTrue(spy.called);
      return result;
    });

    it('Rejects when destination is unknown', () => {
      return element.dataExport({
        data: {}
      })
          .then(() => {
            throw new Error('Should not resolve.');
          })
          .catch((cause) => {
            assert.notEqual(cause.message, 'Should not resolve.');
          });
    });

    it('Passes data property to export function', () => {
      waitUntilFileEvent((e) => {
        e.preventDefault();
      });
      const spy = sinon.spy(element, '_exportFile');
      const data = { test: true };
      const result = element.dataExport({
        destination: 'file',
        data
      });
      assert.deepEqual(spy.args[0][0], data);
      return result;
    });

    it('Uses default file name', () => {
      waitUntilFileEvent((e) => {
        e.preventDefault();
      });
      const spy = sinon.spy(element, '_exportFile');
      const result = element.dataExport({
        destination: 'file',
        data: {}
      });
      assert.deepEqual(spy.args[0][1], 'arc-data-export.json');
      return result;
    });

    it('Uses passed file name', () => {
      waitUntilFileEvent((e) => {
        e.preventDefault();
      });
      const spy = sinon.spy(element, '_exportFile');
      const result = element.dataExport({
        destination: 'file',
        file: 'test-file',
        data: {}
      });
      assert.deepEqual(spy.args[0][1], 'test-file');
      return result;
    });
  });

  describe('_dispatchCookieList()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Disaptches session-cookie-list-all event', () => {
      const spy = sinon.spy();
      element.addEventListener('session-cookie-list-all', spy);
      element._dispatchCookieList();
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const result = element._dispatchCookieList();
      assert.typeOf(result, 'customevent');
      assert.equal(result.type, 'session-cookie-list-all');
    });

    it('Event is cancelable', () => {
      const e = element._dispatchCookieList();
      assert.isTrue(e.cancelable);
    });

    it('Event is composed', () => {
      const e = element._dispatchCookieList();
      if (e.composed !== undefined) {
        assert.isTrue(e.composed);
      }
    });

    it('Event bubbles', () => {
      const e = element._dispatchCookieList();
      assert.isTrue(e.bubbles);
    });

    it('Event has detail', () => {
      const e = element._dispatchCookieList();
      assert.typeOf(e.detail, 'object');
    });
  });

  describe('_queryCookies()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    function cookieFactory(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve([{ name: 'a', domain: 'b', path: 'c' }]);
    }
    afterEach(() => {
      element.removeEventListener('session-cookie-list-all', cookieFactory);
    });

    it('Calls _dispatchCookieList()', () => {
      element.addEventListener('session-cookie-list-all', cookieFactory);
      const spy = sinon.spy(element, '_dispatchCookieList');
      element._queryCookies();
      assert.isTrue(spy.called);
    });

    it('Resolves to empty array when event not handled', async () => {
      const data = await element._queryCookies();
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 0);
    });

    it('Resolves to cookie list in export data format', async () => {
      element.addEventListener('session-cookie-list-all', cookieFactory);
      const data = await element._queryCookies();
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 1);
    });
  });

  describe('Querying for data', function() {
    const sampleSzie = 50;

    before(async function() {
      await DataHelper.generateData(sampleSzie);
    });

    after(async function() {
      await DataGenerator.destroyAll();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Gets all requests data', async function() {
      const result = await element._getDatabaseEntries('saved-requests');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.equal(result[0].type, 'saved', 'Is a saved request');
    });

    it('Gets all history data', async function() {
      const result = await element._getDatabaseEntries('history-requests');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.equal(result[0].type, 'history', 'Is a history request');
    });

    it('Gets all projects data', async function() {
      const result = await element._getDatabaseEntries('legacy-projects');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.typeOf(result[0].description, 'string', 'Is a project item');
    });

    it('Gets all websocket URL history data', async function() {
      const result = await element._getDatabaseEntries('websocket-url-history');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
    });

    it('Gets all URL data', async function() {
      const result = await element._getDatabaseEntries('url-history');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
    });

    it('Gets all variables data', async function() {
      const result = await element._getDatabaseEntries('variables');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
    });

    it('Gets all cookies data', async function() {
      const result = await element._getDatabaseEntries('cookies');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.typeOf(result[0].domain, 'string', 'Is a cookie item');
    });

    it('Gets all auth-data data', async function() {
      const result = await element._getDatabaseEntries('auth-data');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.equal(result[0].type, 'basic', 'Is an auth data item');
    });
  });

  describe('Querying with pagination', function() {
    const sampleSzie = 50;

    before(async function() {
      await DataHelper.generateData(sampleSzie);
    });

    after(async function() {
      await DataGenerator.destroyAll();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
      element.dbChunk = 20;
    });

    it('Gets all requests data', async function() {
      const spy = sinon.spy(element, '_fetchEntriesPage');
      const result = await element._getDatabaseEntries('saved-requests');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, sampleSzie, 'Size is ok');
      assert.equal(spy.callCount, 3, 'Fetch function called 3 times');
    });
  });

  describe('Exporting ARC data - events API', function() {
    function fire(detail, type) {
      type = type || 'arc-data-export';
      const e = new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    function waitUntilFileEvent(done) {
      window.addEventListener('file-data-save', function f(e) {
        window.removeEventListener('file-data-save', f);
        done(e);
      });
    }

    function waitUntilDriveEvent(done) {
      window.addEventListener('google-drive-data-save', function f(e) {
        window.removeEventListener('google-drive-data-save', f);
        done(e);
      });
    }

    describe('arc-data-export', function() {
      const sampleSzie = 5;

      before(async function() {
        await DataHelper.generateData(sampleSzie);
      });

      after(async function() {
        await DataGenerator.destroyAll();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Cancels the event', function() {
        waitUntilFileEvent((e) => {
          e.preventDefault();
        });
        const e = fire({
          options: {
            provider: 'file',
            file: 'file-123'
          },
          data: {
            saved: true,
          }
        });
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Ignores cancelled events', function() {
        document.body.addEventListener('arc-data-export', function f(e) {
          document.body.removeEventListener('arc-data-export', f);
          e.preventDefault();
        });
        const e = fire({
          options: {
            provider: 'file',
            file: 'file-123'
          },
          destination: 'file',
          data: {
            saved: true,
          }
        });
        assert.isUndefined(e.detail.result);
      });

      it('Has a promise', function() {
        waitUntilFileEvent((e) => {
          e.preventDefault();
        });
        const e = fire({
          options: {
            provider: 'file',
            file: 'file-123'
          },
          data: {
            saved: true,
          }
        });
        assert.typeOf(e.detail.result.then, 'function');
        return e.detail.result;
      });

      it('Creates an export object with saved data', function(done) {
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.requests, 'array');
          assert.lengthOf(data.requests, 5);
          done();
        });
        const e = fire({
          options: {
            provider: 'file',
            file: 'file-123'
          },
          data: {
            saved: true,
          }
        });
        e.detail.result
            .catch((cause) => done(cause));
      });

      it('Creates export object with existing data', function(done) {
        waitUntilFileEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.history, 'array');
          assert.lengthOf(data.history, 1);
          done();
        });
        const e = fire({
          options: {
            provider: 'file',
            file: 'arc-history-export.json',
            kind: 'ARC#HistoryExport'
          },
          data: {
            history: [{
              _id: 'test',
              url: 'https://domain.com',
              type: 'history',
              headers: 'x-a: b',
              method: 'GET'
            }]
          }
        });
        e.detail.result
            .catch((cause) => done(cause));
      });

      it('Exports data to Drive', function(done) {
        waitUntilDriveEvent((e) => {
          e.preventDefault();
          const data = JSON.parse(e.detail.content);
          assert.typeOf(data.requests, 'array');
          assert.lengthOf(data.requests, 5);
          assert.equal(e.detail.file, 'test-file');
          assert.equal(e.detail.options.contentType, 'application/restclient+data');
          done();
        });
        const e = fire({
          options: {
            provider: 'drive',
            file: 'test-file'
          },
          data: {
            saved: true,
          }
        });
        e.detail.result
            .catch((cause) => done(cause));
      });

      it('Calls dataExport() for export-data', function(done) {
        const spy = sinon.spy(element, 'dataExport');
        waitUntilFileEvent((e) => {
          e.preventDefault();
          assert.isTrue(spy.called);
          done();
        });

        fire({
          destination: 'file',
          file: 'test-file',
          data: {
            test: true
          }
        }, 'export-data');
      });
    });
  });

  describe('electronCookies property', () => {
    it('Has property from the attribute', async () => {
      const element = await electronCookiesFixture();
      assert.isTrue(element.electronCookies);
    });

    it('Property is set', async () => {
      const element = await basicFixture();
      element.electronCookies = true;
      assert.isTrue(element.electronCookies);
    });

    it('Property can be cleared', async () => {
      const element = await electronCookiesFixture();
      element.electronCookies = null;
      assert.isFalse(element.electronCookies);
    });

    it('Setting a property sets the attribute', async () => {
      const element = await basicFixture();
      element.electronCookies = true;
      assert.isTrue(element.hasAttribute('electroncookies'));
    });

    it('Clearing property removes the attribute', async () => {
      const element = await electronCookiesFixture();
      element.electronCookies = false;
      assert.isFalse(element.hasAttribute('electroncookies'));
    });
  });

  describe('File encryption', () => {
    let element;
    let opts;
    beforeEach(async () => {
      element = await basicFixture();
      opts = {
        options: {
          provider: 'file',
          file: 'file.arc',
          kind: 'ARC#EncodingTest',
          encrypt: true,
          passphrase: 'test'
        },
        data: {}
      };
    });

    function encFactory(e) {
      e.preventDefault();
      /* global CryptoJS */
      const encrypted = CryptoJS.AES.encrypt(e.detail.data, e.detail.passphrase);
      e.detail.result = Promise.resolve(encrypted.toString());
    }

    afterEach(() => {
      window.removeEventListener('encryption-encode', encFactory);
    });

    it('requests to encrypt the file', async () => {
      element.arcExport(opts);
      const spy = sinon.spy();
      element.addEventListener('encryption-encode', spy);
      await untilFileEvent();
      assert.isTrue(spy.called);
    });

    it('adds encryption header to the file', async () => {
      window.addEventListener('encryption-encode', encFactory);
      element.arcExport(opts);
      const e = await untilFileEvent();
      const encoded = e.detail.content;
      const lines = encoded.split('\n');
      assert.equal(lines[0], 'aes', 'header is set');
      assert.typeOf(lines[1], 'string', 'content is set')
    });

    it('sets encrypted payload', async () => {
      window.addEventListener('encryption-encode', encFactory);
      element.arcExport(opts);
      const e = await untilFileEvent();
      const encoded = e.detail.content;
      const lines = encoded.split('\n');
      const bytes = CryptoJS.AES.decrypt(lines[1], opts.options.passphrase);
      const txt = bytes.toString(CryptoJS.enc.Utf8);
      assert.notEqual(encoded, txt, 'Contains encoded content');
      const parsed = JSON.parse(txt);
      assert.equal(parsed.kind, opts.options.kind, 'Contains encoded values');
    });

    it('returns original content when no provider', async () => {
      element.arcExport(opts);
      const e = await untilFileEvent();
      const parsed = JSON.parse(e.detail.content);
      assert.equal(parsed.kind, opts.options.kind);
    });

    it('passphrase can be empty', async () => {
      opts.options.passphrase = '';
      window.addEventListener('encryption-encode', encFactory);
      element.arcExport(opts);
      const e = await untilFileEvent();
      const encoded = e.detail.content;
      const lines = encoded.split('\n');
      const bytes = CryptoJS.AES.decrypt(lines[1], opts.options.passphrase);
      const txt = bytes.toString(CryptoJS.enc.Utf8);
      assert.notEqual(encoded, txt, 'Contains encoded content');
      const parsed = JSON.parse(txt);
      assert.equal(parsed.kind, opts.options.kind, 'Contains encoded values');
    });

    it('throws when no passphrase', async () => {
      delete opts.options.passphrase;
      let err;
      try {
        await element.arcExport(opts);
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Throws an error');
      assert.equal(err.message, 'Encryption passphrase needs to be a string.');
    });
  });

  describe('Client certificates', () => {
    before(async () => DataGenerator.insertCertificatesData());
    after(async () => DataGenerator.destroyClientCertificates());

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('retreives certificate data from the data store', async () => {
      const result = await element._getClientCertificatesEntries();
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 15, 'result is all items');
      assert.typeOf(result[0], 'array', 'item is an array');
    });

    it('returns data from _getExportData()', async () => {
      const result = await element._getExportData({
        'client-certificates': true
      });
      const certs = result['client-certificates'];
      assert.typeOf(certs, 'array', 'result is an array');
      assert.lengthOf(certs, 15, 'result is all items');
    });

    it('creates export object', async () => {
      const data = await element._getExportData({
        'client-certificates': true
      });
      const result = element.createExportObject(data, {});
      const certs = result['client-certificates'];
      assert.lengthOf(certs, 15, 'result is all items');
      const cert = certs[0];
      assert.typeOf(cert, 'object', 'Has certificate object');
      assert.typeOf(cert.type, 'string', 'Has "type"');
      assert.typeOf(cert.name, 'string', 'Has "name"');
      assert.typeOf(cert.created, 'number', 'Has "created"');
      assert.typeOf(cert.dataKey, 'string', 'Has "dataKey"');
      assert.typeOf(cert.key, 'string', 'Has "key"');
      assert.equal(cert.kind, 'ARC#ClientCertificate', 'Has "kind"');
      assert.typeOf(cert.cert, 'object', 'Has "cert"');
      assert.typeOf(cert.pKey, 'object', 'Has "pKey"');
    });

    it('has the certificates on export event', async () => {
      let data;
      element.addEventListener('file-data-save', (e) => {
        e.preventDefault();
        data = e.detail;
      });
      await element.arcExport({
        options: {
          provider: 'file',
          file: 'test-123',
        },
        data: {
          'client-certificates': true
        }
      });
      const content = JSON.parse(data.content);
      const certs = content['client-certificates'];
      assert.typeOf(certs, 'array', 'result is an array');
      assert.lengthOf(certs, 15, 'result is all items');
    });
  });

  describe('Client certificates in a requests', () => {
    let saved;
    let history;

    beforeEach(() => {
      saved = [
        {
          _id: 't1',
          method: 'GET',
          url: 'https://api-domain.com',
          authType: 'client certificate',
          auth: { id: 'c1' }
        }
      ];
      history = [
        {
          _id: 't1',
          method: 'GET',
          url: 'https://api-domain.com',
          authType: 'client certificate',
          auth: { id: 'c1' }
        }
      ];
    });
    // after(async () => await DataGenerator.destroyAll());

    it('does not add client certificates when the event is not handled', async () => {
      const element = await basicFixture();
      const data = {
        saved,
        history,
      };
      const result = await element._getExportData(data);
      assert.isUndefined(result.saved[0].clientCertificate);
      assert.isUndefined(result.history[0].clientCertificate);
    });

    it('adds client certificates when the event is handled', async () => {
      const element = await basicFixture();
      const data = {
        saved,
        history,
      };
      element.addEventListener('client-certificate-get', function f(e) {
        e.preventDefault();
        e.detail.result = Promise.resolve({
          type: 'p12',
          cert: { data: 'test' },
          key: { data: 'test' },
        });
      });
      const result = await element._getExportData(data);
      assert.typeOf(result.saved[0].clientCertificate, 'object');
      assert.typeOf(result.history[0].clientCertificate, 'object');
    });
  });

  describe('_getExportData()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('creates a copy of passed values', async () => {
      const data = {
        saved: [{ test: true }],
        'auth-data': [{ test: true }],
      };
      const result = await element._getExportData(data);
      result.saved[0].test = false;
      result['auth-data'][0].test = false;
      assert.isTrue(data.saved[0].test);
      assert.isTrue(data['auth-data'][0].test);
    });
  });
});
