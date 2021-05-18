import { Subscription } from 'rxjs';
import { GraphEventType } from '../../enums/graph.enum';
import { GraphContainerModel, GraphEventModel, GraphStateModel } from '../../models/graph.model';
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

  protected abstract init(data: GraphContainerModel): void;

  protected abstract destroy(): void;
}
