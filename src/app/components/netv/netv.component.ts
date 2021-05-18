import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import NetV from 'netv';
import { Subscription } from 'rxjs';
import { GraphElementType, GraphEventType } from '../../enums/graph.enum';
import { EdgeGraphModel, GraphEventModel, GraphStateModel, NodeGraphModel } from '../../models/graph.model';
import { GraphService } from '../../services/graph.service';

@Component({
  selector: 'hopr-netv',
  templateUrl: './netv.component.html',
  styleUrls: ['./netv.component.css']
})
export class NetvComponent implements OnInit, OnDestroy {

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private width: number;
  private height: number;
  private canvas: any;
  private edges: any;
  private nodes: any;
  private data: any;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;
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
      this.data = {
        nodes: this.nodes,
        links: this.edges
      };
      this.canvas.data(this.data);
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

      // this.center(0);
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
    this.data.nodes.forEach((n) => {
      const node = this.canvas.getNodeById(n.id);
      node.x(n.x);
      node.y(n.y);
    });
    this.canvas.draw();
  }

  private createCanvas(): void {
    this.canvas = new NetV({
      container: this.containerElementRef.nativeElement,
      width: this.width,
      height: this.height,
      node: {
        style: {
          r: 4,
        }
      },
      link: {
        style: {
          strokeWidth: 1
        }
      }
    });
  }
}
