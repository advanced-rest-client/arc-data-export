import { fixture, assert, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import '@advanced-rest-client/arc-models/client-certificate-model.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import {
  DataExportEventTypes,
  SessionCookieEventTypes,
  GoogleDriveEventTypes,
  EncryptionEventTypes,
  ExportEvents,
} from '@advanced-rest-client/arc-events';
import '../arc-data-export.js';
import { exportFile, exportDrive, encryptData, prepareExportData } from '../src/ArcDataExportElement.js';

/** @typedef {import('../src/ArcDataExportElement').ArcDataExportElement} ArcDataExportElement */
/** @typedef {import('@advanced-rest-client/arc-types').Cookies.ARCCookie} ARCCookie */
/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCCertificateIndex} ARCCertificateIndex */

describe('ArcDataExportElement', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<ArcDataExportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-export></arc-data-export>`);
  }

  /**
   * @return {Promise<ArcDataExportElement>}
   */
  async function electronCookiesFixture() {
    return fixture(html`<arc-data-export electroncookies></arc-data-export>`);
  }

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

  function getData(result, dataName) {
    const item = result.find(({ key }) => key === dataName);
    return item ? item.data : null;
  }

  describe('getExportData()', () => {

    describe('Request data', () => {
      before(async () => {
        await generator.insertSavedRequestData({
          requestsSize: 100,
          projectsSize: 50,
          forceProject: true,
        });
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "requests" object in the response', async () => {
        const result = await element.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        assert.typeOf(saved, 'array', 'has array of requests');
        assert.lengthOf(saved, 100, 'has all requests');
      });

      it('adds "projects" automatically', async () => {
        const result = await element.getExportData({
          saved: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of requests');
        assert.lengthOf(projects, 50, 'has all projects');
      });

      it('has ARCRequest proeprties on a request entity', async () => {
        const result = await element.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        const [request] = saved;
        assert.typeOf(request._id, 'string', 'has the _id');
        assert.typeOf(request._rev, 'string', 'has the _rev');
        assert.typeOf(request.name, 'string', 'has the name');
        assert.typeOf(request.url, 'string', 'has the url');
      });

      it('has ARCProject proeprties on a request entity', async () => {
        const result = await element.getExportData({
          saved: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });

      it('gets large amount of data', async () => {
        await generator.insertSavedRequestData({
          requestsSize: 4000,
          projectsSize: 1,
        });
        const result = await element.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        assert.lengthOf(saved, 4100, 'has all requests');
      });
    });

    describe('Projects data', () => {
      before(async () => {
        await generator.insertProjectsData({
          projectsSize: 100,
        });
      });

      after(async () => {
        await generator.clearLegacyProjects();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "projects" object in the response', async () => {
        const result = await element.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of projects');
        assert.lengthOf(projects, 100, 'has all requests');
      });

      it('has ARCProject proeprties on a request entity', async () => {
        const result = await element.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });

      it('gets large amount of data', async () => {
        await generator.insertProjectsData({
          projectsSize: 2000,
        });
        const result = await element.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        assert.lengthOf(projects, 2100, 'has all requests');
      });
    });

    describe('History data', () => {
      before(async () => {
        await generator.insertHistoryRequestData({
          requestsSize: 100,
        });
      });

      after(async () => {
        await generator.destroyHistoryData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "history" object in the response', async () => {
        const result = await element.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        assert.typeOf(history, 'array', 'has an array');
        assert.lengthOf(history, 100, 'has all history');
      });

      it('has ARCHisotryRequest properties on a request entity', async () => {
        const result = await element.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        const [item] = history;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.isUndefined(item.name, 'has no name');
      });

      it('gets large amount of data', async () => {
        await generator.insertHistoryRequestData({
          requestsSize: 2000,
        });
        const result = await element.getExportData({
          history: true,
        });
        const projects = getData(result, 'history');
        assert.lengthOf(projects, 2100, 'has all requests');
      });
    });

    describe('Auth data', () => {
      before(async () => {
        await generator.insertBasicAuthData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyAuthData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "authdata" object in the response', async () => {
        const result = await element.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        assert.typeOf(authdata, 'array', 'has an array');
        assert.lengthOf(authdata, 100, 'has all items');
      });

      it('has ARCAuthData properties', async () => {
        const result = await element.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.equal(item.type, 'basic', 'has type property');
      });

      it('gets large amount of data', async () => {
        await generator.insertBasicAuthData({
          size: 2000,
        });
        const result = await element.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        assert.lengthOf(authdata, 2100, 'has all items');
      });
    });

    describe('Websocket history data', () => {
      before(async () => {
        await generator.insertWebsocketData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyWebsocketsData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "websocketurlhistory" object in the response', async () => {
        const result = await element.getExportData({
          websocketurlhistory: true,
        });
        const data = getData(result, 'websocketurlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          websocketurlhistory: true,
        });
        const authdata = getData(result, 'websocketurlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });

      it('gets large amount of data', async () => {
        await generator.insertWebsocketData({
          size: 2000,
        });
        const result = await element.getExportData({
          websocketurlhistory: true,
        });
        const data = getData(result, 'websocketurlhistory');
        assert.lengthOf(data, 2100);
      });
    });

    describe('URL history data', () => {
      before(async () => {
        await generator.insertUrlHistoryData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyUrlData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "urlhistory" object in the response', async () => {
        const result = await element.getExportData({
          urlhistory: true,
        });
        const data = getData(result, 'urlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          urlhistory: true,
        });
        const authdata = getData(result, 'urlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });

      it('gets large amount of data', async () => {
        await generator.insertUrlHistoryData({
          size: 2000,
        });
        const result = await element.getExportData({
          urlhistory: true,
        });
        const data = getData(result, 'urlhistory');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Client certificates data', () => {
      before(async () => {
        await generator.insertCertificatesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "clientcertificates" object in the response', async () => {
        const result = await element.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        const { item, data: certData } = data[0];
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(certData, 'object', 'has the data object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.dataKey, 'string', 'has cnt property');
        assert.typeOf(certData.cert, 'object', 'has cert property');
      });

      it('gets large amount of data', async () => {
        await generator.insertCertificatesData({
          size: 200,
        });
        const result = await element.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        assert.lengthOf(data, 300);
      });
    });

    describe('Host rules data', () => {
      before(async () => {
        await generator.insertHostRulesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyHostRulesData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "hostrules" object in the response', async () => {
        const result = await element.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.from, 'string', 'has from property');
      });

      it('gets large amount of data', async () => {
        await generator.insertHostRulesData({
          size: 2000,
        });
        const result = await element.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Variables data', () => {
      before(async () => {
        await generator.insertVariablesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "variables" object in the response', async () => {
        const result = await element.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.variable, 'string', 'has variable property');
      });

      it('gets large amount of data', async () => {
        await generator.insertVariablesData({
          size: 2000,
        });
        const result = await element.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Cookies (via datastore) data', () => {
      before(async () => {
        await generator.insertCookiesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyCookiesData();
      });

      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has "cookies" object in the response', async () => {
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.expires, 'number', 'has variable property');
      });

      it('gets large amount of data', async () => {
        await generator.insertCookiesData({
          size: 2000,
        });
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Cookies (via electron event) data', () => {
      let element = /** @type ArcDataExportElement */ (null);
      beforeEach(async () => {
        element = await electronCookiesFixture();
      });

      function listenCookies(elm) {
        elm.addEventListener(SessionCookieEventTypes.listAll, function f(e) {
          e.preventDefault();
          elm.removeEventListener(SessionCookieEventTypes.listAll, f);
          const data = /** @type ARCCookie[] */ (generator.generateCookiesData({
            size: 10,
          }));
          // @ts-ignore
          e.detail.result = Promise.resolve(data);
        });
      }

      it('has "cookies" object in the response', async () => {
        listenCookies(element);
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 10, 'has all items');
      });

      it('has entity properties', async () => {
        listenCookies(element);
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item.domain, 'string', 'has the domain');
      });

      it('silently quits when no session provider', async () => {
        const result = await element.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.lengthOf(data, 0);
      });
    });
  });

  describe('[prepareExportData]()', () => {
    before(async () => {
      await generator.insertCookiesData({
        size: 10,
      });
      await generator.insertCertificatesData({
        size: 10,
      });
      await generator.insertUrlHistoryData({
        size: 10,
      });
    });

    after(async () => {
      await generator.destroyCookiesData();
      await generator.destroyClientCertificates();
      await generator.destroyUrlData();
    });

    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('processes data resular store data', async () => {
      const data = {
        urlhistory: true,
      };
      const result = await element[prepareExportData]('urlhistory', data);
      assert.equal(result.key, 'urlhistory');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes cookie data', async () => {
      const data = {
        cookies: true,
      };
      const result = await element[prepareExportData]('cookies', data);
      assert.equal(result.key, 'cookies');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes client certificates data', async () => {
      const data = {
        clientcertificates: true,
      };
      const result = await element[prepareExportData]('clientcertificates', data);
      assert.equal(result.key, 'clientcertificates');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('returns passed values', async () => {
      const value = generator.generateBasicAuthData({
        size: 10,
      });
      const data = {
        authdata: value,
      };
      const result = await element[prepareExportData]('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, value);
    });

    it('ignores wrong values', async () => {
      const data = {
        authdata: false,
      };
      const result = await element[prepareExportData]('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, []);
    });
  });

  describe('createExportObject()', () => {
    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns export object', () => {
      const result = element.createExportObject([], { provider: 'file' });
      assert.typeOf(result, 'object');
    });

    it('has export object properties', () => {
      const result = element.createExportObject([], { provider: 'file' });
      assert.typeOf(result.createdAt, 'string', 'has createdAt');
      assert.typeOf(result.version, 'string', 'has version');
      assert.typeOf(result.kind, 'string', 'has kind');
    });

    it('uses default kind', () => {
      const result = element.createExportObject([], { provider: 'file' });
      assert.equal(result.kind, 'ARC#AllDataExport');
    });

    it('uses passed kind', () => {
      const result = element.createExportObject([], { provider: 'file', kind: 'test-kind' });
      assert.equal(result.kind, 'test-kind');
    });

    it('uses default version', () => {
      const result = element.createExportObject([], { provider: 'file' });
      assert.equal(result.version, 'Unknown version');
    });

    it('uses app version attribute', () => {
      element.appVersion = '1.0.0';
      const result = element.createExportObject([], { provider: 'file' });
      assert.equal(result.version, '1.0.0');
    });
  });

  describe('[exportFile]()', () => {
    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportFile]('test', { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('adds content type when missing', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportFile]('test', { file: 'test' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'application/json');
    });

    it('respects added content type', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportFile]('test', { file: 'test', contentType: 'xxxx' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'xxxx');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportFile]('test-data', { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await element[exportFile]('test', { file: 'test' });
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('[exportDrive]()', () => {
    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportDrive]('test', { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('adds content type when missing', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportDrive]('test', { file: 'test' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'application/restclient+data');
    });

    it('respects added content type', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportDrive]('test', { file: 'test', contentType: 'xxxx' });
      assert.equal(spy.args[0][0].providerOptions.contentType, 'xxxx');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element[exportDrive]('test-data', { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await element[exportDrive]('test', { file: 'test' });
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('[encryptData]()', () => {
    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('dispatches encrypt event', async () => {
      const spy = sinon.spy();
      element.addEventListener(EncryptionEventTypes.encrypt, spy);
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element[encryptData]('test', 'test');
      assert.isTrue(spy.called);
    });

    it('adds passphrase to the event', async () => {
      const spy = sinon.spy();
      element.addEventListener(EncryptionEventTypes.encrypt, spy);
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element[encryptData]('test', 'test-passphrase');
      assert.equal(spy.args[0][0].passphrase, 'test-passphrase');
    });

    it('adds method to the event', async () => {
      const spy = sinon.spy();
      element.addEventListener(EncryptionEventTypes.encrypt, spy);
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element[encryptData]('test', 'test-passphrase');
      assert.equal(spy.args[0][0].method, 'aes');
    });

    it('has the export data', async () => {
      const spy = sinon.spy();
      element.addEventListener(EncryptionEventTypes.encrypt, spy);
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element[encryptData]('test-data', 'test');
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('returns method with encoded data', async () => {
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      const result = await element[encryptData]('test-data', 'test');
      assert.equal(result, 'aes\nencoded');
    });

    it('throws when event not handled', async () => {
      let thrown = false;
      try {
        await element[encryptData]('test', 'test');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when event has no passphrase', async () => {
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      let thrown = false;
      try {
        await element[encryptData]('test', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('arcExport()', () => {
    before(async () => {
      await generator.insertSavedRequestData({
        requestsSize: 10,
        projectsSize: 5,
        forceProject: true,
      });
      await generator.insertHistoryRequestData({
        requestsSize: 2,
      });
      await generator.insertBasicAuthData({
        size: 9,
      });
      await generator.insertWebsocketData({
        size: 7,
      });
      await generator.insertUrlHistoryData({
        size: 1,
      });
      await generator.insertCertificatesData({
        size: 6,
      });
      await generator.insertHostRulesData({
        size: 4,
      });
      await generator.insertVariablesData({
        size: 8,
      });
      await generator.insertCookiesData({
        size: 12,
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
      await generator.destroyAuthData();
      await generator.destroyWebsocketsData();
      await generator.destroyUrlData();
      await generator.destroyClientCertificates();
      await generator.destroyHostRulesData();
      await generator.destroyVariablesData();
      await generator.destroyCookiesData();
    });

    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('throws when event no exportOptions', async () => {
      let message = null;
      try {
        await element.arcExport({}, undefined, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "exportOptions" property is not set.');
    });

    it('throws when event no providerOptions', async () => {
      let message = null;
      try {
        await element.arcExport({}, { provider: 'file' }, undefined);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "providerOptions" property is not set.');
    });

    it('throws when file provider not found', async () => {
      let message = null;
      try {
        await element.arcExport({}, { provider: 'file' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The file export provider not found.');
    });

    it('throws when Drive provider not found', async () => {
      let message = null;
      try {
        await element.arcExport({}, { provider: 'drive' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The Goole Drive export provider not found.');
    });

    it('throws when unknown provider', async () => {
      let message = null;
      try {
        await element.arcExport({}, { provider: 'other' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown export provider other.');
    });

    it('throws when no provider', async () => {
      let message = null;
      try {
        // @ts-ignore
        await element.arcExport({}, { }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.provider" property is not set.');
    });

    it('throws when no file', async () => {
      let message = null;
      try {
        // @ts-ignore
        await element.arcExport({}, { provider: 'other' }, { });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.file" property is not set.');
    });

    it('dispatches file export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.arcExport({}, { provider: 'file' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('dispatches drive export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.arcExport({}, { provider: 'drive' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('has export data on the event', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.arcExport({ saved: true, }, { provider: 'file' }, { file: 'test' });
      assert.typeOf(spy.args[0][0].data, 'string');
    });

    it('encrypts the data', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element.arcExport({ }, { provider: 'file', encrypt: true, passphrase: 'test' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'aes\nencoded');
    });

    it('throws when missing a passphrase provider', async () => {
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });

      let message = null;
      try {
        await element.arcExport({}, { provider: 'other', encrypt: true, }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Encryption passphrase needs to be a string.');
    });

    [
      ['saved', 'saved', 'saved', 10],
      ['saved', 'projects', 'projects', 5],
      ['history', 'history', 'history', 2],
      ['websocket', 'websocketurlhistory', 'websocketurlhistory', 7],
      ['url history', 'urlhistory', 'urlhistory', 1],
      ['variables', 'variables', 'variables', 8],
      ['authorization', 'authdata', 'authdata', 9],
      ['client certificates', 'clientcertificates', 'clientcertificates', 6],
      ['host rules', 'hostrules', 'hostrules', 4],
      ['cookies', 'cookies', 'cookies', 12],
    ].forEach(([label, exportName, key, size]) => {
      it(`generates ${label} data`, async () => {
        const spy = sinon.spy();
        element.addEventListener(DataExportEventTypes.fileSave, spy);
        element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
          e.preventDefault();
          // @ts-ignore
          e.detail.result = Promise.resolve({});
        });
        const data = {};
        data[exportName] = true;
        await element.arcExport(data, { provider: 'file' }, { file: 'test' });
        const value = JSON.parse(spy.args[0][0].data);
        assert.typeOf(value[key], 'array');
        assert.lengthOf(value[key], Number(size));
      });
    });

    it('returns the result from the provider', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await element.arcExport({ saved: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });

    it('returns the result via the event', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await ExportEvents.nativeData(element, { saved: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });
  });

  describe('dataExport()', () => {
    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('throws when event no exportOptions', async () => {
      let message = null;
      try {
        await element.dataExport({}, undefined, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "exportOptions" property is not set.');
    });

    it('throws when event no providerOptions', async () => {
      let message = null;
      try {
        await element.dataExport({}, { provider: 'file' }, undefined);
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "providerOptions" property is not set.');
    });

    it('throws when file provider not found', async () => {
      let message = null;
      try {
        await element.dataExport({}, { provider: 'file' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The file export provider not found.');
    });

    it('throws when Drive provider not found', async () => {
      let message = null;
      try {
        await element.dataExport({}, { provider: 'drive' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The Goole Drive export provider not found.');
    });

    it('throws when unknown provider', async () => {
      let message = null;
      try {
        await element.dataExport({}, { provider: 'other' }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown export provider other.');
    });

    it('throws when no provider', async () => {
      let message = null;
      try {
        // @ts-ignore
        await element.dataExport({}, { }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.provider" property is not set.');
    });

    it('throws when no file', async () => {
      let message = null;
      try {
        // @ts-ignore
        await element.dataExport({}, { provider: 'other' }, { });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The "options.file" property is not set.');
    });

    it('dispatches file export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.dataExport('test', { provider: 'file' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('dispatches drive export event', async () => {
      const spy = sinon.spy();
      element.addEventListener(GoogleDriveEventTypes.save, spy);
      element.addEventListener(GoogleDriveEventTypes.save, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.dataExport('test', { provider: 'drive' }, { file: 'test' });
      assert.isTrue(spy.called);
    });

    it('has export data on the event', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      await element.dataExport('test-data', { provider: 'file' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'test-data');
    });

    it('encrypts the data', async () => {
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });
      await element.dataExport({ }, { provider: 'file', encrypt: true, passphrase: 'test' }, { file: 'test' });
      assert.equal(spy.args[0][0].data, 'aes\nencoded');
    });

    it('throws when missing a passphrase provider', async () => {
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve({  });
      });
      element.addEventListener(EncryptionEventTypes.encrypt, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve('encoded');
      });

      let message = null;
      try {
        await element.dataExport({}, { provider: 'other', encrypt: true, }, { file: 'test' });
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Encryption passphrase needs to be a string.');
    });

    it('returns the result from the provider', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      const spy = sinon.spy();
      element.addEventListener(DataExportEventTypes.fileSave, spy);
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await element.dataExport({ saved: true, }, { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });

    it('returns the result via the event', async () => {
      const response = {
        success: true,
        interrupted: false,
        parentId: '/home/me/Documents',
        fileId: 'export-file.json',
      };
      element.addEventListener(DataExportEventTypes.fileSave, function f(e) {
        e.preventDefault();
        // @ts-ignore
        e.detail.result = Promise.resolve(response);
      });
      const result = await ExportEvents.customData(element, 'test', { provider: 'file' }, { file: 'test' });
      assert.deepEqual(result, response);
    });
  });

  describe('Client certificate on the request object', () => {
    let request = /** @type ARCSavedRequest */ (null);
    before(async () => {
      const created = await generator.insertSavedRequestData({
        requestsSize: 1,
        projectsSize: 0,
        forceProject: false,
      });
      [request] = created.requests;
      const ccs = /** @type ARCCertificateIndex[] */ (await generator.insertCertificatesData({
        size: 2,
      }));
      const [cc] = ccs;
      // @ts-ignore
      request.auth = { id: cc._id };
      // @ts-ignore
      request.authType = 'client certificate';
      await generator.updateObject('saved-requests', request);
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyClientCertificates();
    });

    let element = /** @type ArcDataExportElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('automatically adds client certificates when request has authorization', async () => {
      const result = await element.getExportData({ saved: true });
      const certs = getData(result, 'clientcertificates');
      assert.lengthOf(certs, 1);
    });

    it('adds client certificates when requested', async () => {
      const result = await element.getExportData({ saved: true, clientcertificates: true });
      const certs = getData(result, 'clientcertificates');
      assert.lengthOf(certs, 2);
    });
  });
});
