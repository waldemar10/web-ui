import { Component, Input, OnInit } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {

  @Input() chartTitle: string;
  @Input() tasks: any[];

  chart: any;

  ngOnInit() {
    this.chart = echarts.init(document.getElementById('progress-bar-tasks'));
    this.chart.setOption({
      title: {
        text: this.chartTitle,
        x: 'center'
      },
      yAxis: {
        type: 'category',
        data: ['Task 3',  'Task 2', 'Task 1']
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          data: [
            {value: 10, itemStyle:{color: 'red'}},
            {value: 40, itemStyle:{color: 'blue'}},
            {value: 100, itemStyle:{color: 'green'}},
          ],
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          }
        }
      ],
      tooltip: {
        formatter: '{b}: {c}%',
      },
    });
  }
  
}
