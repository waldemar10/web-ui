import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html'
})
export class PieChartComponent implements OnInit {
  @Input() public activeAgents: number;
  @Input() public inactiveAgents: number;
  @Input() public workingAgents: number;

  chart: any;

  ngOnInit() {
    this.chart = echarts.init(document.getElementById('pieChart'));
    this.chart.setOption({
      tooltip: {
        trigger: 'item',
      },
      label: {
        show: false,
      },
      legend: {
        left: 'left',
        top: "center",
        orient: "vertical"
      },
      series: [
        {
          name: 'Pie Chart',
          type: 'pie',
          radius: '75%',
          left: '60%',
          label: {
            show: false,
          },
          data: [
            { value: this.workingAgents, name: 'Working Agents' },
            { value: this.activeAgents, name: 'Active Agents', itemStyle: {color: "green"} },
            { value: this.inactiveAgents, name: 'Inactive Agents', itemStyle: {color: "darkorange"} }
          ],
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['workingAgents'])
    {
      this.workingAgents = changes['workingAgents'].currentValue;
    }
    if(changes['activeAgents'])
    {
      this.activeAgents = changes['activeAgents'].currentValue;
    }
    if(changes['inactiveAgents'])
    {
      this.inactiveAgents = changes['inactiveAgents'].currentValue;
    }
   
    this.updateData()
  }

  private updateData(): void {
    this.chart.setOption({
      series: [
        {
          data: [
            { value: this.workingAgents, name: 'Working Agents' },
            { value: this.activeAgents, name: 'Active Agents', itemStyle: {color: "green"}, },
            { value: this.inactiveAgents, name: 'Inactive Agents', itemStyle: {color: "darkorange"} }
          ],
        },
      ],
    });
  }
  
}