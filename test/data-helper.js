import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
export const DataHelper = {};
DataHelper.generateData = function(sample) {
  return DataGenerator.insertSavedRequestData({
    requestsSize: sample,
    projectsSize: sample
  })
      .then(() => DataGenerator.insertHistoryRequestData({
        requestsSize: sample
      }))
      .then(() => DataGenerator.insertWebsocketData({
        size: sample
      }))
      .then(() => DataGenerator.insertUrlHistoryData({
        size: sample
      }))
      .then(() => DataGenerator.insertVariablesData({
        size: sample
      }))
      .then(() => DataGenerator.insertHeadersSetsData({
        size: sample
      }))
      .then(() => DataGenerator.insertCookiesData({
        size: sample
      }))
      .then(() => DataGenerator.insertBasicAuthData({
        size: sample
      }))
      .then(() => DataGenerator.insertHostRulesData({
        size: sample
      }));

  // var hostRulesData = new PouchDB('host-rules');
  //
  // function cleanInsert(item) {
  //   delete item._id;
  //   delete item._rev;
  //   return item;
  // }
  // return projectsDb.put(project)
  // .then(result => {
  //   if (!result.ok) {
  //     throw new Error('Cannot insert project into the database');
  //   }
  //   return savedDb.bulkDocs(DataHelper.generateRequests(project._id, requestsSize));
  // })
  // .then(() => history.bulkDocs(DataHelper.generateHistory(requestsSize)))
  // .then(() => wsUrls.bulkDocs(DataHelper.generateUrls()))
  // .then(() => urls.bulkDocs(DataHelper.generateUrls()))
  // .then(() => {
  //   let v = DataHelper.generateVariables();
  //   v = v.map(cleanInsert);
  //   return variables.bulkDocs(v);
  // })
  // .then(() => {
  //   let v = DataHelper.generateHeadersSets();
  //   v = v.map(cleanInsert);
  //   return headersSets.bulkDocs(v);
  // })
  // .then(() => cookies.bulkDocs(DataHelper.generateCookies()))
  // .then(() => authData.bulkDocs(DataHelper.generateAuthData()))
  // .then(() => hostRulesData.bulkDocs(DataHelper.generateHostRulesData()));
};
