
import { faEdit, faLock, faPauseCircle,faHomeAlt, faPlus, faFileText, faTrash, faCheckCircle, faArrowCircleDown, faMicrochip, faTerminal, faPowerOff} from '@fortawesome/free-solid-svg-icons';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DataTableDirective } from 'angular-datatables';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import {Subject} from 'rxjs';

import { UIConfigService } from 'src/app/core/_services/shared/storage.service';
import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../core/_services/main.config';

declare let $:any;

@Component({
  selector: 'app-show-agents',
  templateUrl: './show-agents.component.html'
})
@PageTitle(['Show Agents'])
export class ShowAgentsComponent implements OnInit, OnDestroy {

  faArrowCircleDown=faArrowCircleDown;
  faCheckCircle=faCheckCircle;
  faPauseCircle=faPauseCircle;
  faMicrochip=faMicrochip;
  faTerminal=faTerminal;
  faFileText=faFileText;
  faHome=faHomeAlt;
  faTrash=faTrash;
  faEdit=faEdit;
  faLock=faLock;
  faPlus=faPlus;
  faPowerOff=faPowerOff;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: any = {};

  //filter
  isChecked = false;
  isFilterOpen = false;
  filteredAgents: any[] = [];
  
  //input values
  nameInput= "";
  ownerInput = "";
  hardwareInput = "";
  ipInput = "";
  lastActInput = "";
  plusInfoInput: string | undefined;
  statusInput: string | undefined;
  accessGroupInput: string | undefined;

  public agroups: {accessGroupId: number, groupName: string, isEdit: false }[] = [];

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  // ToDo add model
  showagents: any = [];

  private maxResults = environment.config.prodApiMaxResults

  constructor(
    private uiService: UIConfigService,
    private gs: GlobalService,
  ) {}

  ngOnInit(): void {

    const agentParams = {'maxResults': this.maxResults, 'expand':'accessGroups'}
    const aGroupParams = {'maxResults': this.maxResults}

    this.gs.getAll(SERV.AGENTS,agentParams).subscribe((agents: any) => {
      this.showagents = agents.values;
      this.filteredAgents = agents.values;
      // this.showagents.forEach(f => (f.checked = false));
      this.dtTrigger.next(void 0);
    });

    this.gs.getAll(SERV.ACCESS_GROUPS,aGroupParams).subscribe((agroups: any) => {
      this.agroups = agroups.values;
      this.dtTrigger.next(void 0);
    });

    const self = this;
    this.dtOptions = {
      dom: 'Bfrtip',
      stateSave: true,
      destroy: true,
      ordering: false,
      autoWidth:false,
      bAutoWidth: false,
      lengthMenu: [
        [10, 25, 50, -1],
        ['10 rows', '25 rows', '50 rows', 'Show all rows']
      ],
      pageLength: -1, 
      order: [[0, 'desc']],
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
          text: 'Filter',
          autoClose: true,
          action: function (e, dt, node, config) {
            self.toggleFilter();
          }
        },
        {
          extend: 'collection',
          text: 'Export',
          buttons: [
            {
              extend: 'excelHtml5',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6, 7, 8]
              },
            },
            {
              extend: 'print',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6, 7, 8]
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
                self.onSelectedAgents();
                let data = "";
                for (let i = 0; i < dt.length; i++) {
                  data = "Agents\n\n"+  dt;
                }
                return data;
             }
            },
            {
              extend: 'copy',
            }
             ]
        },
        {
          extend: 'collection',
          text: 'Bulk Actions',
          className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
          buttons: [
                {
                  text: 'Delete Agents',
                  autoClose: true,
                  action: function (e, dt, node, config) {
                    self.onDeleteBulk();
                  }
                },
                {
                  text: 'Activate Agents',
                  autoClose: true,
                  action: function ( e, dt, node, config ) {
                    const edit = {isActive: true};
                    self.onUpdateBulk(edit);
                  }
                },
                {
                  text: 'Deactivate Agents',
                  autoClose: true,
                  action: function ( e, dt, node, config ) {
                    const edit = {isActive: false};
                    self.onUpdateBulk(edit);
                  }
                },
                {
                  text: 'Shutdown Agents',
                  autoClose: true,
                  action: function ( e, dt, node, config ) {
                    self.shutdownAgents();
                  }
                },
                {
                  text: 'Edit Rack',
                  autoClose: true,
                  action: function ( e, dt, node, config ) {
                    const title = 'Update Rack (Missing Field)'
                    self.onModal(title)
                  }
                },
             ]
          },
          {
            extend: 'colvis',
            text: 'Column View',
            columns: [ 1, 2, 3, 4, 5, 6, 7, 8 ],
          },
          {
            extend: "pageLength",
            className: "btn-sm"
          }
        ],
      }
    };
  }

  onRefresh(){
    this.rerender();
    this.ngOnInit();
  }

  toggleFilter(){
    this.isFilterOpen = !this.isFilterOpen;
  }

  filterAgents() {
    this.filteredAgents = this.applyFilters();
  }
  
  applyFilters() {
    let result = this.showagents;
    //status
    result = result.filter((agent) => {
      switch (this.statusInput) {
        case "Active":
          return agent.isActive;
        case "Inactive":
          return !agent.isActive;
        case "All":
          return true;
        default:
          return true;
      }
    });
    //agent name
    result = result.filter((agent) => {
      return agent.agentName.toLowerCase().includes(this.nameInput.toLowerCase());
    });
    //owner
    result = result.filter((agent) => {
      if (this.ownerInput === "") {
        return true;
      }
      return agent.userId?.toString().toLowerCase().includes(this.ownerInput.toLowerCase());
    });
    //cpu & gpu
    result = result.filter((agent) => {
      return agent.devices.toLowerCase().includes(this.hardwareInput.toLowerCase());
    });
    //+info
    result = result.filter((agent) => {
      switch (this.plusInfoInput) {
        case "trusted":
          return agent.isTrusted;
        case "cpuOnly":
          return agent.cpuOnly;
        case "cmd":
          return agent.cmdPars !== "";
        case "All":
          return true;  
        default:
          return true;
      }
    });
    //last activity
    result = result.filter((agent) => {
      console.log(agent)
      return agent.lastAct.toLowerCase().includes(this.lastActInput.toLocaleLowerCase());
    });

    result = result.filter((agent) => {
      return agent.lastIp.toString().includes(this.ipInput);
    });
    //access group
    result = result.filter((agent) => {
      if (this.accessGroupInput === "All" || this.accessGroupInput === undefined) {
        return true;
      }
      return this.accessGroupInput == agent.accessGroups[0]?.groupName;
    });
  
    return result;
  }  

  setCheckAll(){
    const chkBoxlength = $(".checkboxCls:checked").length;
    if (this.isChecked == true) {
      $(".checkboxCls").prop("checked", false);
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.rows(  ).deselect();
        this.isChecked = false;
      });
    } else {
      $(".checkboxCls").prop("checked", true);
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.rows(  ).select();
        this.isChecked = true;
      });
    }
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

  shutdownAgents() {
    const selectionnum = this.onSelectedAgents();
    const agentIds = selectionnum.join(",");
    const timestamp = Math.floor(Date.now() / 1000); //timestamp in seconds
    const data = { timestamp: timestamp, agentIds: agentIds };
    if (selectionnum.length == 0) {
      Swal.fire({
        title: "You haven't selected any Agent",
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
      });
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

  onDone(value?: any){
    setTimeout(() => {
      this.ngOnInit();
      this.rerender();  // rerender datatables
      Swal.close();
      Swal.fire({
        title: 'Done!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
    },3000);
  }

  onSelectedAgents(){
    $(".dt-button-background").trigger("click");
    const selection = $($(this.dtElement).DataTable.tables()).DataTable().rows({ selected: true } ).data().pluck(0).toArray();
    if(selection.length == 0) {
      Swal.fire({
        title: "You haven't selected any Agent",
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
      })
      return;
    }
    const selectionnum = selection.map(i=>Number(i));

    return selectionnum;
  }

  onDeleteBulk(){
      const self = this;
      const selectionnum = this.onSelectedAgents();
      const sellen = selectionnum.length;
      const errors = [];
      selectionnum.forEach(function (value) {
        Swal.fire('Deleting...'+sellen+' Agent(s)...Please wait')
        Swal.showLoading()
      self.gs.delete(SERV.AGENTS,value)
      .subscribe(
        err => {
          // console.log('HTTP Error', err)
          err = 1;
          errors.push(err);
        },
        );
      });
    self.onDone(sellen);
  }

  onUpdateBulk(value: any){
        const self = this;
        const selectionnum = this.onSelectedAgents();
        const sellen = selectionnum.length;
        const errors = [];
        selectionnum.forEach(function (id) {
          Swal.fire('Updating...'+sellen+' Agents...Please wait')
          Swal.showLoading()
        self.gs.update(SERV.AGENTS,id, value).subscribe(
          err => {
            // console.log('HTTP Error', err)
            err = 1;
            errors.push(err);
          },
        );
      });
      self.onDone(sellen);
  }

  onModal(title: string){
    (async () => {

      $(".dt-button-background").trigger("click");
      const selection = $($(this.dtElement).DataTable.tables()).DataTable().rows({ selected: true } ).data().pluck(0).toArray();
      if(selection.length == 0) {
        Swal.fire({
          title: "You haven't selected any Agent",
          type: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        return;
      }

      const { value: formValues } = await Swal.fire({
        title: title,
        html:
          '<input id="agent-input" class="swal2-input">',
        focusConfirm: false,
        confirmButtonColor: '#4B5563',
        preConfirm: () => {
          return [
            (<HTMLInputElement>document.getElementById('agent-input')).value,
          ]
        }
      })

      const rack = []
      if (formValues) {
        rack.push({rack: formValues})
        // we need to send pus
        // this.onUpdateBulk(formValues);
        Swal.fire(JSON.stringify(rack))

      }

      })()
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

}
