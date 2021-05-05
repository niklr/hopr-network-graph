import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppConstants } from '../app.constants';
import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { GraphEventType } from '../enums/graph.enum';
import { ConfigChainModel } from '../models/config.model';
import {
  EdgeDataModel,
  EdgeGraphModel,
  GraphContainerModel,
  GraphEventModel,
  GraphScratchModel,
  NodeDataModel,
  NodeGraphModel
} from '../models/graph.model';
import { TransferModel } from '../models/transfer.model';
import { Ensure } from '../utils/ensure.util';
import { JsonUtil } from '../utils/json.util';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private _onChangeSubject: Subject<any>;

  public isSimulating: boolean;

  constructor(private configService: ConfigService) {
    this._onChangeSubject = new Subject<any>();
  }

  public get onChangeSubject(): Subject<GraphEventModel> {
    return this._onChangeSubject;
  }

  public load(): void {
    this._onChangeSubject.next(new GraphEventModel({
      type: GraphEventType.DATA_CHANGED,
      payload: undefined
    }));
    this.loadAsync().finally();
  }

  public async loadAsync(): Promise<void> {
    let data: any[] = [];
    if (this.configService.config?.selectedChain) {
      data = await this.init(this.configService.config?.selectedChain);
    }
    this._onChangeSubject.next(new GraphEventModel({
      type: GraphEventType.DATA_CHANGED,
      payload: data
    }));
  }

  public async init(chain: ConfigChainModel): Promise<any> {
    Ensure.notNull(chain, ConfigChainModel.name);
    const data = await JsonUtil.loadLocalAsync(chain.jsonPath);
    if (chain.type === ChainType.TEST) {
      return data;
    } else {
      return this.convertRawData(data);
    }
  }

  public stopSimulation(): void {
    this.onChangeSubject.next(new GraphEventModel({
      type: GraphEventType.STOP_SIMULATION,
      payload: undefined
    }));
  }

  private convertRawData(rawData: any): any {
    const data = {
      nodes: [],
      edges: []
    };
    const nodeMap = new Map<string, NodeGraphModel>();
    if (rawData && Array.isArray(rawData)) {
      for (const element of rawData) {
        if (element.event === 'Transfer') {
          this.addGraphElements(this.createTransferModel(element), nodeMap, data);
        }
      }
    }
    this.filterByWeight(data, nodeMap, this.configService.config.minWeight);
    return data;
  }

  private addGraphElements(transfer: TransferModel, nodeMap: Map<string, NodeGraphModel>, data: GraphContainerModel): void {
    this.tryAddNode(transfer.args.from, nodeMap, data);
    this.tryAddNode(transfer.args.to, nodeMap, data);
    data.edges.push(this.createEdgeModel(transfer));
  }

  private tryAddNode(address: string, nodeMap: Map<string, NodeGraphModel>, data: GraphContainerModel): void {
    if (nodeMap.has(address)) {
      const node = nodeMap.get(address);
      node.data.weight = Math.min(++node.data.weight, 100);
    } else {
      const node = this.createNodeModel(address);
      nodeMap.set(address, node);
      data.nodes.push(node);
    }
  }

  private filterByWeight(data: GraphContainerModel, nodeMap: Map<string, NodeGraphModel>, minWeight: number): void {
    console.log('nodes/edges before filterByWeight', data.nodes.length, '/', data.edges.length);
    data.nodes = data.nodes.filter(
      (e: any) => nodeMap.get(e.data.id).data.weight > minWeight);
    data.edges = data.edges.filter(
      (e: any) => nodeMap.get(e.data.source).data.weight > minWeight && nodeMap.get(e.data.target).data.weight > minWeight);
    console.log('nodes/edges after filterByWeight', data.nodes.length, '/', data.edges.length);
  }

  private createTransferModel(element: any): TransferModel {
    if (element) {
      const model = new TransferModel(element);
      model.type = ChainTxEventType.TRANSFER;
      if (model.args.from === AppConstants.VOID_ADDRESS) {
        model.type = ChainTxEventType.MINT;
      } else if (model.args.to === AppConstants.VOID_ADDRESS) {
        model.type = ChainTxEventType.BURN;
      }
      return model;
    }
    return undefined;
  }

  private createNodeModel(address: string): NodeGraphModel {
    return new NodeGraphModel({
      data: new NodeDataModel({
        id: address,
        name: address.substring(0, 4)
      })
    });
  }

  private createEdgeModel(transfer: TransferModel): EdgeGraphModel {
    return new EdgeGraphModel({
      data: new EdgeDataModel({
        source: transfer.args.from,
        target: transfer.args.to
      }),
      scratch: new GraphScratchModel({
        transfer
      })
    });
  }
}
