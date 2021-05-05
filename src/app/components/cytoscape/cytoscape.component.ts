import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import klay from 'cytoscape-klay';
import { Subject, Subscription } from 'rxjs';
import { EdgeDataModel, EdgeGraphModel, GraphScratchModel, NodeDataModel, NodeGraphModel } from '../../models/graph.model';

@Component({
  selector: 'hopr-cytoscape',
  templateUrl: './cytoscape.component.html',
  styleUrls: ['./cytoscape.component.css'],
})

export class CytoscapeComponent implements OnInit, OnDestroy {

  @Input() public style: any;
  @Input() public layout: any;
  @Input() public zoom: any;
  @Input() public subject: Subject<any>;

  @Output() selectEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('containerElementRef') containerElementRef: ElementRef;

  private subs: Subscription[] = [];

  public constructor() {

    cytoscape.use(fcose);
    cytoscape.use(klay);

    this.layout = this.layout || {
      name: 'grid',
      animtae: false,
      spacingFactor: 2
    };

    this.zoom = this.zoom || {
      min: 0.01,
      max: 3.0
    };

    this.style = this.style || [
      {
        selector: 'node',
        style: {
          'height': 'mapData(weight, 1, 100, 20, 60)',
          'width': 'mapData(weight, 1, 100, 20, 60)',
          'font-size': 'mapData(weight, 1, 100, 5, 10)',
          // 'content': 'data(name)',
          'text-valign': 'center',
          'color': '#fff'
        }
      },
      {
        selector: ':selected',
        style: {
          'border-width': 3,
          'border-color': 'black'
        }
      },
      {
        selector: 'edge',
        style: {
          // 'curve-style': 'bezier',
          'curve-style': 'straight',
          // 'curve-style': 'haystack',
          'opacity': 0.666,
          'width': 1,
          // 'width': 'mapData(strength, 1, 100, 1, 10)',
          // 'target-arrow-shape': 'triangle'
        }
      },
      {
        selector: '.faded',
        style: {
          'opacity': 0,
          'text-opacity': 0
        }
      }
    ];
  }

  ngOnInit(): void {
    if (this.subject) {
      const sub1 = this.subject.subscribe({
        next: (data) => this.render(data)
      });
      this.subs.push(sub1);
    }
  }

  public ngOnDestroy(): any {
    console.log('Cytoscape destroy called.');
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
    this.subs = [];
  }

  public render(data: any): void {
    console.log('Cytoscape render started.');
    const cy = cytoscape({
      container: this.containerElementRef.nativeElement,
      layout: this.layout,
      minZoom: this.zoom.min,
      maxZoom: this.zoom.max,
      style: this.style,
      elements: data,
    });

    cy.on('tap', 'node', (e: any) => {
      const node: cytoscape.NodeSingular = e.target;
      if (node.selected()) {
        node.unselect();
        this.unselectAll(cy);
      } else {
        const neighborhood = node.neighborhood().add(node);
        cy.elements().addClass('faded');
        neighborhood.removeClass('faded');
        this.selectEmitter.emit(new NodeGraphModel({
          data: new NodeDataModel({
            id: node.data('id'),
            name: node.data('name'),
            weight: node.data('weight')
          })
        }));
      }
    });

    cy.on('tap', 'edge', (e: any) => {
      const edge: cytoscape.EdgeSingular = e.target;
      if (edge.selected()) {
        edge.unselect();
        this.unselectAll(cy);
      } else {
        cy.elements().addClass('faded');
        edge.removeClass('faded');
        edge.source().removeClass('faded');
        edge.target().removeClass('faded');
        this.selectEmitter.emit(new EdgeGraphModel({
          data: new EdgeDataModel({
            source: edge.data('source'),
            target: edge.data('target'),
            strength: edge.data('strength')
          }),
          scratch: new GraphScratchModel({
            transfer: edge.scratch('transfer')
          })
        }));
      }
    });

    cy.on('tap', (e: any) => {
      if (e.target === cy) {
        this.unselectAll(cy);
      }
    });
  }

  private unselectAll(cy: cytoscape.Core): void {
    cy.elements().removeClass('faded');
    this.selectEmitter.emit(undefined);
  }
}
