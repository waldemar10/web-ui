import { faRefresh, faPauseCircle, faInfoCircle, faUserSecret, faTasks, faTasksAlt, faChainBroken, faCalendarWeek, faCalendarDay, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { TitleComponent, CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { Component, ElementRef, OnInit } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { environment } from 'src/environments/environment';
import { CanvasRenderer } from 'echarts/renderers';
import { interval, Subscription, forkJoin } from 'rxjs';
import { HeatmapChart } from 'echarts/charts';
import * as echarts from 'echarts/core';

import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../core/_services/main.config';
import { CookieService } from '../core/_services/shared/cookies.service';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
@PageTitle(['Dashboard'])
export class HomeComponent implements OnInit {

  username = 'Admin';

  faCalendarWeek=faCalendarWeek;
  faChainBroken=faChainBroken;
  faCheckCircle=faCheckCircle;
  faCalendarDay=faCalendarDay;
  faPauseCircle=faPauseCircle;
  faInfoCircle=faInfoCircle;
  faUserSecret=faUserSecret;
  faTasksAlt=faTasksAlt;
  faRefresh=faRefresh;
  faTasks=faTasks;

  faGithub=faGithub;

  getUsername(){
    return this.username;
  }

  // Dashboard variables
  activeAgents = 0;
  inactiveAgents = 0;
  workingAgents = 0;
  allAgents = 0;
  totalTasks = 0;
  totalCracks = 0;
  allsupertasks = 0;

  topTasks: any = [];

  private maxResults = environment.config.prodApiMaxResults;
  storedAutorefresh: any =[]
  private updateSubscription: Subscription;
  public punchCardOpts = {}
  public punchCardOptss = {}

  constructor(
    private gs: GlobalService,
    private cs: CookieService
  ) { }

  ngOnInit(): void {

    this.initData();
    this.storedAutorefresh = this.getAutoreload();
    this.onAutorefresh();
  }

  onAutorefresh(){
    if(this.storedAutorefresh.active == true){
      setTimeout(() => {
        window.location.reload()
      },this.storedAutorefresh.value*1000);
    }
  }

  // Manage Auto reload
  setAutoreload(value: any){
    const set = Number(this.storedAutorefresh.value);
    let val;
    if(value == false){
      val = true;
    }if(value == true){
      val = false;
    }
    this.cs.setCookie('autorefresh', JSON.stringify({active:val, value: set}), 365);
    this.ngOnInit();
  }

  getAutoreload(){
    return JSON.parse(this.cs.getCookie('autorefresh'));
  }

  getWorkingAgentIds(data: any): number[] {
    const filteredAgentIds: number[] = [];
    if (data.length > 0) {
      data.forEach(task => {
        task.assignedAgents.forEach(agent => {
          if (task.progress !== 100 && agent.isActive) {
            filteredAgentIds.push(agent._id);
          }
        });
      });
    }
    return filteredAgentIds;
  }  

  timeCalc(chunks, task) {
    let cprogress = [];
    let timespent = [];
    const current = 0;
  
    for (let i = 0; i < chunks.length; i++) {
      cprogress.push(chunks[i].checkpoint - chunks[i].skip);
      if (chunks[i].dispatchTime > current) {
        timespent.push(chunks[i].solveTime - chunks[i].dispatchTime);
      } else if (chunks[i].solveTime > current) {
        timespent.push(chunks[i].solveTime - current);
      }
    }
  
    const totalCProgress = cprogress.reduce((a, i) => a + i, 0);
    const totalTimespent = timespent.reduce((a, i) => a + i, 0);
  
    if (totalCProgress !== 0 && totalTimespent !== 0 && task.keyspace !== 0) {
      const estimated = (totalTimespent / (totalCProgress / task.keyspace) - totalTimespent);
      task.remainingTime = estimated;
      task.progress = parseFloat((totalCProgress / task.keyspace * 100).toFixed(2));
    } else {
      task.remainingTime = "N/A";
      task.progress = 0; 
    }
  }
  
  getTopXTasks(arr: any[], x: number) {
    const observables = arr.map(task => {
      return this.gs.getAll(SERV.CHUNKS, {'maxResults': this.maxResults, 'filter': 'taskId=' + task.taskId + ''});
    });
    
    //Makes sure all async calls are completed
    forkJoin(observables).subscribe((results: any[]) => {
      results.forEach((result, index) => {
        this.timeCalc(result.values, arr[index]);
      });
      
      const sortedArray = arr.filter(task => task.progress > 0 && task.progress < 100);
      sortedArray.sort((a, b) => a.progress - b.progress);
      this.topTasks = sortedArray.slice(0, Math.min(sortedArray.length, x));
    });
  }

  initData() {

    // Agents
    const params = {'maxResults': this.maxResults}
    const paramst = {'maxResults': this.maxResults, 'expand': 'assignedAgents'}

    this.gs.getAll(SERV.AGENTS,params).subscribe((agents: any) => {
      this.gs.getAll(SERV.TASKS,paramst).subscribe((tasks: any) => {
        let tempWorkingAgents;
        let unArchivedTasks = tasks.values.filter(u=> u.isArchived != true)

        this.totalTasks = unArchivedTasks.length;
        tempWorkingAgents = this.getWorkingAgentIds(unArchivedTasks);
        this.workingAgents = tempWorkingAgents.length;

        this.allAgents = agents.values.length;
        this.activeAgents = agents.values.filter(u => u.isActive == true && !tempWorkingAgents.includes(u.agentId)).length;
        this.inactiveAgents = agents.values.filter(u => u.isActive == false).length;

        this.getTopXTasks(tasks.values, 3);
      });
    });

    // SuperTasks
    this.gs.getAll(SERV.SUPER_TASKS,params).subscribe((stasks: any) => {
      this.allsupertasks = stasks.total | 0;
    });
    	
    // Cracks
    const paramsCracked = {'maxResults': this.maxResults }

    this.gs.getAll(SERV.HASHLISTS,paramsCracked).subscribe((hashes: any) => {
      let lastseven:any = new Date() ;
      lastseven = lastseven.setDate(lastseven.getDate() - 7).valueOf()/1000;
      const lastsevenObject = hashes.values.filter(u=> (u.isCracked == true && u.timeCracked > lastseven ));
      this.totalCracks = lastsevenObject.length | 0;
      this.initCrackCard(hashes.values);
    });

  }

  // Graphs Section

  initCrackCard(obj: any){

    const date_today = new Date();
    const year = (new Date()).getFullYear();
    const first_day_of_the_week = new Date(date_today.setDate(date_today.getDate() - date_today.getDay() ));
    const epochtime = Math.round(first_day_of_the_week.setDate(first_day_of_the_week.getDate()).valueOf()/1000);

    const filterdate = obj.filter(u=> (u.isCracked == true ));

    const arr = [];
    for(let i=0; i < filterdate.length; i++){
      const date:any = new Date(filterdate[i]['timeCracked']* 1000);
      const iso = date.getUTCFullYear()+'-'+(date.getUTCMonth() + 1)+'-'+date.getUTCDate();
      arr.push([iso]);
    }

    const counts = arr.reduce((p, c) => {
      const weekd = c[0];
      if (!p.hasOwnProperty(weekd)) {
        p[weekd] = 0;
      }
      p[weekd]++;
      return p;
    }, {});

    const countsExtended = Object.keys(counts).map(k => {
      return [k, counts[k]]
    }, {});

    echarts.use([
      TitleComponent,
      CalendarComponent,
      TooltipComponent,
      VisualMapComponent,
      HeatmapChart,
      CanvasRenderer
    ]);

    const chartDom = document.getElementById('pcard');
    const myChart = echarts.init(chartDom);
    let option;

    option = {
      title: {},
      tooltip: {
        position: 'top',
        formatter: function (p) {
          const format = echarts.time.format(p.data[0], '{dd}-{MM}-{yyyy}', false);
          return format + ': ' + p.data[1];
        }
      },
      visualMap: {
        min: 0,
        max: 300,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        top: 65
      },
      calendar: {
        top: 120,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: year,
        itemStyle: {
          borderWidth: 0.5
        },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: countsExtended,
        label: {
          show: true,
          formatter: function (p) {
            if(date_today.getDate() == p.data[0]){
              return 'X';
            }
            else{
              return '';
            }
          }
        },
      }
    };
    option && myChart.setOption(option);
  }
}

