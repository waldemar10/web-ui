import { TitleComponent, TitleComponentOption, ToolboxComponent, ToolboxComponentOption, TooltipComponent, TooltipComponentOption, GridComponent, GridComponentOption, VisualMapComponent, VisualMapComponentOption, DataZoomComponent, DataZoomComponentOption, MarkLineComponent, MarkLineComponentOption } from 'echarts/components';
import { faHomeAlt, faEye, faEraser, faLock, faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { environment } from './../../../environments/environment';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import { FormControl, FormGroup } from '@angular/forms';
import { DataTableDirective } from 'angular-datatables';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Observable, Subject } from 'rxjs';
import * as echarts from 'echarts/core';

import { PendingChangesGuard } from 'src/app/core/_guards/pendingchanges.guard';
import { UIConfigService } from 'src/app/core/_services/shared/storage.service';
import { GlobalService } from 'src/app/core/_services/main.service';
import { colorpicker } from '../../core/_constants/settings.config';
import { FileSizePipe } from 'src/app/core/_pipes/file-size.pipe';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../core/_services/main.config';

@Component({
  selector: 'app-edit-tasks',
  templateUrl: './edit-tasks.component.html',
  providers: [FileSizePipe]
})
@PageTitle(['Edit Task'])
export class EditTasksComponent implements OnInit,PendingChangesGuard {

  editMode = false;
  editedTaskIndex: number;
  taskWrapperId: number;
  editedTask: any // Change to Model

  faPencil=faPencil;
  faEraser=faEraser;
  faHome=faHomeAlt;
  faTrash=faTrash;
  faLock=faLock;
  faEye=faEye;

  private maxResults = environment.config.prodApiMaxResults;

  constructor(
    private uiService:UIConfigService,
    private route: ActivatedRoute,
    private gs: GlobalService,
    private fs:FileSizePipe,
    private router: Router
  ) { }

  updateForm: FormGroup;
  createForm: FormGroup; // Assign Agent
  colorpicker=colorpicker;
  color = '';

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtTrigger1: Subject<any> = new Subject<any>();
  dtOptions: any = {};
  dtOptions1: any = {};
  tusepreprocessor: any;
  hashlistDescrip:any;
  hashlistinform:any;
  assigAgents: any;
  availAgents:any;
  crackerinfo:any;
  tkeyspace: any;
  getchunks: any;
  getFiles: any;

  ngOnInit() {

    this.route.params
    .subscribe(
      (params: Params) => {
        this.editedTaskIndex = +params['id'];
        this.editMode = params['id'] != null;
        this.initForm();
        this.assignChunksInit(this.editedTaskIndex);
      }
    );

    this.updateForm = new FormGroup({
      'taskId': new FormControl({value: '', disabled: true}),
      'forcePipe': new FormControl({value: '', disabled: true}),
      'skipKeyspace': new FormControl({value: '', disabled: true}),
      'keyspace': new FormControl({value: '', disabled: true}),
      'keyspaceProgress': new FormControl({value: '', disabled: true}),
      'crackerBinaryId': new FormControl({value: '', disabled: true}),
      'chunkSize': new FormControl({value: '', disabled: true}),
      'updateData': new FormGroup({
        'taskName': new FormControl(''),
        'attackCmd': new FormControl(''),
        'notes': new FormControl(''),
        'color': new FormControl(''),
        'chunkTime': new FormControl(''),
        'statusTimer': new FormControl(''),
        'priority': new FormControl(''),
        'maxAgents': new FormControl(''),
        'isCpuTask': new FormControl(''),
        'isSmall': new FormControl(''),
      }),
    });

    this.createForm = new FormGroup({
      'agentId': new FormControl(),
    });

  }

  OnChangeValue(value){
    this.updateForm.patchValue({
      updateData:{color: value}
    });
  }

  onSubmit(){
    if (this.updateForm.valid) {
      this.gs.update(SERV.TASKS,this.editedTaskIndex,this.updateForm.value['updateData']).subscribe(() => {
          Swal.fire({
            title: "Success",
            text: "Task updated!",
            icon: "success",
            showConfirmButton: false,
            timer: 1500
          });
          this.updateForm.reset(); // success, we reset form
          this.router.navigate(['tasks/show-tasks']);
        }
      );
    }
  }

  private initForm() {
    if (this.editMode) {
    this.gs.get(SERV.TASKS,this.editedTaskIndex, {'expand': 'hashlist,speeds,crackerBinary,crackerBinaryType,files'}).subscribe((result)=>{
      this.color = result['color'];
      this.getFiles = result.files;
      this.crackerinfo = result.crackerBinary;
      this.taskWrapperId - result.taskWrapperId;
      // Graph Speed
      this.initTaskSpeed(result.speeds);
      // Assigned Agents init
      this.assingAgentInit();
      // Hashlist Description and Type
      this.hashlistinform =  result.hashlist[0];
      this.gs.getAll(SERV.HASHTYPES,{'filter': 'hashTypeId='+result.hashlist[0]['hashTypeId']+''}).subscribe((htypes: any) => {
       this.hashlistDescrip = htypes.values[0].description;
      })
      this.tkeyspace = result['keyspace'];
      this.tusepreprocessor = result['preprocessorId'];
      this.updateForm = new FormGroup({
        'taskId': new FormControl(result['taskId']),
        'forcePipe': new FormControl({value: result['forcePipe']== true? 'Yes':'No', disabled: true}),
        'skipKeyspace': new FormControl({value: result['skipKeyspace'] > 0?result['skipKeyspace']:'N/A', disabled: true}),
        'keyspace': new FormControl({value: result['keyspace'], disabled: true}),
        'keyspaceProgress': new FormControl({value: result['keyspaceProgress'], disabled: true}),
        'crackerBinaryId': new FormControl(result['crackerBinaryId']),
        'chunkSize': new FormControl({value: result['chunkSize'], disabled: true}),
        'updateData': new FormGroup({
          'taskName': new FormControl(result['taskName']),
          'attackCmd': new FormControl(result['attackCmd']),
          'notes': new FormControl(result['notes']),
          'color': new FormControl(result['color']),
          'chunkTime': new FormControl(Number(result['chunkTime'])),
          'statusTimer': new FormControl(result['statusTimer']),
          'priority': new FormControl(result['priority']),
          'maxAgents': new FormControl(result['maxAgents']),
          'isCpuTask': new FormControl(result['isCpuTask']),
          'isSmall': new FormControl(result['isSmall']),
        }),
      });
    });
   }
  }

/**
 * The below functions are related with assign, manage and delete agents
 *
**/
  assingAgentInit(){
    this.gs.getAll(SERV.AGENT_ASSIGN).subscribe((res)=>{
      this.gs.getAll(SERV.AGENTS,{'maxResults': this.maxResults}).subscribe((agents)=>{
        this.availAgents = this.getAvalAgents(res.values,agents.values);
        this.assigAgents = res.values.map(mainObject => {
          const matchObject = agents.values.find(element => element.agentId === mainObject.agentId)
          return { ...mainObject, ...matchObject }
        })
        this.dtTrigger1.next(void 0);
      });
    });

    this.dtOptions1 = {
      dom: 'Bfrtip',
      scrollY: "700px",
      scrollCollapse: true,
      paging: false,
      destroy: true,
      searching: false,
      bInfo: false,
      buttons:[]
    }
  }

  getAvalAgents(assing: any, agents: any){

    return agents.filter(u => assing.findIndex(lu => lu.agentId === u.agentId) === -1);

  }

  asignAgents(){
    if (this.createForm.valid) {
      const payload = {"taskId": this.editedTaskIndex, "agentId":this.createForm.value['agentId']};
      this.gs.create(SERV.AGENT_ASSIGN,payload).subscribe(() => {
          Swal.fire({
            title: "Success",
            text: "Agent Assigned!",
            icon: "success",
            showConfirmButton: false,
            timer: 1500
          });
          this.rerender();  // rerender datatables
          this.ngOnInit();
        }
      );
    }
  }

  onDelete(id: number){
    this.gs.delete(SERV.AGENT_ASSIGN,id).subscribe(() => {
      Swal.fire({
        title: "Success",
        icon: "success",
        showConfirmButton: false,
        timer: 1500
      });
      this.rerender();  // rerender datatables
      this.ngOnInit();
    });
  }

  onModalUpdate(title: string, id: number, cvalue: any, nameref: string ){
    (async () => {

      const { value: formValues } = await Swal.fire({
        title: title + ' - '+ nameref,
        html:
          '<input id="project-input" class="swal2-input" type="number" placeholder="'+cvalue+'">',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonColor: '#C53819',
        confirmButtonColor: '#8A8584',
        cancelButton: true,
        preConfirm: () => {
          return [
            (<HTMLInputElement>document.getElementById('project-input')).value,
          ]
        }
      })

      if (formValues) {
        if(cvalue !== Number(formValues[0])){
          this.gs.update(SERV.AGENT_ASSIGN,id, {benchmark: +formValues}).subscribe(() => {
            Swal.fire({
              title: "Success",
              icon: "success",
              showConfirmButton: false,
              timer: 1500
            });
            this.ngOnInit();
            this.rerender();  // rerender datatables
          });
        }
      }

    })()
  }

/**
 * This function calculates Keyspace searched, Time Spent and Estimated Time
 *
**/
  // Keyspace searched
  cprogress: any;
  // Time Spent
  ctimespent: any;
  timeCalc(chunks){
      const cprogress = [];
      const timespent = [];
      const current = 0;
      for(let i=0; i < chunks.length; i++){
        cprogress.push(chunks[i].checkpoint - chunks[i].skip);
        if(chunks[i].dispatchTime > current){
          timespent.push(chunks[i].solveTime - chunks[i].dispatchTime);
        } else if (chunks[i].solveTime > current) {
          timespent.push(chunks[i].solveTime- current);
        }
      }
      this.cprogress = cprogress.reduce((a, i) => a + i);
      this.ctimespent = timespent.reduce((a, i) => a + i);
  }

  // Chunk View
  chunkview: number;
  chunktitle: string;
  isactive = 0;
  currenspeed = 0;
  chunkresults: Object;
  activechunks: Object;

  assignChunksInit(id: number){
    this.route.data.subscribe(data => {
      switch (data['kind']) {

        case 'edit-task':
          this.chunkview = 0;
          this.chunktitle = 'Live Chunks';
          this.chunkresults = this.maxResults;
        break;

        case 'edit-task-c100':
          this.chunkview = 1;
          this.chunktitle = 'Latest 100 Chunks';
          this.chunkresults = 100;
        break;

        case 'edit-task-cAll':
          this.chunkview = 2;
          this.chunktitle = 'All Chunks';
          this.chunkresults = 60000;
        break;

      }
    });

    const self = this;
    this.dtOptions = {
      dom: 'Bfrtip',
      scrollY: "700px",
      scrollCollapse: true,
      paging: false,
      destroy: true,
      buttons: {
          dom: {
            button: {
              className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
            }
          },
      buttons:[
        {
          text: '↻',
          autoClose: true,
          action: function (e, dt, node, config) {
            self.onRefresh();
          }
        },
        {
          text: self.chunkview === 0 ? 'Show Latest 100':'Show Live',
          action: function () {
            if(self.chunkview === 0) {
              self.router.navigate(['/tasks/show-tasks',id,'edit','show-100-chunks']);
            }
            if(self.chunkview === 1) {
              self.router.navigate(['/tasks/show-tasks',id,'edit']);
            }
            if(self.chunkview === 2) {
              self.router.navigate(['/tasks/show-tasks',id,'edit']);
            }
          }
        },
        {
          text: self.chunkview === 0 ? 'Show All':'Show Latest 100',
          action: function () {
            if(self.chunkview === 0) {
              console.log(id)
              self.router.navigate(['/tasks/show-tasks',id,'edit','show-all-chunks']);
            }
            if(self.chunkview === 1) {
              self.router.navigate(['/tasks/show-tasks',id,'edit','show-all-chunks']);
            }
            if(self.chunkview === 2) {
              self.router.navigate(['/tasks/show-tasks',id,'edit','show-100-chunks']);
            }
          }
        },
        {
          extend: 'colvis',
          text: 'Column View',
          columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        }
      ]
      }
    }

    const params = {'maxResults': this.chunkresults};
    this.gs.getAll(SERV.CHUNKS,{'maxResults': this.chunkresults, 'filter': 'taskId='+id+''}).subscribe((result: any)=>{
      this.timeCalc(result.values);
      // this.initVisualGraph(result.values, 150, 150); // Get data for visual graph
      this.gs.getAll(SERV.AGENTS,params).subscribe((agents: any) => {
      this.getchunks = result.values.map(mainObject => {
        const matchObject = agents.values.find(element => element.agentId === mainObject.agentId)
        return { ...mainObject, ...matchObject }
        })
      if(this.chunkview == 0){
        const chunktime = this.uiService.getUIsettings('chunktime').value;
        const resultArray = [];
        const cspeed = [];
        for(let i=0; i < this.getchunks.length; i++){
          if(Date.now()/1000 - Math.max(this.getchunks[i].solveTime, this.getchunks[i].dispatchTime) < chunktime && this.getchunks[i].progress < 10000){
            this.isactive = 1;
            cspeed.push(this.getchunks[i].speed);
            resultArray.push(this.getchunks[i]);
          }
        }
        if(cspeed.length > 0){
          this.currenspeed = cspeed.reduce((a, i) => a + i);
        }
        this.getchunks = resultArray;
      }
      this.dtTrigger.next(void 0);
      });
    });

  }

  onRefresh(){
    this.ngOnInit();
    this.rerender();  // rerender datatables
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      setTimeout(() => {
        this.dtTrigger['new'].next();
      });
    });
  }

/**
 * Helper functions
 *
**/

  purgeTask(){
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn',
        cancelButton: 'btn'
      },
      buttonsStyling: false
    })
    Swal.fire({
      title: "Are you sure?",
      text: "It'll purge the Task!",
      icon: "warning",
      reverseButtons: true,
      showCancelButton: true,
      cancelButtonColor: '#8A8584',
      confirmButtonColor: '#C53819',
      confirmButtonText: 'Yes, delete it!'
    })
    .then((result) => {
      if (result.isConfirmed) {
        let payload = {"taskId":this.editedTaskIndex};
        this.gs.chelper(SERV.HELPER,'purgeTask',payload).subscribe(() => {
          Swal.fire({
            title: "Success",
            icon: "success",
            showConfirmButton: false,
            timer: 1500
          });
          this.ngOnInit();
          this.rerender();  // rerender datatables
        });
      } else {
        swalWithBootstrapButtons.fire({
          title: "Cancelled",
          text: "Your Task is safe!",
          icon: "error",
          showConfirmButton: false,
          timer: 1500
        })
      }
    });

  }

  onReset(id: number, state: number){
    const path = state === 2 ? 'abortChunk' :'resetChunk' ;
    const title = state === 2 ? 'Chunk Abort!' :'Chunk Reset!' ;
    let payload = {'chunkId': id};
    this.gs.chelper(SERV.HELPER,path,payload).subscribe(() => {
      Swal.fire({
        title: title,
        icon: "success",
        showConfirmButton: false,
        timer: 1500
      });
      this.ngOnInit();
      this.rerender();
    });
  }

/**
 * Task Speed Grap
 *
**/
initTaskSpeed(obj: object){

  echarts.use([
    TitleComponent,
    ToolboxComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent,
    DataZoomComponent,
    MarkLineComponent,
    LineChart,
    CanvasRenderer,
    UniversalTransition
  ]);

  type EChartsOption = echarts.ComposeOption<
    | TitleComponentOption
    | ToolboxComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | VisualMapComponentOption
    | DataZoomComponentOption
    | MarkLineComponentOption
    | LineSeriesOption
  >;

  const data:any = obj;
  const arr = [];
  const max = [];
  const result = [];

  data.reduce(function(res, value) {
    if (!res[value.time]) {
      res[value.time] = { time: value.time, speed: 0 };
      result.push(res[value.time])
    }
    res[value.time].speed += value.speed;
    return res;
  }, {});

  for(let i=0; i < result.length; i++){

    const iso = this.transDate(result[i]['time']);

    arr.push([iso, this.fs.transform(result[i]['speed'],false,1000).match(/\d+(\.\d+)?/)[0], this.fs.transform(result[i]['speed'],false,1000).slice(-2)]);
    max.push(result[i]['time']);
  }

  const startdate =  max.slice(0)[0];
  const enddate = max.slice(-1)[0];
  console.log(enddate);
  const datelabel = this.transDate(enddate);
  const xAxis = this.generateIntervalsOf(1,+startdate,+enddate);

  const chartDom = document.getElementById('tspeed');
  const myChart = echarts.init(chartDom);
  let option: EChartsOption;

  const self = this;

  option = {
      title: {
        subtext: 'Last record: '+ datelabel,
      },
      tooltip: {
        position: 'top',
        formatter: function (p) {
          return p.data[0] + ': ' + p.data[1] + ' ' + p.data[2] + ' H/s';
        }
      },
      grid: {
        left: '5%',
        right: '4%',
      },
      xAxis: {
        data: xAxis.map(function (item: any[] | any) {
          return self.transDate(item);
        })
      },
      yAxis: {
        type: 'value',
        name: 'H/s',
        position: 'left',
        alignTicks: true,
      },
      useUTC: true,
      toolbox: {
        itemGap: 10,
        show: true,
        left: '85%',
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {
            name: "Task Speed"
          }
        }
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          start: 94,
          end: 100,
          handleSize: 8
        },
        {
          type: 'inside',
          start: 70,
          end: 100
        },
      ],
      series: {
        name: '',
        type: 'line',
        data: arr,
        connectNulls: true,
                markPoint: {
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' }
        ]
      },
        markLine: {
          lineStyle: {
            color: '#333'
          },
        }
        }
      };
      if(data.length > 0){  option && myChart.setOption(option);}
 }

 leading_zeros(dt){
  return (dt < 10 ? '0' : '') + dt;
 }

 transDate(dt){
  const date:any = new Date(dt* 1000);
  // American Format
  // return date.getUTCFullYear()+'-'+this.leading_zeros((date.getUTCMonth() + 1))+'-'+date.getUTCDate()+','+this.leading_zeros(date.getUTCHours())+':'+this.leading_zeros(date.getUTCMinutes())+':'+this.leading_zeros(date.getUTCSeconds());
  return date.getUTCDate()+'-'+this.leading_zeros((date.getUTCMonth() + 1))+'-'+date.getUTCFullYear()+','+this.leading_zeros(date.getUTCHours())+':'+this.leading_zeros(date.getUTCMinutes())+':'+this.leading_zeros(date.getUTCSeconds());
 }

 generateIntervalsOf(interval, start, end) {
    const result = [];
    let current = start;

    while (current < end) {
      result.push(current);
      current += interval;
    }

    return result;
  }

 // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.canDeactivate()) {
        $event.returnValue = "IE and Edge Message";
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.updateForm.valid) {
    return false;
    }
    return true;
  }

}
