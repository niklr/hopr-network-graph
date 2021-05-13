import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { CytoscapeComponent } from './components/cytoscape/cytoscape.component';
import { D3Component } from './components/d3/d3.component';
import { GraphComponent } from './components/graph/graph.component';
import { LogsComponent } from './components/logs/logs.component';
import { ConfigService } from './services/config.service';
import { BrowserFileUtil } from './utils/browser-file.util';
import { FileUtil } from './utils/file.util';

export function initConfig(config: ConfigService) {
  return () => config.initAsync();
}

@NgModule({
  declarations: [
    AppComponent,
    CytoscapeComponent,
    D3Component,
    GraphComponent,
    LogsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    {
      provide: FileUtil,
      useClass: BrowserFileUtil
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [ConfigService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
