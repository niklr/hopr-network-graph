import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { GraphLibraryType } from '../../enums/graph.enum';
import { BaseGraphModel, EdgeGraphModel, NodeGraphModel } from '../../models/graph.model';
import { ConfigService } from '../../services/config.service';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'hopr-network-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})

export class GraphComponent {

  public node: NodeGraphModel;
  public edge: EdgeGraphModel;

  constructor(private configService: ConfigService, private graphService: GraphService) {
  }

  public nodeChange(event: BaseGraphModel): void {
    if (event instanceof NodeGraphModel) {
      this.node = event;
      this.edge = undefined;
    } else if (event instanceof EdgeGraphModel) {
      this.edge = event;
      this.node = undefined;
    } else {
      this.node = undefined;
      this.edge = undefined;
    }
  }

  public get onDataChangeSubject(): Subject<any> {
    return this.graphService.onDataChangeSubject;
  }

  public get useCytoscapeLibrary(): boolean {
    return this.configService.config.selectedGraphLibraryType === GraphLibraryType.CYTOSCAPE;
  }

  public buildAddressUrl(address: string): string {
    if (address && this.configService.config?.selectedChain?.addressUrl) {
      return this.configService.config.selectedChain.addressUrl.replace('{address}', address);
    }
    return undefined;
  }

  public buildTxUrl(transactionHash: string): string {
    if (transactionHash && this.configService.config?.selectedChain?.txUrl) {
      return this.configService.config.selectedChain.txUrl.replace('{transactionHash}', transactionHash);
    }
    return undefined;
  }
}
