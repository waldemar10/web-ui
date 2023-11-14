import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {

  @Input() hashes: any[];
  @Input() chartTitle: string;

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
  testData: any = this.getTopXHashes(this.hashlistData, 4);

  getTopXHashes(arr: any[], x: number) {
    arr.forEach((hash) => {
      hash.progress = Math.floor((hash.cracked / hash.hashes) * 100)
    });

    const sortedArray = arr.sort((a, b) => a.progress - b.progress);

    const topHashes = sortedArray.slice(0, Math.min(sortedArray.length, x));
    console.log(topHashes);
    return topHashes;
  }

  toggleChartData(event: any) {
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
        data: this.testData.map((hash) => hash.name),
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
          data: this.testData.map((hash) => hash.progress),
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
