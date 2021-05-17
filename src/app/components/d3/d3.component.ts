import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { AppConstants } from '../../app.constants';
import { ChainTxEventType } from '../../enums/chain.enum';
import { GraphElementType, GraphEventType } from '../../enums/graph.enum';
import { EdgeDataModel, EdgeGraphModel, GraphEventModel, GraphScratchModel, GraphStateModel, NodeDataModel, NodeGraphModel } from '../../models/graph.model';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'hopr-d3',
  templateUrl: './d3.component.html',
  styleUrls: ['./d3.component.css']
})
export class D3Component implements OnInit, OnDestroy {

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private width: number;
  private height: number;
  private canvas: d3.Selection<HTMLCanvasElement, unknown, HTMLElement, any>;
  private context: CanvasRenderingContext2D;
  private base: d3.Selection<HTMLElement, unknown, HTMLElement, any>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private edges: any;
  private nodes: any;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;
  private transform: any;
  private state: GraphStateModel;
  private connectedLookup: any = {};
  private subs: Subscription[] = [];

  constructor(private graphService: GraphService) {

  }

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    console.log('D3 destroy called.');
    this.stopSimulation();
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
          this.init(data.payload);
          break;
        case GraphEventType.STOP_SIMULATION:
          this.stopSimulation();
          break;
        default:
          break;
      }
    }
  }

  private stopSimulation(): void {
    console.log('D3 stop simulation called.');
    this.simulation?.stop();
    this.graphService.isSimulating = false;
  }

  private init(data: any): void {
    this.state.isZoomed = false;
    this.graphService.isLoading = true;
    this.width = this.containerElementRef.nativeElement.clientWidth;
    this.height = this.containerElementRef.nativeElement.clientHeight;
    this.createCanvas();
    if (data) {
      this.nodes = data.nodes.map((e: NodeGraphModel) => {
        return {
          type: GraphElementType.NODE,
          id: e.data.id,
          name: e.data.name,
          weight: e.data.weight
        };
      });
      this.edges = data.edges.map((e: EdgeGraphModel) => {
        return {
          type: GraphElementType.EDGE,
          source: e.data.source,
          target: e.data.target,
          strength: e.data.strength,
          transfer: e.scratch?.transfer
        };
      });
      if (this.simulation) {
        this.simulation.stop();
      }
      this.simulation = d3.forceSimulation(this.nodes)
        .force('link', d3.forceLink(this.edges).id((d: any) => d.id))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(this.width / 2, this.height / 2))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .on('end', () => {
          this.graphService.isSimulating = false;
          console.log('Simulation ended.');
        });
      this.graphService.isSimulating = true;

      this.simulation.on('tick', () => {
        this.requestRender();
      });

      this.connectedLookup = {};
      this.edges.forEach((d: any) => {
        this.connectedLookup[`${d.source.id},${d.target.id}`] = true;
      });

      this.center(0);
      this.graphService.isLoading = false;
    }
  }

  public requestRender(): void {
    if (this.state.requestedAnimationFrame) {
      return;
    }
    this.state.requestedAnimationFrame = requestAnimationFrame(() => {
      this.render();
    });
  }

  private render(): void {
    this.state.requestedAnimationFrame = undefined;
    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    this.drawEdges();
    this.drawNodes();
    this.context.restore();
  }

  private drawEdges(): void {
    // draw links
    this.context.strokeStyle = AppConstants.TX_EVENT_TRANSFER_COLOR;
    this.context.beginPath();
    this.edges.forEach((d) => {
      if (d?.transfer?.type) {
        switch (d.transfer.type) {
          case ChainTxEventType.MINT:
            this.context.strokeStyle = AppConstants.TX_EVENT_MINT_COLOR;
            break;
          case ChainTxEventType.BURN:
            this.context.strokeStyle = AppConstants.TX_EVENT_BURN_COLOR;
            break;
          default:
            this.context.strokeStyle = AppConstants.TX_EVENT_TRANSFER_COLOR;
            break;
        }
      } else {
        this.context.strokeStyle = AppConstants.TX_EVENT_TRANSFER_COLOR;
      }
      this.context.moveTo(d.source.x, d.source.y);
      this.context.lineTo(d.target.x, d.target.y);
    });
    this.context.stroke();
  }

  private drawNodes(): void {
    this.context.fillStyle = AppConstants.NODE_COLOR;
    this.context.beginPath();
    this.nodes.forEach((d) => {
      const radius = Math.max(5, (d.weight / 10) + 5);
      this.context.moveTo(d.x + radius, d.y);
      this.context.arc(d.x, d.y, radius, 0, 2 * Math.PI);
    });
    this.context.fill();
  }

  private createCanvas(): void {
    d3.select('#canvasContainer').remove();
    this.canvas = d3.select('#container')
      .append('canvas')
      .attr('id', 'canvasContainer')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', () => {
        this.base.selectAll('.graphElement').style('opacity', 1);
        this.selectEmitter.emit(undefined);
      });

    this.context = this.canvas.node().getContext('2d');
    this.base = d3.select(document.createElement('base'));
    this.transform = d3.zoomIdentity;

    // this.canvas.call(d3.drag().subject((e) => console.log(e)));
    // this.canvas.call(this.drag());
    this.zoom = d3.zoom()
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([0, 10])
      .on('zoom', (e: any) => {
        this.state.isZoomed = true;
        this.transform = e.transform;
        this.requestRender();
      });
    this.canvas.call(this.zoom);
  }

  private drag(): any {

    const dragsubject = (event: any) => {
      console.log(event);
      return this.simulation.find(event.x, event.y);
    };

    const dragstarted = (event: any, d: any) => {
      if (!event.active) {
        this.simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: any, d: any) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event: any, d: any) => {
      if (!event.active) {
        this.simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3.drag()
      // .subject(dragsubject)
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  private isConnected(a: any, b: any): boolean {
    return this.isConnectedAsTarget(a, b) || this.isConnectedAsSource(a, b) || a === b;
  }

  private isConnectedAsSource(a: any, b: any): boolean {
    return this.connectedLookup[`${a},${b}`];
  }

  private isConnectedAsTarget(a: any, b: any): boolean {
    return this.connectedLookup[`${b},${a}`];
  }

  private handleClick = (event: any, d: any) => {
    event.stopPropagation();
    this.base.selectAll('.graphElement').style('opacity', (o: any) => {
      if (d.type === GraphElementType.EDGE) {
        if (o.type === GraphElementType.EDGE) {
          // d = EDGE and o = EDGE
          if (o === d) {
            return 1.0;
          }
          return 0;
        } else {
          // d = EDGE and o = NODE
          if (o.id === d.source.id || o.id === d.target.id) {
            return 1.0;
          }
          return 0;
        }
      } else {
        if (o.type === GraphElementType.EDGE) {
          // d = NODE and o = EDGE
          if (o.source.id === d.id || o.target.id === d.id) {
            return 1.0;
          }
          return 0;
        } else {
          // d = NODE and o = NODE
          if (o.id === d.id) {
            return 1;
          }
          if (this.isConnected(o.id, d.id)) {
            return 0.5;
          }
          return 0;
        }
      }
    });
    d3.select(event.target).style('opacity', 1);

    if (d.type === GraphElementType.EDGE) {
      this.selectEmitter.emit(new EdgeGraphModel({
        data: new EdgeDataModel({
          source: d.source.id,
          target: d.target.id,
          strength: d.strength
        }),
        scratch: new GraphScratchModel({
          transfer: d.transfer
        })
      }));
    } else if (d.type === GraphElementType.NODE) {
      this.selectEmitter.emit(new NodeGraphModel({
        data: new NodeDataModel({
          id: d.id,
          name: d.name,
          weight: d.weight
        })
      }));
    }
  }

  private center(count: number): void {
    if (!this.state.isDestroyed && !this.state.isZoomed) {
      const width = this.canvas.node().clientWidth;
      const height = this.canvas.node().clientHeight;
      // TODO: set min/max nodes
      console.log(width, height);
      if (width && height) {
        const scale = Math.min(this.width / width, this.height / height) * 0.8;
        if (count > 0) {
          console.log(width, height, scale);
          this.canvas.transition()
            .duration(750)
            .call(this.zoom.scaleTo, scale);
        }
      }
      if (this.graphService.isSimulating && count < 5) {
        setTimeout(() => {
          this.center(++count);
        }, 1000);
      }
    }
  }
}
