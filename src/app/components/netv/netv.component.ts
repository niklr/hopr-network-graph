import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import NetV from 'netv';
import { GraphElementType } from '../../enums/graph.enum';
import { EdgeGraphModel, GraphContainerModel, NodeGraphModel } from '../../models/graph.model';
import { GraphService } from '../../services/graph.service';
import { SharedGraphLibComponent } from '../shared/shared-graph-lib.component';

@Component({
  selector: 'hopr-netv',
  templateUrl: './netv.component.html',
  styleUrls: ['./netv.component.css']
})
export class NetvComponent extends SharedGraphLibComponent implements OnInit, OnDestroy {

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private width: number;
  private height: number;
  private canvas: any;
  private edges: any;
  private nodes: any;
  private data: any;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;
  private connectedLookup: any = {};

  constructor(protected graphService: GraphService) {
    super(graphService);
  }

  ngOnInit(): void {
    super.onInit();
  }

  ngOnDestroy(): void {
    super.onDestroy();
  }

  protected destroy(): void {
    this.stopSimulation();
  }

  private stopSimulation(): void {
    console.log('NetV stop simulation called.');
    this.simulation?.stop();
    this.graphService.isSimulating = false;
  }

  protected init(data: GraphContainerModel): void {
    console.log('NetV init called.');
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
