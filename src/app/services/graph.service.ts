import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppConstants } from '../app.constants';
import { ChainTxEventType, ChainType } from '../enums/chain.enum';
import { GraphEventType } from '../enums/graph.enum';
import { ChainFilterItemModel } from '../models/chain.model';
import { ChainConfigModel } from '../models/config.model';
import { EventModel, TransferEventModel } from '../models/event.model';
import {
  EdgeDataModel,
  EdgeGraphModel,
  GraphContainerModel,
  GraphEventModel,
  GraphScratchModel,
  NodeDataModel,
  NodeGraphModel
} from '../models/graph.model';
import { EventRepository } from '../repositories/event.repository';
import { Ensure } from '../utils/ensure.util';
import { FileUtil } from '../utils/file.util';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private _onChangeSubject: Subject<any>;
  private _data: GraphContainerModel;
  private _nodeMap: Map<string, NodeGraphModel>;

  public isLoading = false;
  public isSimulating = false;
  public drawArrow = false;
  public drawEdgeLabel = false;
  public drawNodeLabel = false;
  public readonly filter: Map<string, ChainFilterItemModel>;

  constructor(private configService: ConfigService, private eventRepository: EventRepository, private fileUtil: FileUtil) {
    this._onChangeSubject = new Subject<any>();
    this.filter = new Map<string, ChainFilterItemModel>([
      [
        ChainTxEventType[ChainTxEventType.MINT],
        new ChainFilterItemModel({
          id: ChainTxEventType[ChainTxEventType.MINT],
          name: 'Mint',
          isSelected: true,
          color: AppConstants.TX_EVENT_MINT_COLOR
        })
      ],
      [
        ChainTxEventType[ChainTxEventType.TRANSFER],
        new ChainFilterItemModel({
          id: ChainTxEventType[ChainTxEventType.TRANSFER],
          name: 'Transfer',
          isSelected: true,
          color: AppConstants.TX_EVENT_TRANSFER_COLOR
        })
      ],
      [
        ChainTxEventType[ChainTxEventType.BURN],
        new ChainFilterItemModel({
          id: ChainTxEventType[ChainTxEventType.BURN],
          name: 'Burn',
          isSelected: true,
          color: AppConstants.TX_EVENT_BURN_COLOR
        })
      ]
    ]);
  }

  public get onChangeSubject(): Subject<GraphEventModel> {
    return this._onChangeSubject;
  }

  public clear(): void {
    this._data = undefined;
    this._nodeMap = undefined;
    this.submitDataSubjectEvent(undefined);
  }

  public load(): void {
    this.isLoading = true;
    this.loadAsync().catch((error) => {
      console.log(error);
      this.isLoading = false;
    }).finally();
  }

  public stopSimulation(): void {
    this._onChangeSubject.next(new GraphEventModel({
      type: GraphEventType.STOP_SIMULATION,
      payload: undefined
    }));
  }

  public changeFilter(id: string): void {
    this.isLoading = true;
    const item = this.filter.get(id);
    if (item) {
      item.isSelected = !item.isSelected;
    }
    const data = this.applyFilters(this._data);
    this.submitDataSubjectEvent(data);
  }

  private async loadAsync(): Promise<void> {
    this._nodeMap = new Map<string, NodeGraphModel>();
    if (this.configService.config?.selectedChain) {
      const data = await this.init(this.configService.config?.selectedChain);
      this.submitDataSubjectEvent(data);
    } else {
      this.submitDataSubjectEvent(undefined);
    }
  }

  private async init(chain: ChainConfigModel): Promise<GraphContainerModel> {
    Ensure.notNull(chain, ChainConfigModel.name);
    try {
      if (chain.type === ChainType.TEST) {
        const rawData = await this.fileUtil.readFileAsync(chain.eventsPath);
        this._data = this.convertTestData(JSON.parse(rawData));
      } else {
        // const rawData = await this.fileUtil.readFileAsync(chain.eventsPath);
        // this._data = this.convertChainEvents(JSON.parse(rawData));
        const events = await this.eventRepository.getByChainTypeAsync(chain.type);
        this._data = this.convertChainEvents(events);
      }
      return this.applyFilters(this._data);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private convertTestData(testData: any): GraphContainerModel {
    const data = this.createGraphContainerModel();
    if (Array.isArray(testData?.nodes) && Array.isArray(testData?.edges)) {
      data.nodes = testData?.nodes;
      data.edges = testData?.edges;
      for (const node of data.nodes) {
        this._nodeMap.set(node.data.id, node);
      }
    }
    return data;
  }

  private convertChainEvents(events: EventModel[]): GraphContainerModel {
    const data = this.createGraphContainerModel();
    if (Array.isArray(events)) {
      for (const item of events) {
        if (item.type === ChainTxEventType.TRANSFER) {
          this.addGraphElements(this.createTransferEventModel(item), data);
        }
      }
    }
    return data;
  }

  private addGraphElements(transfer: TransferEventModel, data: GraphContainerModel): void {
    this.tryAddNode(transfer.args.from, data);
    this.tryAddNode(transfer.args.to, data);
    data.edges.push(this.createEdgeModel(transfer));
  }

  private tryAddNode(address: string, data: GraphContainerModel): void {
    if (this._nodeMap.has(address)) {
      const node = this._nodeMap.get(address);
      node.data.weight = Math.min(++node.data.weight, 100);
    } else {
      const node = this.createNodeModel(address);
      this._nodeMap.set(address, node);
      data.nodes.push(node);
    }
  }

  private applyFilters(data: GraphContainerModel): GraphContainerModel {
    let filteredData: GraphContainerModel;
    filteredData = this.filterByWeight(data, this.configService.config.minWeight);
    filteredData = this.filterBySelection(filteredData);
    return filteredData;
  }

  private filterByWeight(data: GraphContainerModel, minWeight: number): GraphContainerModel {
    console.log('nodes/edges before filterByWeight', data.nodes.length, '/', data.edges.length);
    const result = this.createGraphContainerModel();
    result.nodes = data.nodes.filter(
      (e: NodeGraphModel) => this._nodeMap.get(e.data.id)?.data.weight > minWeight);
    result.edges = data.edges.filter(
      (e: EdgeGraphModel) => this._nodeMap.get(e.data.source)?.data.weight > minWeight
        && this._nodeMap.get(e.data.target)?.data.weight > minWeight);
    console.log('nodes/edges after filterByWeight', result.nodes.length, '/', result.edges.length);
    return result;
  }

  private filterBySelection(data: GraphContainerModel): GraphContainerModel {
    let result: GraphContainerModel;
    const filterItems: ChainFilterItemModel[] = Array.from(this.filter.values());
    // Check if any item is not selected
    if (filterItems.filter(e => !e.isSelected).length > 0) {
      result = this.createGraphContainerModel();
      // Check if any item is selected
      const selectedItems: ChainFilterItemModel[] = filterItems.filter(e => e.isSelected);
      if (selectedItems.length === 0) {
        return result;
      }
      const types: string[] = selectedItems.map(e => e.id);
      for (const edge of data.edges) {
        if (types.includes(ChainTxEventType[edge.scratch?.transfer?.type])) {
          result.edges.push(edge);
          result.nodes.push(this._nodeMap.get(edge.data.source));
          result.nodes.push(this._nodeMap.get(edge.data.target));
        }
      }
      // Remove duplicates
      result.nodes = [...new Set(result.nodes)];
    } else {
      result = data;
    }
    return result;
  }

  private submitDataSubjectEvent(data: GraphContainerModel): void {
    this._onChangeSubject.next(new GraphEventModel({
      type: GraphEventType.DATA_CHANGED,
      payload: data
    }));
  }

  private createGraphContainerModel(): GraphContainerModel {
    // Cytoscape does not work with instance of GraphContainerModel
    // TODO: replace with "return new GraphContainerModel();"
    return {
      nodes: [],
      edges: []
    };
  }

  private createTransferEventModel(element: any): TransferEventModel {
    if (element) {
      const model = new TransferEventModel(element);
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

  private createEdgeModel(transfer: TransferEventModel): EdgeGraphModel {
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
