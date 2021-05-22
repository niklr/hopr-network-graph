import { GraphElementType, GraphEventType } from '../enums/graph.enum';
import { TransferEventModel } from './event.model';
import { PositionModel } from './position.model';

export abstract class BaseGraphModel {
  selected = false; // whether the element is selected (default false)
  selectable = true; // whether the selection state is mutable (default true)
  locked = false; // when locked a node's position is immutable (default false)
  grabbable = true; // whether the node can be grabbed and moved by the user
  pannable = false; // whether dragging the node causes panning instead of grabbing
  classes: string[]; // an array of class names that the element has
  position: PositionModel; // the model position of the node (optional on init, mandatory after)
  renderedPosition: PositionModel; // can alternatively specify position in rendered on-screen pixels
  scratch: GraphScratchModel; // scratchpad data (usually temp or nonserialisable data)

  public constructor(init?: Partial<BaseGraphModel>) {
    Object.assign(this, init);
  }
}

export class NodeGraphModel extends BaseGraphModel {
  data: NodeDataModel; // element data

  public constructor(init?: Partial<NodeGraphModel>) {
    super(init);
    Object.assign(this, init);
  }

  public get group(): string {
    return 'nodes';
  }
}

export class NodeDataModel {
  id: string;
  name: string;
  weight = 1;
  colorCode: string;
  shapeType: string;

  public constructor(init?: Partial<NodeDataModel>) {
    Object.assign(this, init);
  }
}

export class NodeViewGraphModel {
  type: GraphElementType;
  id: string;
  name: string;
  weight: number;
  x?: number;
  y?: number;

  public constructor(init?: Partial<NodeViewGraphModel>) {
    Object.assign(this, init);
  }
}

export class EdgeGraphModel extends BaseGraphModel {
  data: EdgeDataModel; // element data

  public constructor(init?: Partial<EdgeGraphModel>) {
    super(init);
    Object.assign(this, init);
  }

  public get group(): string {
    return 'edges';
  }
}

export class EdgeDataModel {
  source: string; // the source node id (edge comes from this node)
  target: string; // the target node id (edge goes to this node)
  strength = 1;
  colorCode: string;

  public constructor(init?: Partial<EdgeDataModel>) {
    Object.assign(this, init);
  }
}

export class EdgeViewGraphModel {
  type: GraphElementType;
  source: any;
  target: any;
  strength: number;
  transfer: TransferEventModel;

  public constructor(init?: Partial<EdgeViewGraphModel>) {
    Object.assign(this, init);
  }
}

export class GraphContainerModel {
  nodes: NodeGraphModel[];
  edges: EdgeGraphModel[];

  public constructor(init?: Partial<GraphContainerModel>) {
    Object.assign(this, init);
    if (!this.nodes) {
      this.nodes = [];
    }
    if (!this.edges) {
      this.edges = [];
    }
  }
}

export class GraphScratchModel {
  transfer: TransferEventModel;

  public constructor(init?: Partial<GraphScratchModel>) {
    Object.assign(this, init);
  }
}

export class GraphEventModel {
  type: GraphEventType;
  payload: any;

  public constructor(init?: Partial<GraphEventModel>) {
    Object.assign(this, init);
  }
}

export class GraphStateModel {
  isDestroyed: boolean;
  isZoomed: boolean;
  requestedAnimationFrame: number;

  public constructor(init?: Partial<GraphStateModel>) {
    Object.assign(this, init);
  }
}
