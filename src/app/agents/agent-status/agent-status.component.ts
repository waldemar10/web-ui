import { faDigitalTachograph, faMicrochip, faHomeAlt, faPlus, faUserSecret,faEye, faTemperature0, faInfoCircle,
   faServer, faUsers, faChevronDown, faLock, faPauseCircle, faTrash, faEdit, faTerminal, faFileText, faPowerOff} from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

import { UIConfigService } from 'src/app/core/_services/shared/storage.service';
import { CookieService } from 'src/app/core/_services/shared/cookies.service';
import { FilterService } from 'src/app/core/_services/shared/filter.service';
import { GlobalService } from 'src/app/core/_services/main.service';
import { AgentStatusService } from 'src/app/core/_services/agent-status.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { ASC } from '../../core/_constants/agentsc.config';
import { environment } from 'src/environments/environment';
import { SERV } from '../../core/_services/main.config';

import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-agent-status',
  templateUrl: './agent-status.component.html'
})
@PageTitle(['Agent Status'])
export class AgentStatusComponent implements OnInit {
  public isCollapsed = true;

  faDigitalTachograph=faDigitalTachograph;
  faTemperature0=faTemperature0;
  faPauseCircle=faPauseCircle;
  faChevronDown=faChevronDown;
  faInfoCircle=faInfoCircle;
  faUserSecret=faUserSecret;
  faMicrochip=faMicrochip;
  faHomeAlt=faHomeAlt;
  faServer=faServer;
  faUsers=faUsers;
  faPlus=faPlus;
  faLock=faLock;
  faEye=faEye;

  faPowerOff=faPowerOff;
  faTrash=faTrash;
  faEdit=faEdit;
  faTerminal=faTerminal;
  faFileText=faFileText;
  public statusOrderByName = environment.config.agents.statusOrderByName;
  public statusOrderBy = environment.config.agents.statusOrderBy;

  showagents: any[] = [];
  _filteresAgents: any[] = [];
  filterText = '';
  isCheckboxChecked = false;

  totalRecords = 0;
  pageSize = 20;

  private maxResults = environment.config.prodApiMaxResults;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: any = {};

  cpuTempWarnings;
  cpuUtilWarnings;
  deviceUtilWarnings;

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  constructor(
    private offcanvasService: NgbOffcanvas,
    private filterService: FilterService,
    private cookieService: CookieService,
    private uiService: UIConfigService,
    private modalService: NgbModal,
    private gs: GlobalService,
    private as: AgentStatusService,
  ) { }

  // View Menu
  view: any;

  setView(value: string){
    this.cookieService.setCookie('asview', value, 365);
    this.ngOnInit();
  }

  getView(){
    return this.cookieService.getCookie('asview');
  }

    get filteredAgents() {
      return this._filteresAgents;
    }

    set filteredAgents(value: any[]) {
      this._filteresAgents = value;
    }

  ngOnInit(): void {
    this.view = this.getView() || 0;
    this.getAgentStats();
    this.getAgentsPage(1);
    const self = this;
    this.dtOptions = {
      dom: 'Bfrtip',
      bAutoWidth: true,
      fixedHeader : false,
      autoWidth: false,
      bDestroy: true,
      lengthMenu: [
        [10, 25, 50, -1],
        ['10 rows', '25 rows', '50 rows', 'Show all rows']
      ],
      pageLength: -1, 
      order: [[0, 'desc']],
      bStateSave:true,
      select: {
        style: 'multi',
        },
        buttons: {
          dom: {
            button: {
              className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
            }
          },
        buttons: [
          {
            text: '↻',
            autoClose: true,
            action: function (e, dt, node, config) {
              self.onRefresh();
            }
          },
          {
            extend: 'collection',
            text: 'Export',
            buttons: [
              {
                extend: 'excelHtml5',
                exportOptions: {
                  columns: [0, 1, 2, 3, 4]
                },
              },
              {
                extend: 'print',
                exportOptions: {
                  columns: [0, 1, 2, 3, 4]
                },
                customize: function ( win ) {
                  $(win.document.body)
                      .css( 'font-size', '10pt' )
                  $(win.document.body).find( 'table' )
                      .addClass( 'compact' )
                      .css( 'font-size', 'inherit' );
               }
              },
              {
                extend: 'csvHtml5',
                exportOptions: {modifier: {selected: true}},
                select: true,
                customize: function (dt, csv) {
                  let data = "";
                  for (let i = 0; i < dt.length; i++) {
                    data = "Agent Status\n\n"+  dt;
                  }
                  return data;
               }
              },
                'copy'
              ]
            },
            {
              extend: 'colvis',
              text: 'Column View',
              columns: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
              
            },
            {
              extend: 'pageLength',
              className: 'btn-sm',
              titleAttr: 'Show number of rows',
            },
          ],
        }
        
        
      }
    
    
  }

  onRefresh(){
    this.rerender();
    /* this.ngOnInit(); */
  }

  rerender(): void {
   /*  this.getAgentsPage(1); */
   this.dtTrigger.next(void 0);
    const self = this;
    this.dtOptions = {
      dom: 'Bfrtip',
      bAutoWidth: true,
      fixedHeader : false,
      autoWidth: false,
      bDestroy: true,
      lengthMenu: [
        [10, 25, 50, -1],
        ['10 rows', '25 rows', '50 rows', 'Show all rows']
      ],
      pageLength: -1, 
      order: [[0, 'desc']],
      bStateSave:true,
      select: {
        style: 'multi',
        },
        buttons: {
          dom: {
            button: {
              className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
            }
          },
        buttons: [
          {
            text: '↻',
            autoClose: true,
            action: function (e, dt, node, config) {
              self.onRefresh();
            }
          },
          {
            extend: 'collection',
            text: 'Export',
            buttons: [
              {
                extend: 'excelHtml5',
                exportOptions: {
                  columns: [0, 1, 2, 3, 4]
                },
              },
              {
                extend: 'print',
                exportOptions: {
                  columns: [0, 1, 2, 3, 4]
                },
                customize: function ( win ) {
                  $(win.document.body)
                      .css( 'font-size', '10pt' )
                  $(win.document.body).find( 'table' )
                      .addClass( 'compact' )
                      .css( 'font-size', 'inherit' );
               }
              },
              {
                extend: 'csvHtml5',
                exportOptions: {modifier: {selected: true}},
                select: true,
                customize: function (dt, csv) {
                  let data = "";
                  for (let i = 0; i < dt.length; i++) {
                    data = "Agent Status\n\n"+  dt;
                  }
                  return data;
               }
              },
                'copy'
              ]
            },
            {
              extend: 'colvis',
              text: 'Column View',
              columns: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
              
            },
            {
              extend: 'pageLength',
              className: 'btn-sm',
              titleAttr: 'Show number of rows',
            },
          ],
        }
        
        
      }
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      setTimeout(() => {
        this.dtTrigger['new'].next();
      });
    });
  }


  /* pageChanged(page: number) {
    this.getAgentsPage(page);
  } */

  getAgentsPage(page: number) {
    const params = {'maxResults': this.maxResults};
    this.gs.getAll(SERV.AGENTS,params).subscribe((a: any) => {
      this.gs.getAll(SERV.AGENT_ASSIGN,params).subscribe((assign: any) => {
        this.gs.getAll(SERV.TASKS,params).subscribe((t: any)=>{
          this.gs.getAll(SERV.CHUNKS,params).subscribe((c: any)=>{
            
            const getAData = a.values.map(mainObject => {
              
              const matchObjectTask = assign.values.find(e => e.agentId === mainObject.agentId)
              
              return { ...mainObject, ...matchObjectTask}
            })
            this.totalRecords = a.total;
            const jointasks = getAData.map(mainObject => {
              const matchObjectTask = t.values.find(e => e.taskId === mainObject.taskId)
              return { ...mainObject, ...matchObjectTask}
            })

            
            this.showagents = this.filteredAgents = jointasks.map(mainObject => {
            const matchObjectAgents = c.values.find(e => e.agentId === mainObject.agentId)
            return { ...mainObject, ...matchObjectAgents}
            })

            this.showagents.forEach((agent) => {
              if(this.as.getWorkingStatus(agent))
              agent.isWorking = true;
            })

            this.dtTrigger.next(void 0);
        })
      })
    });
  });
  }

  // Agents Stats
  statDevice: any[] = [];
  statTemp: any[] = [];
  statCpu: any[] = [];

  getAgentStats(){
    // const paramsstat = {'maxResults': this.maxResults, 'filter': 'time>'+this.gettime()+''}; //Waiting for API date filters
    const paramsstat = {'maxResults': this.maxResults};
    this.gs.getAll(SERV.AGENTS_STATS,paramsstat).subscribe((stats: any) => {
      const tempDateFilter = stats.values.filter(u=> u.time > 10000000); // Temp
      // const tempDateFilter = stats.values.filter(u=> u.time > this.gettime()); // Temp
      this.statTemp = tempDateFilter.filter(u=> u.statType == ASC.GPU_TEMP); // Temp
      this.statDevice = tempDateFilter.filter(u=> u.statType == ASC.GPU_UTIL); // Temp
      this.statCpu =tempDateFilter.filter(u=> u.statType == ASC.CPU_UTIL); // Temp
      // this.statTemp = stats.values.filter(u=> u.statType == ASC.GPU_TEMP); // filter Device Temperature
      // this.statDevice = stats.values.filter(u=> u.statType == ASC.GPU_UTIL); // filter Device Utilization
      // this.statCpu = stats.values.filter(u=> u.statType == ASC.CPU_UTIL); // filter CPU utilization
    });
    this.gs.getAll(SERV.AGENTS, paramsstat).subscribe((agent) => {
      
      const cpuTempMap = agent.values.reduce((acc, agent) => {
        acc[agent.agentId] = agent.cpuTemp;
        return acc;
      }, {});
      this.cpuTempWarnings = cpuTempMap;

      const cpuUtilMap = agent.values.reduce((acc, agent) => {
        acc[agent.agentId] = agent.cpuUtil;
        return acc;
      }, {});
      this.cpuUtilWarnings = cpuUtilMap;

      const deviceUtilMap = agent.values.reduce((acc, agent) => {
        acc[agent.agentId] = agent.deviceUtil;
        return acc;
      }, {});
      this.deviceUtilWarnings = deviceUtilMap;
    });
  }

  getConfigItem(key: String) {
    const config = JSON.parse(localStorage.getItem("uis"));
    const value = config.find(item => item.name === key).value;
    return parseInt(value);
  }

  gettime(){
    const time = (Date.now() - this.uiService.getUIsettings('agenttimeout').value)
    return time;
  }

  // On change filter

  filterChanged(data: string) {
    if (data && this.showagents) {
        data = data.toUpperCase();
        const props = ['agentName', 'agentId'];
        this._filteresAgents = this.filterService.filter<any>(this.showagents, data, props);
        
      
      } else {
      this._filteresAgents = this.showagents;
    
    }
  }

  getDefaultValues(type: String) {
    const t1 = this.getConfigItem("agentTempThreshold1");
    const t2 = this.getConfigItem("agentTempThreshold2");
    const u1 = this.getConfigItem("agentUtilThreshold1");
    const u2 = this.getConfigItem("agentUtilThreshold2");  

    const defaultTempWarnings = [Math.max(0, t1 - 10), t1, t2];
    const defaultUtilWarnings = [Math.max(0, u2 - 10), u2, u1];

    if(type === "temp")
      return defaultTempWarnings;
    else
      return defaultUtilWarnings;
  }

  // Modal Agent utilisation and OffCanvas menu
  getCpuTemp(agent, index) {
    const cpuTemp = this.cpuTempWarnings[agent.agentId].length === 3 ? 
                    this.cpuTempWarnings[agent.agentId].split(",").map(Number) :
                    this.getDefaultValues("temp");
    return cpuTemp[index];
  }

  getCpuUtil(agent, index) {
    const cpuUtil = this.cpuUtilWarnings[agent.agentId].length === 3 ?
                    this.cpuUtilWarnings[agent.agentId].split(",").map(Number) :
                    this.getDefaultValues("util");
    return cpuUtil[index];
  }

  getDeviceUtil(agent, index) {
    const deviceUtil = this.deviceUtilWarnings[agent.agentId].length === 3 ?
                    this.deviceUtilWarnings[agent.agentId].split(",").map(Number) :
                    this.getDefaultValues("util");
    return deviceUtil[index];
  }

  onShutdownAgent(id){
    const timestamp = Math.floor(Date.now() / 1000); //timestamp in seconds
    const data = {timestamp: timestamp, agentIds: `${id}`}
    if(!id) {
      Swal.fire({
        title: "You haven't selected any Agent",
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
      })
    } else {
      this.gs.create(SERV.SHUTDOWN, data).subscribe((res) => {
        let title: String;
        let iconType: String;
        if (!res.error) {
          title = "Shutdown command has been sent out";
          iconType = "success";
        } else {
          title = res.error;
          iconType = "error";
        }
        
        Swal.fire({
          title: title,
          icon: iconType,
          timer: 1500,
          showConfirmButton: false
        });
  
        this.ngOnInit();
        this.rerender();
      });
    }
    ;
  }
  
  onDelete(id: number){
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: 'btn',
          cancelButton: 'btn'
        },
        buttonsStyling: false
      })
      Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, it can not be recovered!",
        icon: "warning",
        reverseButtons: true,
        showCancelButton: true,
        cancelButtonColor: '#8A8584',
        confirmButtonColor: '#C53819',
        confirmButtonText: 'Yes, delete it!'
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.gs.delete(SERV.AGENTS,id).subscribe(() => {
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
            text: "Your Agent is safe!",
            icon: "error",
            showConfirmButton: false,
            timer: 1500
          })
        }
      });
  }

  setTaskColor() {
    /* event.stopPropagation(); */
    this.isCheckboxChecked = !this.isCheckboxChecked;
  }
}
