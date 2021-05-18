import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { GraphElementType, GraphEventType } from '../../enums/graph.enum';
import {
  EdgeDataModel,
  EdgeGraphModel,
  GraphContainerModel,
  GraphEventModel,
  GraphScratchModel,
  GraphStateModel,
  NodeDataModel,
  NodeGraphModel
} from '../../models/graph.model';
import { GraphService } from '../../services/graph.service';

export abstract class SharedGraphLibComponent {

  private subs: Subscription[] = [];

  protected state: GraphStateModel;

  constructor(protected graphService: GraphService) {

  }

  protected onInit(): void {
    this.state = new GraphStateModel();
    if (this.graphService.onChangeSubject) {
      const sub1 = this.graphService.onChangeSubject.subscribe({
        next: (data: GraphEventModel) => {
          setTimeout(() => {
            this.handleOnChangeSubject(data);
          }, 0);
        }
      });
      this.subs.push(sub1);
    }
    if (this.graphService.currentData) {
      setTimeout(() => {
        this.init(this.graphService.currentData);
      }, 0);
    }
  }

  protected onDestroy(): void {
    this.destroy();
    this.state.isDestroyed = true;
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
    this.subs = [];
  }

  private handleOnChangeSubject(data: GraphEventModel) {
    if (data && !this.state.isDestroyed) {
      switch (data.type) {
        case GraphEventType.DATA_CHANGED:
          this.init(this.graphService.currentData);
          break;
        case GraphEventType.STOP_SIMULATION:
          this.destroy();
          break;
        default:
          break;
      }
    }
  }

  protected abstract get selectEmitter(): EventEmitter<any>;

  protected abstract init(data: GraphContainerModel): void;

  protected abstract destroy(): void;

  protected handleSelectedElement(element: any): void {
    if (element.type === GraphElementType.EDGE) {
      this.selectEmitter.emit(new EdgeGraphModel({
        data: new EdgeDataModel({
          source: element.source.id,
          target: element.target.id,
          strength: element.strength
        }),
        scratch: new GraphScratchModel({
          transfer: element.transfer
        })
      }));
    } else if (element.type === GraphElementType.NODE) {
      this.selectEmitter.emit(new NodeGraphModel({
        data: new NodeDataModel({
          id: element.id,
          name: element.name,
          weight: element.weight
        })
      }));
    }
  }
}
