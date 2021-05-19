import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LogEventModel } from '../models/log.model';
import { CommonUtil } from '../utils/common.util';

export abstract class Logger {
  abstract get onLogMessageSubject(): Subject<LogEventModel>;
  abstract debug: any;
  abstract info: any;
  abstract warn: any;
  abstract error: any;
}

const noop = (): any => undefined;

@Injectable({
  providedIn: 'root'
})
export class DefaultLoggerService extends Logger {

  private _onLogMessageSubject: Subject<LogEventModel>;

  constructor() {
    super();
    this._onLogMessageSubject = new Subject<LogEventModel>();
  }

  public get onLogMessageSubject(): Subject<LogEventModel> {
    return this._onLogMessageSubject;
  }

  private get isEnabled(): boolean {
    return true;
  }

  private timestamp(type: string): string {
    return `[${type} ${new Date().toLocaleTimeString()}]`;
  }

  private createLogEventModel(type: string, ...args: any[]): LogEventModel {
    const mapFn = (e: any) => {
      if (CommonUtil.isString(e)) {
        return e;
      } else if (e instanceof Error) {
        return e.message;
      }
      return CommonUtil.toJsonString(e);
    };
    const result = new LogEventModel({
      banner: this.timestamp(type),
      args: args?.map(e => Array.isArray(e) ? e.map(e1 => mapFn(e1)) : mapFn(e))
    });
    this._onLogMessageSubject.next(result);
    return result;
  }

  get debug() {
    if (this.isEnabled) {
      return (...args: any[]) => {
        const result = this.createLogEventModel('DEBUG', args);
        console.debug(result.banner, ...args);
      };
    } else {
      return noop;
    }
  }

  get info() {
    if (this.isEnabled) {
      return (...args: any[]) => {
        const result = this.createLogEventModel('INFO', args);
        console.info(result.banner, ...args);
      };
    } else {
      return noop;
    }
  }

  get warn() {
    if (this.isEnabled) {
      return (...args: any[]) => {
        const result = this.createLogEventModel('WARN', args);
        console.warn(result.banner, ...args);
      };
    } else {
      return noop;
    }
  }

  get error() {
    if (this.isEnabled) {
      return (...args: any[]) => {
        args?.push('(See console output for more information.)');
        const result = this.createLogEventModel('ERROR', args);
        console.error(result.banner, ...args);
      };
    } else {
      return noop;
    }
  }
}
