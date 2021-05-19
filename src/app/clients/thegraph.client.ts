import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Logger } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class TheGraphClient {

  constructor(private logger: Logger, private http: HttpClient) {

  }

  public test(url: string): Observable<void> {
    return new Observable<void>((observer) => this.http.post(url, {
      query: `{
        accounts(first: 5) {
          id
          index
          totalSupply
          xHoprBalance
        }
        accountSnapshots(first: 5) {
          id
          index
          account {
            id
          }
          xHoprBalance
        }
      }`
    }).subscribe(result => {
      console.log(result);
      observer.complete();
    }, error => {
      observer.error(error);
    }));
  }
}
