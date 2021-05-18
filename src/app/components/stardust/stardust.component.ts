import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as Stardust from 'stardust-core';
import * as StardustWebGL from 'stardust-webgl';
import { GraphElementType } from '../../enums/graph.enum';
import { EdgeGraphModel, GraphContainerModel, NodeGraphModel } from '../../models/graph.model';
import { GraphService } from '../../services/graph.service';
import { GraphUtil } from '../../utils/graph.util';
import { SharedGraphLibComponent } from '../shared/shared-graph-lib.component';

@Component({
  selector: 'hopr-stardust',
  templateUrl: './stardust.component.html',
  styleUrls: ['./stardust.component.css']
})
export class StardustComponent extends SharedGraphLibComponent implements OnInit, OnDestroy {

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private width: number;
  private height: number;
  private canvas: HTMLElement;
  private canvasContainer: d3.Selection<HTMLCanvasElement, unknown, HTMLElement, any>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private edges: any;
  private nodes: any;
  private selectedElement: any;
  private isSelectionPermanent: boolean;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;
  private transform: any;
  private platform: StardustWebGL.WebGLPlatform;
  private positions: Stardust.ArrayBinding;
  private starNodes: Stardust.Mark;
  private starNodesBg: Stardust.Mark;
  private starNodesSelected: Stardust.Mark;
  private starEdges: Stardust.Mark;
  private starEdgesSelected: Stardust.Mark;
  private starNodeText: Stardust.Mark;
  private starEdgeText: Stardust.Mark;

  constructor(protected graphService: GraphService) {
    super(graphService);
    const webGLversion = StardustWebGL.version;
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
    console.log('Stardust stop simulation called.');
    this.simulation?.stop();
    this.graphService.isSimulating = false;
  }

  protected init(data: GraphContainerModel): void {
    console.log('Stardust init called.');
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

      function mapColor(color: number[], opacity: number = 1) {
        return [color[0] / 255, color[1] / 255, color[2] / 255, opacity];
      }

      this.starNodes.attr('radius', 2).attr('color', mapColor([31, 119, 180]));
      this.starNodesBg.attr('radius', 3).attr('color', mapColor([255, 255, 255], 0.5));
      this.starNodesSelected.attr('radius', 4).attr('color', mapColor([228, 26, 28]));
      this.starEdges.attr('width', 1).attr('color', mapColor([169, 169, 169]));
      this.starEdgesSelected.attr('width', 1).attr('color', mapColor([228, 26, 28]));
      this.starNodeText.attr('text', (d: any) => d.name)
        // .attr('up', [0, 1])
        .attr('fontFamily', 'Arial')
        .attr('fontSize', 12)
        // .attr('scale', d => this.transform.k)
        // .attr('scale', d => 1 + Math.sin(d) / 2)
        .attr('color', mapColor([0.5, 0.5, 0.5], 1));
      this.starEdgeText.attr('text', (d: any) => d.transfer?.argsAmount ?? d.type)
        .attr('fontFamily', 'Arial')
        .attr('fontSize', 10)
        .attr('color', mapColor([0.5, 0.5, 0.5], 1));

      this.positions = Stardust.array()
        .value(d => [
          d.x * this.transform.k + this.transform.x,
          d.y * this.transform.k + this.transform.y
        ])
        .data(this.nodes);

      const edgePositions = Stardust.array()
        .value(d => [
          ((d.source.x * this.transform.k + this.transform.x) + (d.target.x * this.transform.k + this.transform.x)) / 2,
          ((d.source.y * this.transform.k + this.transform.y) + (d.target.y * this.transform.k + this.transform.y)) / 2
        ])
        .data(this.edges);

      const positionScale = Stardust.scale.custom('array(pos, value)').attr('pos', 'Vector2Array', this.positions);
      const edgePositionScale = Stardust.scale.custom('array(pos, value)').attr('pos', 'Vector2Array', edgePositions);

      this.starNodes.attr('center', positionScale(d => d.index));
      this.starNodesBg.attr('center', positionScale(d => d.index));
      this.starNodesSelected.attr('center', positionScale(d => d.index));
      this.starNodeText.attr('position', positionScale(d => d.index));
      this.starEdges.attr('p1', positionScale(d => d.source.index));
      this.starEdges.attr('p2', positionScale(d => d.target.index));
      this.starEdgesSelected.attr('p1', positionScale(d => d.source.index));
      this.starEdgesSelected.attr('p2', positionScale(d => d.target.index));
      this.starEdgeText.attr('position', edgePositionScale(d => d.index));

      this.starNodes.data(this.nodes);
      this.starNodesBg.data(this.nodes);
      this.starNodeText.data(this.nodes);
      this.starEdges.data(this.edges);
      this.starEdgeText.data(this.edges);

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
        // positions.data(this.nodes);
        this.requestRender();
      });

      this.requestRender();

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

    if (this.selectedElement) {
      switch (this.selectedElement.type) {
        case GraphElementType.NODE:
          this.starNodesSelected.data([this.selectedElement]);
          this.starEdgesSelected.data([]);
          break;
        case GraphElementType.EDGE:
          this.starEdgesSelected.data([this.selectedElement]);
          this.starNodesSelected.data([]);
          break;
        default:
          break;
      }
    } else {
      this.starEdgesSelected.data([]);
      this.starNodesSelected.data([]);
    }

    // Cleanup and re-render.
    // this.platform.clear([1, 1, 1, 1]);
    this.starEdges.attr('width', (d: any) => GraphUtil.calculateEdgeWidth(d.strength) * this.transform.k);
    this.starEdges.render();
    this.starEdgesSelected.attr('width', (d: any) => GraphUtil.calculateEdgeWidth(d.strength) * this.transform.k + 1);
    this.starEdgesSelected.render();
    this.starNodesBg.attr('radius', (d: any) => GraphUtil.calculateNodeRadius(d.weight) * this.transform.k + 1);
    this.starNodesBg.render();
    this.starNodes.attr('radius', (d: any) => GraphUtil.calculateNodeRadius(d.weight) * this.transform.k);
    this.starNodes.render();
    this.starNodesSelected.attr('radius', (d: any) => GraphUtil.calculateNodeRadius(d.weight) * this.transform.k);
    this.starNodesSelected.render();
    this.starNodeText.attr('scale', this.transform.k);
    this.starNodeText.render();
    this.starNodeText.attr('alignX', 0.5);
    this.starNodeText.attr('alignY', 0.5);

    this.starEdgeText.attr('scale', this.transform.k);
    this.starEdgeText.render();
    this.starEdgeText.attr('alignX', 0.5);
    this.starEdgeText.attr('alignY', 0.5);

    // Render the picking buffer.
    this.platform.beginPicking(this.width, this.height);
    this.starEdges.render();
    this.starNodes.render();
    this.platform.endPicking();
  }

  private createCanvas(): void {
    const canvasId = 'mainCanvas';
    d3.select('#' + canvasId).remove();
    this.canvasContainer = d3.select('#container')
      .append('canvas')
      .attr('id', canvasId)
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', () => {
        // this.base.selectAll('.graphElement').style('opacity', 1);
        this.selectEmitter.emit(undefined);
      });

    this.canvas = document.getElementById(canvasId);
    this.platform = Stardust.platform('webgl-2d', this.canvas, this.width, this.height) as StardustWebGL.WebGLPlatform;
    // this.platform.pixelRatio = window.devicePixelRatio || 1;

    this.starNodes = Stardust.mark.create(Stardust.mark.circle(), this.platform);
    this.starNodesBg = Stardust.mark.create(Stardust.mark.circle(), this.platform);
    this.starNodesSelected = Stardust.mark.create(Stardust.mark.circle(), this.platform);
    this.starEdges = Stardust.mark.create(Stardust.mark.line(), this.platform);
    this.starEdgesSelected = Stardust.mark.create(Stardust.mark.line(), this.platform);
    this.starNodeText = Stardust.mark.createText('2d', this.platform);
    this.starEdgeText = Stardust.mark.createText('2d', this.platform);

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
    this.canvasContainer.call(this.zoom);

    this.registerMouseMoveEvent();
  }

  private registerMouseMoveEvent(): void {
    this.canvas.onmousemove = (e: any) => {
      const x = e.clientX - this.canvas.getBoundingClientRect().left;
      const y = e.clientY - this.canvas.getBoundingClientRect().top;
      const p = this.platform.getPickingPixel(x, y);
      if (p) {
        const element = p[0].data()[p[1]];
        if (this.selectedElement !== element) {
          this.selectedElement = element;
          super.handleSelectedElement(element);
          this.requestRender();
        }
      } else {
        if (this.selectedElement != null && !this.isSelectionPermanent) {
          this.selectedElement = null;
          this.requestRender();
        }
      }
    };
  }

  private center(count: number): void {
    if (false && !this.state.isDestroyed && !this.state.isZoomed) {
      const width = this.canvasContainer.node().clientWidth;
      const height = this.canvasContainer.node().clientHeight;
      // TODO: set min/max nodes
      console.log(width, height);
      if (width && height) {
        const scale = Math.min(this.width / width, this.height / height) * 0.8;
        if (count > 0) {
          console.log(width, height, scale);
          this.canvasContainer.transition()
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