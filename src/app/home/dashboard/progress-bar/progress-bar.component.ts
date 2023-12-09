import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';
import { SecondsToTimePipe } from 'src/app/core/_pipes/secondsto-time.pipe';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  providers: [SecondsToTimePipe]
})
export class ProgressBarComponent implements OnInit, OnChanges {

  @Input() tasks: any[];

  constructor(private secToTime: SecondsToTimePipe) {}

  chart: any;

  formatEstimatedTime(seconds: number): string {
    return this.secToTime.transform(seconds);
  }

  toggleChartData(event: any) {
  }

  ngOnInit() {
    this.chart = echarts.init(document.getElementById("progress-bar"));
    this.chart.setOption({
      title: {
        text: 'Progress',
        x: 'center'
      },
      yAxis: {
        type: 'category',
        data: this.tasks.map((task) => task.taskName),
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          data: this.tasks.map((task) => ({
            value: task.progress,
            itemStyle: {
              color: task.color
            },
            estimated: task.remainingTime,
          })),
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          }
        }
      ],
      tooltip: {
        formatter: (params) => {
            const task = params.data;
            return `${params.name} Progress: ${task.value}% <br> Estimated Time: ${this.formatEstimatedTime(task.estimated)}`;
        },
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['tasks'])
    {
      this.tasks = changes['tasks'].currentValue;
    }

    this.updateData();
  }

  private updateData(): void { 
    this.chart.setOption({
      series: [
        {
          data: this.tasks.map((task) => ({
            value: task.progress,
            itemStyle: {
              color: task.color
            },
            estimated: task.remainingTime,
          })),
        },
      ],
      yAxis: [
        {
          data: this.tasks.map((task) => task.taskName),
        }
      ],
      tooltip: {
        formatter: (params) => {
            const task = params.data;
            return `${params.name} Progress: ${task.value}% <br> Estimated Time: ${this.formatEstimatedTime(task.estimated)}`;
        },
      },
    });
  }

}
