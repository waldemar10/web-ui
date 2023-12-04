import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
})
export class ProgressBarComponent implements OnInit, OnChanges {

  @Input() tasks: any[];

  hashlistData: any = [
    { name: "A", cracked: 3, hashes: 32 },
    { name: "B", cracked: 10, hashes: 20 },
    { name: "C", cracked: 30, hashes: 35 },
    { name: "D", cracked: 25, hashes: 35 },
  ]

  superHashlistData: any = [
    { name: "S-A", cracked: 13, hashes: 32 },
    { name: "S-B", cracked: 8, hashes: 20 },
    { name: "S-C", cracked: 27, hashes: 35 },
    { name: "S-D", cracked: 5, hashes: 35 },
  ]

  chart: any;

  toggleChartData(event: any) {
    /*
    //checked = false -> hashlists
    const isChecked = (event.target as HTMLInputElement).checked;
    
    if(!isChecked){
      this.testData = this.getTopXHashes(this.hashlistData, 3);
    } else {
      this.testData = this.getTopXHashes(this.superHashlistData, 4);
    }

    this.chart.setOption({
      yAxis: [
        {
          data: this.testData.map((hash) => hash.name)
        }
      ],
      series: [
        {
          data: this.testData.map((hash) => hash.progress),
        }
      ],
    });
    */
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
            }
          })),
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

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.tasks);
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
            }
          })),
        },
      ],
      yAxis: [
        {
          data: this.tasks.map((task) => task.taskName),
        }
      ],
      tooltip: {
        formatter: '{b}: {c}%',
      },
    });
  }

}
