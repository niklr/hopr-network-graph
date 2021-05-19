import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SubgraphTransactionModel } from '../models/subgraph.model';
import { Logger } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class TheGraphClient {

  constructor(private logger: Logger, private http: HttpClient) {

  }

  private handleResponse(response: any, observer: Subscriber<void>, transformFn: (e: any) => void): void {
    if (response?.data || response?.error) {
      if (response.data) {
        if (Array.isArray(response.data)) {
          observer.next(response.data.map((e: any) => transformFn(e)));
        } else {
          observer.next(transformFn(response.data));
        }
        observer.complete();
      } else {
        observer.error(response.error);
      }
    } else {
      observer.error(response);
    }
  }

  public getTransactions(url: string, limit: number = 1000, lastIndex: number = 0): Observable<void> {
    return new Observable<void>((observer) => this.http.post(url, {
      query: `{
        transactions(first: ${limit}, orderBy: index, orderDirection: asc, where: { index_gt: ${lastIndex} }) {
          id
          index
          from
          to
          blockNumber
          blockTimestamp
          transferEvents {
            id
            index
            transaction
            logIndex
            blockNumber
            blockTimestamp
            from
            to
            amount
            tokenType
          }
        }
      }`
    }).subscribe(result => {
      this.handleResponse(result, observer, (e: any) => {
        return e?.transactions?.map((e1: any) => SubgraphTransactionModel.fromJS(e1));
      });
    }, error => {
      observer.error(error);
    }));
  }
}
