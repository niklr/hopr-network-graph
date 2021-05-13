import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Logger } from '../../services/logger.service';

@Component({
  selector: 'hopr-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit, OnDestroy {

  private subs: Subscription[] = [];
  private maxSize: 10;

  public logs: any[] = [];

  constructor(private logger: Logger) { }

  ngOnInit(): void {
    if (this.logger.onLogMessageSubject) {
      const sub1 = this.logger.onLogMessageSubject.subscribe({
        next: (data: any) => {
          this.logs.unshift(data);
          if (this.logs.length > this.maxSize) {
            this.logs.pop();
          }
        }
      });
      this.subs.push(sub1);
    }
  }

  ngOnDestroy(): any {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
    this.subs = [];
  }

}
