import { GraphElementType, GraphEventType } from '../enums/graph.enum';
import { TransferEventModel } from './event.model';
import { PositionModel } from './position.model';

export abstract class BaseGraphModel {
  selected: boolean; // whether the element is selected (default false)
  selectable: boolean; // whether the selection state is mutable (default true)
  locked: boolean; // when locked a node's position is immutable (default false)
  grabbable: boolean; // whether the node can be grabbed and moved by the user
  pannable: boolean; // whether dragging the node causes panning instead of grabbing
  classes: string[]; // an array of class names that the element has
  position: PositionModel; // the model position of the node (optional on init, mandatory after)
  renderedPosition: PositionModel; // can alternatively specify position in rendered on-screen pixels
  scratch: GraphScratchModel; // scratchpad data (usually temp or nonserialisable data)

  public constructor(init?: Partial<BaseGraphModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.selected = init.selected ?? false;
      this.selectable = init.selectable ?? true;
      this.locked = init.locked ?? false;
      this.grabbable = init.grabbable ?? true;
      this.pannable = init.pannable ?? false;
      if (Array.isArray(init.classes)) {
        this.classes = [];
        for (const item of init.classes) {
          this.classes.push(item);
        }
      }
      if (init.position) {
        this.position = new PositionModel(init.position);
      }
      if (init.renderedPosition) {
        this.renderedPosition = new PositionModel(init.renderedPosition);
      }
      if (init.scratch) {
        this.scratch = new GraphScratchModel(init.scratch);
      }
    }
    if (!this.classes) {
      this.classes = [];
    }
  }
}

export class NodeGraphModel extends BaseGraphModel {
  data: NodeDataModel; // element data

  public constructor(init?: Partial<NodeGraphModel>) {
    super(init);
  }

  init(init?: any): void {
    super.init(init);
    if (init) {
      if (init.data) {
        this.data = new NodeDataModel(init.data);
      }
    }
  }

  public get group(): string {
    return 'nodes';
  }
}

export class NodeDataModel {
  id: string;
  name: string;
  weight: number;
  connectionCount: number;
  colorCode: string;
  shapeType: string;

  public constructor(init?: Partial<NodeDataModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.id = init.id;
      this.name = init.name;
      this.weight = init.weight ?? 1;
      this.connectionCount = init.connectionCount ?? 1;
      this.colorCode = init.colorCode;
      this.shapeType = init.shapeType;
    }
  }
}

export class NodeViewGraphModel {
  type: GraphElementType;
  id: string;
  name: string;
  weight: number;
  connectionCount: number;
  x?: number;
  y?: number;

  public constructor(init?: Partial<NodeViewGraphModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.id = init.id;
      this.name = init.name;
      this.weight = init.weight;
      this.connectionCount = init.connectionCount;
      this.x = init.x;
      this.y = init.y;
    }
  }
}

export class EdgeGraphModel extends BaseGraphModel {
  data: EdgeDataModel; // element data

  public constructor(init?: Partial<EdgeGraphModel>) {
    super(init);
  }

  init(init?: any): void {
    super.init(init);
    if (init) {
      if (init.data) {
        this.data = new EdgeDataModel(init.data);
      }
    }
  }

  public get group(): string {
    return 'edges';
  }
}

export class EdgeDataModel {
  source: string; // the source node id (edge comes from this node)
  target: string; // the target node id (edge goes to this node)
  strength: number;
  colorCode: string;

  public constructor(init?: Partial<EdgeDataModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.source = init.source;
      this.target = init.target;
      this.strength = init.strength ?? 1;
      this.colorCode = init.colorCode;
    }
  }
}

export class EdgeViewGraphModel {
  type: GraphElementType;
  source: any;
  target: any;
  strength: number;
  transfer: TransferEventModel;

  public constructor(init?: Partial<EdgeViewGraphModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.type = init.type;
      this.source = init.source;
      this.target = init.target;
      this.strength = init.strength;
      if (init.transfer) {
        this.transfer = new TransferEventModel(init.transfer);
      }
    }
  }
}

export class GraphContainerModel {
  nodes: NodeGraphModel[];
  edges: EdgeGraphModel[];

  public constructor(init?: Partial<GraphContainerModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.nodes = init.nodes?.map((e: any) => new NodeGraphModel(e));
      this.edges = init.edges?.map((e: any) => new EdgeGraphModel(e));
    }
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
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      if (init.transfer) {
        this.transfer = new TransferEventModel(init.transfer);
      }
    }
  }
}

export class GraphEventModel {
  type: GraphEventType;
  payload: any;

  public constructor(init?: Partial<GraphEventModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.type = init.type;
      this.payload = init.payload;
    }
  }
}

export class GraphStateModel {
  isDestroyed: boolean;
  isZoomed: boolean;
  requestedAnimationFrame: number;

  public constructor(init?: Partial<GraphStateModel>) {
    this.init(init);
  }

  init(init?: any): void {
    if (init) {
      this.isDestroyed = init.isDestroyed;
      this.isZoomed = init.isZoomed;
      this.requestedAnimationFrame = init.requestedAnimationFrame;
    }
  }
}
