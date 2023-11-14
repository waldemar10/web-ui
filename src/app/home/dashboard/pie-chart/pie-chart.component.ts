import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html'
})
export class PieChartComponent implements OnInit {
  @Input() public availableAgents: number;
  @Input() public unavailableAgents: number;
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
            { value: this.workingAgents, name: 'Active Agents' },
            { value: this.availableAgents, name: 'Available Agents' },
            { value: this.unavailableAgents, name: 'Unavailable Agents' }
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
    if(changes['availableAgents'])
    {
      this.availableAgents = changes['availableAgents'].currentValue;
    }
    if(changes['unavailableAgents'])
    {
      this.unavailableAgents = changes['unavailableAgents'].currentValue;
    }
   
    this.updateData()
  }

  private updateData(): void {
    this.chart.setOption({
      series: [
        {
          data: [
            { value: this.workingAgents, name: 'Active Agents' },
            { value: this.availableAgents, name: 'Available Agents' },
            { value: this.unavailableAgents, name: 'Unavailable Agents' }
          ],
        },
      ],
    });
  }
  
}