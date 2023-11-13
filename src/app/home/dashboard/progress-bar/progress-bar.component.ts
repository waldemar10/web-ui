import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {

  @Input() hashes: any[];

  data: any = [
    { name: "hash1", cracked: 3, hashes: 32 },
    { name: "hash2", cracked: 10, hashes: 20 },
    { name: "hash3", cracked: 30, hashes: 35 },
    { name: "hash3", cracked: 25, hashes: 35 },
  ]

  chart: any;

  getTopXHashes(arr: any[], x: any) {
    arr.forEach((hash) => {
      hash.progress = Math.floor((hash.cracked / hash.hashes) * 100)
    });

    const sortedArray = arr.sort((a, b) => b.progress - a.progress);

    const topHashes = sortedArray.slice(0, Math.min(sortedArray.length, x));
    console.log(topHashes);
    return topHashes;
  }

  testData = this.getTopXHashes(this.data, 3);

  ngOnInit() {
    this.chart = echarts.init(document.getElementById('progress-bar'));
    this.chart.setOption({
      title: {
        text: 'Hashlist Progress',
        x: 'center'
      },
      yAxis: {
        type: 'category',
        data: this.testData.map((hash) => hash.name)
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
