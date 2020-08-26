import {DataExport} from '@advanced-rest-client/arc-types';

export declare const dataValue: unique symbol;

/**
 * Base class for all transformers.
 * Has common functions for the transformers.
 */
export declare class BaseTransformer {
  [dataValue]: any;

  /**
   * @param data Data to be transformed.
   */
  constructor(data: any);

  /**
   * Executes function in next event loop.
   *
   * @param fn A function to be executed in next event loop.
   */
  deffer(fn: Function): void;

  /**
   * Sets hours, minutes, seconds and ms to 0 and returns timestamp.
   *
   * @param timestamp Day's timestamp.
   * @returns Timestamp to the day.
   */
  getDayToday(timestamp: number): number;

  /**
   * Adds project reference to a request object.
   *
   * @param request Request object to alter
   * @param id Project id
   */
  addProjectReference(request: DataExport.ExportArcSavedRequest | DataExport.ExportArcHistoryRequest, id: string): void;

  /**
   * Adds request reference to a project object.
   *
   * @param project Project object to alter
   * @param id Request id
   */
  addRequestReference(project: DataExport.ExportArcProjects, id: string): void;
}
