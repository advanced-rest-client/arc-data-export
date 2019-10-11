/**
 * A class that processes ARC data to create a standard export object.
 */
export class ExportProcessor {
  /**
   * Creates an export object for the data.
   *
   * @param {Object} data Export options. Available keys:
   * -   `requests` (Array) List of requests to export
   * -   `projects` (Array) List of projects to export
   * -   `history` (Array) List of history requests to export
   * -   `websocket-url-history` (Array) List of url history object for WS to export
   * -   `url-history` (Array) List of URL history objects to export
   * -   `variables` (Array) List of variables to export
   * -   `auth-data` (Array) List of the auth data objects to export
   * -   `cookies` (Array) List of cookies to export
   * -   `kind` (String) The `kind` property of the top export declaration.
   *      Default to `ARC#AllDataExport`
   * @param {Object} options Export configuration object
   * @return {Object} ARC export object declaration.
   */
  createExportObject(data, options) {
    const result = {
      createdAt: new Date().toISOString(),
      version: options.appVersion,
      kind: options.kind
    };
    if (options.skipImport) {
      result.loadToWorkspace = true;
    }
    let requests = [];
    if (data.requests) {
      // database export.
      requests = data.requests;
    }
    if (data.saved) {
      // manual listing.
      requests = requests.concat(data.saved);
    }
    if (requests.length) {
      result.requests = this._prepareRequestsList(requests);
    }
    [
      ['projects', null, '_prepareProjectsList'],
      ['history', null, '_prepareHistoryDataList'],
      ['websocket-url-history', null, '_prepareWsUrlHistoryData'],
      ['url-history', null, '_prepareUrlHistoryData'],
      ['variables', null, '_prepareVariablesData'],
      ['auth-data', null, '_prepareAuthData'],
      ['cookies', null, '_prepareCookieData'],
      ['host-rules', null, '_prepareHostRulesData'],
      ['client-certificates', null, '_prepareClientCertData']
    ].forEach((item) => {
      const items = data[item[0]];
      if (items && items instanceof Array && items.length) {
        const expKey = item[1] || item[0];
        result[expKey] = this[item[2]](items);
      }
    });
    return result;
  }

  _prepareRequestsList(requests) {
    const result = requests.map((item) => {
      if (item.legacyProject) {
        if (item.projects) {
          item.projects[item.projects.length] = item.legacyProject;
        } else {
          item.projects = [item.legacyProject];
        }
        delete item.legacyProject;
      }
      item.kind = 'ARC#RequestData';
      item.key = item._id;
      delete item._rev;
      delete item._id;
      return item;
    });
    return result;
  }

  _prepareProjectsList(projects) {
    return projects.map((item) => {
      item.kind = 'ARC#ProjectData';
      item.key = item._id;
      delete item._rev;
      delete item._id;
      return item;
    });
  }

  _prepareHistoryDataList(history) {
    const result = history.map((item) => {
      item.kind = 'ARC#HistoryData';
      item.key = item._id;
      delete item._rev;
      delete item._id;
      return item;
    });
    return result;
  }

  _prepareWsUrlHistoryData(history) {
    const result = history.map((item) => {
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#WebsocketHistoryData';
      return item;
    });
    return result;
  }

  _prepareUrlHistoryData(history) {
    const result = history.map((item) => {
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#UrlHistoryData';
      return item;
    });
    return result;
  }

  _prepareVariablesData(variables) {
    const result = [];
    variables.forEach((item) => {
      if (!item.environment) {
        // PouchDB creates some views in the main datastore and it is added to
        // get all docs function without any reason. It should be eleminated
        return;
      }
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#Variable';
      result.push(item);
    });
    return result;
  }

  _prepareAuthData(authData) {
    const result = authData.map((item) => {
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#AuthData';
      return item;
    });
    return result;
  }

  _prepareCookieData(authData) {
    const isElectron = this.electronCookies;
    const result = authData.map((item) => {
      if (!isElectron) {
        item.key = item._id;
        delete item._rev;
        delete item._id;
      }
      item.kind = 'ARC#Cookie';
      return item;
    });
    return result;
  }

  _prepareHostRulesData(hostRules) {
    return hostRules.map((item) => {
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#HostRule';
      return item;
    });
  }

  _prepareClientCertData(items) {
    return items.map(([item, data]) => {
      item.key = item._id;
      delete item._rev;
      delete item._id;
      item.kind = 'ARC#ClientCertificate';
      item.cert = data.cert;
      if (data.key) {
        item.pKey = data.key;
      }
      return item;
    });
  }
}
