import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { DataTablesModule } from "angular-datatables";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatGridListModule } from '@angular/material/grid-list';

import { ComponentsModule } from "../shared/components.module";
import { PipesModule } from "../shared/pipes.module";
import { HomeComponent } from "./home.component";
import { HomeRoutingModule } from "./home-routing.module";
import { PieChartComponent } from './dashboard/pie-chart/pie-chart.component';

@NgModule({
  declarations:[
    HomeComponent,
    PieChartComponent
  ],
  imports:[
    ReactiveFormsModule,
    HomeRoutingModule,
    FontAwesomeModule,
    DataTablesModule,
    ComponentsModule,
    CommonModule,
    RouterModule,
    PipesModule,
    FormsModule,
    NgbModule,
    DragDropModule,
    MatGridListModule,
 ]
})
export class HomeModule {}

