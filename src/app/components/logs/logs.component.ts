import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogEventModel } from '../../models/log.model';
import { Logger } from '../../services/logger.service';
import { CommonUtil } from '../../utils/common.util';

@Component({
  selector: 'hopr-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit, OnDestroy {

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private subs: Subscription[] = [];
  private maxSize = 30;

  public logs: LogEventModel[] = [];

  constructor(private logger: Logger) { }

  ngOnInit(): void {
    if (this.logger.onLogMessageSubject) {
      const sub1 = this.logger.onLogMessageSubject.subscribe({
        next: (data: LogEventModel) => {
          const length = this.logs.push(data);
          if (length > this.maxSize) {
            this.logs.shift();
          }
          this.scrollToBottom();
        }
      });
      this.subs.push(sub1);
      // this.testAsync();
    }
  }

  ngOnDestroy(): any {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
    this.subs = [];
  }

  private async testAsync(): Promise<void> {
    for (let index = 0; index < 30; index++) {
      this.logger.debug(`Log test message ${index}.`);
      await CommonUtil.timeout(500);
    }
  }

  public scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.containerElementRef.nativeElement.scrollTop = this.containerElementRef.nativeElement.scrollHeight;
      } catch (e) {
        this.logger.info(e);
      }
    }, 0);
  }
}
