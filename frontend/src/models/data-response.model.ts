import type { ExecuteModel } from './execute.model';

export interface DataResponseModel {
  sql: string;
  explain?: string;
  executed?: ExecuteModel
}
