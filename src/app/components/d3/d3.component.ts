import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subject, Subscription } from 'rxjs';
import { AppConstants } from 'src/app/app.constants';
import { ChainTxEventType } from 'src/app/enums/chain.enum';
import { GraphElementType } from '../../enums/graph.enum';
import { EdgeDataModel, EdgeGraphModel, GraphScratchModel, NodeDataModel, NodeGraphModel } from '../../models/graph.model';

@Component({
  selector: 'hopr-d3',
  templateUrl: './d3.component.html',
  styleUrls: ['./d3.component.css']
})
export class D3Component implements OnInit, OnDestroy {

  @Input() public subject: Subject<any>;

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private width: number;
  private height: number;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private edge: d3.Selection<d3.BaseType | SVGLineElement, unknown, SVGGElement, unknown>;
  private node: d3.Selection<d3.BaseType | SVGCircleElement, unknown, SVGGElement, unknown>;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;
  private isSimulating = false;
  private isDestroyed = false;
  private connectedLookup: any = {};
  private subs: Subscription[] = [];

  constructor() {

  }

  ngOnInit(): void {
    if (this.subject) {
      const sub1 = this.subject.subscribe({
        next: (data) => {
          if (!this.isDestroyed) {
            this.render(data);
          }
        }
      });
      this.subs.push(sub1);
    }
  }

  ngOnDestroy(): void {
    console.log('D3 destroy called.');
    this.simulation?.stop();
    this.isDestroyed = true;
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
    this.subs = [];
  }

  private render(data: any): void {
    console.log('D3 render started.');
    this.width = this.containerElementRef.nativeElement.clientWidth;
    this.height = this.containerElementRef.nativeElement.clientHeight;
    this.createSvg();
    if (data) {
      const nodes = data.nodes.map((e: NodeGraphModel) => {
        return {
          type: GraphElementType.NODE,
          id: e.data.id,
          name: e.data.name,
          weight: e.data.weight
        };
      });
      const edges = data.edges.map((e: EdgeGraphModel) => {
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
      this.simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id((d: any) => d.id))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .on('end', () => {
          this.isSimulating = false;
        });
      this.isSimulating = true;

      this.edge = this.g
        .selectAll('line')
        .data(edges)
        .join('line')
        .attr('stroke', (d: any) => {
          if (d?.transfer?.type) {
            switch (d.transfer.type) {
              case ChainTxEventType.MINT:
                return AppConstants.TX_EVENT_MINT_COLOR;
              case ChainTxEventType.BURN:
                return AppConstants.TX_EVENT_BURN_COLOR;
              default:
                break;
            }
          }
          return AppConstants.TX_EVENT_TRANSFER_COLOR;
        })
        .attr('stroke-opacity', 0.6)
        .attr('class', 'graphElement')
        .attr('stroke-width', 2)
        .on('click', this.handleEdgeClick);

      this.node = this.g
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('class', 'graphElement')
        .attr('r', (d: any) => Math.max(5, (d.weight / 10) + 5))
        .attr('fill', AppConstants.NODE_COLOR)
        .on('click', this.handleNodeClick)
        .call(this.drag());

      this.node.append('title')
        .text((d: any) => d.id);

      this.simulation.on('tick', () => {
        this.isSimulating = true;
        this.edge
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
        this.node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);
      });

      this.connectedLookup = {};
      edges.forEach((d: any) => {
        this.connectedLookup[`${d.source.id},${d.target.id}`] = true;
      });

      this.center(0);
    }
  }

  private createSvg(): void {
    d3.select('#svgContainer').remove();
    this.svg = d3.select('#container')
      .append('svg')
      .attr('id', 'svgContainer')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', [-this.width / 2, -this.height / 2, this.width, this.height].toString())
      .on('click', () => {
        this.g.selectAll('g > .graphElement').style('opacity', 1);
        this.selectEmitter.emit(undefined);
      });

    this.g = this.svg.append('g');

    this.zoom = d3.zoom()
      .extent([[0, 0], [this.width, this.height]])
      .scaleExtent([0, 10])
      .on('zoom', (e: any) => {
        this.g.attr('transform', e.transform);
      });
    this.svg.call(this.zoom);
  }

  private drag(): any {
    const dragstarted = (event: any, d: any) => {
      if (!event.active) {
        this.simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: any, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event: any, d: any) => {
      if (!event.active) {
        this.simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    };

    return d3.drag()
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

  private handleClick(event: any): void {
    event.stopPropagation();
    this.g.selectAll('.graphElement').style('opacity', 0);
    d3.select(event.target).style('opacity', 1);
  }

  private handleNodeClick = (event: any, d: any) => {
    this.handleClick(event);

    this.node.style('opacity', (o: any) => {
      if (o.id === d.id) {
        return 1;
      }
      if (this.isConnected(o.id, d.id)) {
        return 0.5;
      }
      return 0;
    });

    this.edge.style('opacity', (o: any) => {
      if (o.source.id === d.id || o.target.id === d.id) {
        return 1.0;
      }
      return 0;
    });

    this.selectEmitter.emit(new NodeGraphModel({
      data: new NodeDataModel({
        id: d.id,
        name: d.name,
        weight: d.weight
      })
    }));
  }

  private handleEdgeClick = (event: any, d: any) => {
    this.handleClick(event);

    this.node.style('opacity', (o: any) => {
      if (o.id === d.source.id || o.id === d.target.id) {
        return 1.0;
      }
      return 0;
    });

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
  }

  private center(count: number): void {
    if (!this.isDestroyed) {
      const { width, height } = this.g.node().getBBox();
      if (width && height) {
        const scale = Math.min(this.width / width, this.height / height) * 0.8;
        if (scale < 10) {
          this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(0, 0).scale(scale));
        }
      }
      if (this.isSimulating && count < 5) {
        setTimeout(() => {
          this.center(++count);
        }, 1000);
      }
    }
  }
}
