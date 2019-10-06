import { assert } from '@open-wc/testing';
import 'chance/dist/chance.min.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { ExportProcessor } from '../src/ExportProcessor.js';
/* global Chance */
const chance = new Chance();

describe('ExportProcessor', () => {
  function mockRev(data) {
    return data.map((item) => {
      item._rev = chance.string();
      return item;
    });
  }

  describe('_prepareRequestsList()', function() {
    let data;
    let instance;
    beforeEach(async () => {
      instance = new ExportProcessor();
      const projects = DataGenerator.generateProjects({
        projectsSize: 20
      });
      data = DataGenerator.generateRequests({
        requestsSize: 20,
        projects: projects
      });
      data = mockRev(data);
    });

    it('Result is an array', function() {
      const result = instance._prepareRequestsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', function() {
      const result = instance._prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', function() {
      const result = instance._prepareRequestsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        assert.typeOf(result[i].key, 'string');
      }
    });

    it('legacyProject is removed', function() {
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance._prepareRequestsList(data);
      assert.isUndefined(result[0].legacyProject);
    });

    it('Creates projects from legacyProject', function() {
      data[0].legacyProject = 'abc';
      delete data[0].projects;
      const result = instance._prepareRequestsList(data);
      assert.typeOf(result[0].projects, 'array');
      assert.equal(result[0].projects[0], 'abc');
    });

    it('Adds to projects from legacyProject', function() {
      data[0].projects = ['test'];
      data[0].legacyProject = 'abc';
      const result = instance._prepareRequestsList(data);
      assert.isUndefined(result[0].legacyProject);
      assert.lengthOf(result[0].projects, 2);
    });

    it('kind property is set', function() {
      const result = instance._prepareRequestsList(data);
      assert.equal(result[0].kind, 'ARC#RequestData');
    });
  });

  describe('_prepareProjectsList()', function() {
    let data;
    let instance;

    beforeEach(() => {
      instance = new ExportProcessor();
      data = DataGenerator.generateProjects({
        projectsSize: 5
      });
      data = mockRev(data);
    });

    it('Result is an array', function() {
      const result = instance._prepareProjectsList(data);
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', function() {
      const result = instance._prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('key is set', function() {
      const ids = data.map((item) => item._id);
      const result = instance._prepareProjectsList(data);
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i].key !== ids[i]) {
          throw new Error('Key is not set');
        }
      }
    });

    it('kind property is set', function() {
      const result = instance._prepareProjectsList(data);
      assert.equal(result[0].kind, 'ARC#ProjectData');
    });
  });

  describe('_prepareHistoryDataList()', function() {
    let result;

    beforeEach(async () => {
      const instance = new ExportProcessor();
      let data = DataGenerator.generateHistoryRequestsData();
      data = mockRev(data);
      result = instance._prepareHistoryDataList(data);
    });

    it('Result is an array', function() {
      assert.typeOf(result, 'array');
    });

    it('_rev and _id is removed', function() {
      for (let i = 0, len = result.length; i < len; i++) {
        if (result[i]._id) {
          throw new Error('_id is set');
        }
        if (result[i]._rev) {
          throw new Error('_rev is set');
        }
      }
    });

    it('kind property is set', function() {
      assert.equal(result[0].kind, 'ARC#HistoryData');
    });
  });

  describe('createExportObject()', () => {
    let instance;

    beforeEach(() => {
      instance = new ExportProcessor();
    });

    it('returns an object', () => {
      const result = instance.createExportObject({}, {});
      assert.typeOf(result, 'object');
    });

    it('has export time', () => {
      const result = instance.createExportObject({}, {});
      assert.typeOf(result.createdAt, 'string');
    });

    it('has application version', () => {
      const result = instance.createExportObject({}, {
        appVersion: '1.2.3'
      });
      assert.equal(result.version, '1.2.3');
    });

    it('has export kind', () => {
      const result = instance.createExportObject({}, {
        kind: 'ARC#test'
      });
      assert.equal(result.kind, 'ARC#test');
    });

    it('has loadToWorkspace proeprty', () => {
      const result = instance.createExportObject({}, {
        skipImport: true
      });
      assert.isTrue(result.loadToWorkspace);
    });
  });
});
