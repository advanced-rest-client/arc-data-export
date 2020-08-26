import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ArcPouchTransformer } from '../src/transformers/ArcPouchTransformer.js';

describe('ArcPouchTransformer', () => {
  describe('previous version', () => {
    let jsonData;
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('pouch-data-export.json');
      jsonData = JSON.parse(response);
      const transformer = new ArcPouchTransformer(jsonData);
      result = await transformer.transform();
    });

    it('normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('contains export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, '9.14.64.305');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
      assert.typeOf(result.history, 'array');
      assert.typeOf(result.variables, 'array');
      assert.typeOf(result.cookies, 'array');
      assert.typeOf(result['websocket-url-history'], 'array');
      assert.typeOf(result['url-history'], 'array');
      assert.typeOf(result['headers-sets'], 'array');
      assert.typeOf(result['auth-data'], 'array');
      assert.typeOf(result['host-rules'], 'array');
    });

    it('has all the data', () => {
      assert.lengthOf(result.projects, 2, 'has 2 projects');
      assert.lengthOf(result.requests, 5, 'has 5 saved');
      assert.lengthOf(result.history, 3, 'has 3 history');
      assert.lengthOf(result.variables, 4, 'has 4 variables');
      assert.lengthOf(result.cookies, 2, 'has 2 cookies');
      assert.lengthOf(result['websocket-url-history'], 1, 'has 1 websocket url');
      assert.lengthOf(result['url-history'], 5, 'has 5 history urls');
      assert.lengthOf(result['headers-sets'], 1, 'has 1 header set');
      assert.lengthOf(result['auth-data'], 1, 'has 1 auth data');
      assert.lengthOf(result['host-rules'], 1, 'has 1 host rules');
    });

    it('has valid request objects', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
      DataTestHelper.assertRequestObject(result.requests[1]);
      DataTestHelper.assertRequestObject(result.requests[2]);
      DataTestHelper.assertRequestObject(result.requests[3]);
    });

    it('has valid project objects', () => {
      DataTestHelper.assertProjectObject(result.projects[0]);
      DataTestHelper.assertProjectObject(result.projects[1]);
    });

    it('has valid history objects', () => {
      DataTestHelper.assertHistoryObject(result.history[0]);
      DataTestHelper.assertHistoryObject(result.history[1]);
      DataTestHelper.assertHistoryObject(result.history[2]);
    });

    it('has request values', () => {
      let request = result.requests[0];
      let compare = jsonData.requests[0];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, compare.headers);
      assert.equal(request.payload, compare.payload);
      assert.equal(request.created, compare.created);
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#RequestData');

      request = result.requests[1];
      compare = jsonData.requests[1];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, compare.created);
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#RequestData');

      request = result.requests[3];
      compare = jsonData.requests[3];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, compare.headers);
      assert.equal(request.payload, compare.payload);
      assert.equal(request.created, compare.created);
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#RequestData');
    });

    it('has project values', () => {
      let project = result.projects[0];
      let compare = jsonData.projects[0];
      assert.equal(project.name, compare.name, 'name is set');
      assert.equal(project.created, compare.created, 'created is set');
      assert.strictEqual(project.order, compare.order, 'order is set');
      assert.equal(project.kind, 'ARC#ProjectData');

      project = result.projects[1];
      compare = jsonData.projects[1];
      assert.equal(project.name, compare.name, 'name is set');
      assert.equal(project.created, compare.created, 'created is set');
      assert.strictEqual(project.order, compare.order, 'order is set');
      assert.equal(project.kind, 'ARC#ProjectData');
    });

    it('associates requests with porojects', () => {
      assert.isUndefined(result.requests[0].projects);
      assert.isUndefined(result.requests[1].projects);
      assert.typeOf(result.requests[2].projects, 'array');
      assert.lengthOf(result.requests[2].projects, 1);
      assert.typeOf(result.requests[3].projects, 'array');
      assert.lengthOf(result.requests[3].projects, 1);
    });

    it('associates porojects with requests', () => {
      const p1 = result.projects[0];
      assert.typeOf(p1.requests, 'array');
      assert.lengthOf(p1.requests, 1);
      const p2 = result.projects[0];
      assert.typeOf(p2.requests, 'array');
      assert.lengthOf(p2.requests, 1);
    });

    it('sets correct project ID', () => {
      const p1id = result.projects[0].key;
      const p2id = result.projects[1].key;
      assert.equal(result.requests[2].projects[0], p1id);
      assert.equal(result.requests[3].projects[0], p2id);
    });

    it('does not transform variable object', () => {
      assert.deepEqual(result.variables, jsonData.variables);
    });

    it('does not transform cookies object', () => {
      assert.deepEqual(result.cookies, jsonData.cookies);
    });

    it('sets websocketurlhistory object without transformation', () => {
      assert.deepEqual(result.websocketurlhistory, jsonData['websocket-url-history']);
    });

    it('sets urlhistory object without transformation', () => {
      assert.deepEqual(result.urlhistory, jsonData['url-history']);
    });

    it('sets authdata object without transformation', () => {
      assert.deepEqual(result.authdata, jsonData['auth-data']);
    });

    it('sets hostrules object without transformation', () => {
      assert.deepEqual(result.hostrules, jsonData['host-rules']);
    });

    it('transforms clicent certificates', () => {
      assert.lengthOf(result.clientcertificates, 1);
    });

    it('sets clicent certificates data', () => {
      const [item] = result.clientcertificates;
      assert.equal(item.name, 'Bob pem', 'has the name');
      assert.equal(item.type, 'pem', 'has the type');
      assert.equal(item.dataKey, '2bcf5d24-744b-4002-ad80-5e3b9bfead18', 'has the dataKey');
      assert.equal(item.created, 1577999288834, 'has the created');
      assert.equal(item.key, '60547629-570a-4b4a-8529-55723cd3f80d', 'has the key');
      assert.equal(item.kind, 'ARC#ClientCertificate', 'has the kind');
      assert.typeOf(item.cert, 'object', 'has the cert');
      assert.typeOf(item.pKey, 'object', 'has the pKey');
    });
  });
});
