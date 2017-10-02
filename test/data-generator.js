/* global chance */
const DataGenerator = {};
const methods = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD'];
const methodsSize = methods.length - 1;
DataGenerator.createProjectObject = function() {
  var project = {
    _id: chance.string({length: 12}),
    name: chance.sentence({words: 2}),
    order: 0,
    description: chance.paragraph()
  };
  return project;
};

DataGenerator.genRequestObject = function(projectData) {
  var methodIndex = chance.integer({min: 0, max: methodsSize});
  var id = chance.string({length: 5});
  if (projectData) {
    id += '/' + projectData;
  }
  var obj = {
    _id: id,
    name: chance.sentence({words: 2}),
    method: methods[methodIndex],
    url: chance.url(),
    projectOrder: chance.integer({min: 0, max: 10}),
    legacyProject: projectData,
    type: 'saved'
  };
  return obj;
};

DataGenerator.genHistoryObject = function() {
  var methodIndex = chance.integer({min: 0, max: methodsSize});
  var obj = {
    _id: chance.string({length: 5}),
    method: methods[methodIndex],
    url: chance.url()
  };
  return obj;
};

DataGenerator.generateRequests = function(projectId, size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    let id = chance.bool({likelihood: 2}) ? projectId : undefined;
    result.push(DataGenerator.genRequestObject(id));
  }
  return result;
};

DataGenerator.generateHistory = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push(DataGenerator.genHistoryObject());
  }
  return result;
};

DataGenerator.generateUrls = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push({
      _id: chance.url()
    });
  }
  return result;
};

DataGenerator.generateVariables = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push({
      enabled: true,
      environment: 'default',
      value: chance.string(),
      variable: chance.string(),
      _id: chance.string(),
      _rev: chance.string()
    });
  }
  return result;
};

DataGenerator.generateHeadersSets = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push({
      created: chance.hammertime(),
      headers: chance.paragraph({sentences: 1}),
      name: chance.string(),
      order: 0,
      _id: chance.string(),
      _rev: chance.string()
    });
  }
  return result;
};

DataGenerator.generateCookies = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push({
      _id: 'cookie/' + chance.string(),
      created: chance.hammertime(),
      domain: chance.domain(),
      name: chance.string(),
      value: chance.string()
    });
  }
  return result;
};

DataGenerator.generateAuthData = function(size) {
  size = size || 25;
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push({
      _id: 'basic/' + chance.string(),
      type: 'basic',
      url: chance.url()
    });
  }
  return result;
};

DataGenerator.generateData = function(requestsSize) {
  var project = DataGenerator.createProjectObject();
  var savedDb = new PouchDB('saved-requests');
  var projectsDb = new PouchDB('legacy-projects');
  var history = new PouchDB('history-requests');
  var wsUrls = new PouchDB('websocket-url-history');
  var urls = new PouchDB('url-history');
  var variables = new PouchDB('variables');
  var headersSets = new PouchDB('headers-sets');
  var cookies = new PouchDB('cookies');
  var authData = new PouchDB('auth-data');

  function cleanInsert(item) {
    delete item._id;
    delete item._rev;
    return item;
  };
  return projectsDb.put(project)
  .then(result => {
    if (!result.ok) {
      throw new Error('Cannot insert project into the database');
    }
    return savedDb.bulkDocs(DataGenerator.generateRequests(project._id, requestsSize));
  })
  .then(() => history.bulkDocs(DataGenerator.generateHistory(requestsSize)))
  .then(() => wsUrls.bulkDocs(DataGenerator.generateUrls()))
  .then(() => urls.bulkDocs(DataGenerator.generateUrls()))
  .then(() => {
    let v = DataGenerator.generateVariables();
    v = v.map(cleanInsert);
    return variables.bulkDocs(v);
  })
  .then(() => {
    let v = DataGenerator.generateHeadersSets();
    v = v.map(cleanInsert);
    return headersSets.bulkDocs(v);
  })
  .then(() => cookies.bulkDocs(DataGenerator.generateCookies()))
  .then(() => authData.bulkDocs(DataGenerator.generateAuthData()));
};

DataGenerator.destroyData = function() {
  var savedDb = new PouchDB('saved-requests');
  var projectsDb = new PouchDB('legacy-projects');
  var history = new PouchDB('history-requests');
  var wsUrls = new PouchDB('websocket-url-history');
  var urls = new PouchDB('url-history');
  var variables = new PouchDB('variables');
  var headersSets = new PouchDB('headers-sets');
  var cookies = new PouchDB('cookies');
  var authData = new PouchDB('auth-data');
  return savedDb.destroy()
  .then(() => projectsDb.destroy())
  .then(() => history.destroy())
  .then(() => wsUrls.destroy())
  .then(() => urls.destroy())
  .then(() => variables.destroy())
  .then(() => headersSets.destroy())
  .then(() => cookies.destroy())
  .then(() => authData.destroy());
};

DataGenerator.mockRev = function(data) {
  return data.map(item => {
    item._rev = chance.string();
    return item;
  });
};
