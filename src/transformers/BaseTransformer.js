/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */

export const dataValue = Symbol('dataValue');

/**
 * Base class for all transformers.
 * Has common functions for the transformers.
 */
export class BaseTransformer {
  /**
   * @param {object} data Data to be transformed.
   */
  constructor(data) {
    this[dataValue] = data;
  }

  /**
   * Executes function in next event loop.
   *
   * @param {Function} fn A function to be executed in next event loop.
   */
  deffer(fn) {
    if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(fn.bind(this));
    } else if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(fn.bind(this));
    } else {
      setTimeout(fn.bind(this), 16);
    }
  }

  /**
   * Sets hours, minutes, seconds and ms to 0 and returns timestamp.
   *
   * @param {number} timestamp Day's timestamp.
   * @return {number} Timestamp to the day.
   */
  getDayToday(timestamp) {
    const d = new Date(timestamp);
    const tCheck = d.getTime();
    if (Number.isNaN(tCheck)) {
      throw new Error(`Invalid timestamp: ${  timestamp}`);
    }
    d.setMilliseconds(0);
    d.setSeconds(0);
    d.setMinutes(0);
    d.setHours(0);
    return d.getTime();
  }

  /**
   * Adds project reference to a request object.
   * @param {ExportArcSavedRequest} request Request object to alter
   * @param {string} id Project id
   */
  addProjectReference(request, id) {
    if (!id) {
      return;
    }
    if (!request.projects) {
      request.projects = [];
    }
    if (request.projects.indexOf(id) === -1) {
      request.projects.push(id);
    }
  }

  /**
   * Adds request reference to a project object.
   * @param {ExportArcProjects} project Project object to alter
   * @param {string} id Request id
   */
  addRequestReference(project, id) {
    if (!id) {
      return;
    }
    if (!project.requests) {
      project.requests = [];
    }
    if (project.requests.indexOf(id) === -1) {
      project.requests.push(id);
    }
  }
}
