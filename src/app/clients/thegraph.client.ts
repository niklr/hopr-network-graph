import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SubgraphStatContainerModel, SubgraphTransactionModel } from '../models/subgraph.model';

@Injectable({
  providedIn: 'root'
})
export class TheGraphClient {

  constructor(private http: HttpClient) {

  }

  private handleResponse(response: any, observer: Subscriber<any>, transformFn: (e: any) => void): void {
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

  public getTransactions(url: string, limit: number = 1000, lastIndex: number = 0): Observable<SubgraphTransactionModel[]> {
    return new Observable<SubgraphTransactionModel[]>((observer) => this.http.post(url, {
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

  public getStatContainer(url: string): Observable<SubgraphStatContainerModel> {
    return new Observable<SubgraphStatContainerModel>((observer) => this.http.post(url, {
      query: `{
        statsContainers {
          id,
          lastAccountIndex,
          lastAccountSnapshotIndex,
          lastTransactionIndex,
          lastTransferEventIndex
        }
      }`
    }).subscribe(result => {
      this.handleResponse(result, observer, (e: any) => {
        const containers = e?.statsContainers?.map((e1: any) => SubgraphStatContainerModel.fromJS(e1));
        return containers?.length > 0 ? containers[0] : undefined;
      });
    }, error => {
      observer.error(error);
    }));
  }
}
