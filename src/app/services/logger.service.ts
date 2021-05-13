import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export abstract class Logger {
  abstract get onLogMessageSubject(): Subject<any>;
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

  private _onLogMessageSubject: Subject<any>;

  constructor() {
    super();
    this._onLogMessageSubject = new Subject<any>();
  }

  public get onLogMessageSubject(): Subject<any> {
    return this._onLogMessageSubject;
  }

  private get isEnabled(): boolean {
    return true;
  }

  get debug() {
    if (this.isEnabled) {
      return console.debug.bind(console);
    } else {
      return noop;
    }
  }

  get info() {
    if (this.isEnabled) {
      return console.info.bind(console);
    } else {
      return noop;
    }
  }

  get warn() {
    if (this.isEnabled) {
      return console.warn.bind(console);
    } else {
      return noop;
    }
  }

  get error() {
    if (this.isEnabled) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  invokeConsoleMethod(type: string, args?: any): any {
    this._onLogMessageSubject.next(args);
    return (console)[type] || console.log || noop;
  }
}
