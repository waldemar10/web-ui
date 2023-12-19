import { Component, OnInit, ElementRef, ChangeDetectionStrategy ,ChangeDetectorRef, HostListener, ViewChild  } from '@angular/core';
import { faHomeAlt, faPlus, faTrash, faInfoCircle, faLock } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from './../../../environments/environment';
import { ActivatedRoute, Params } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';

import { UIConfigService } from 'src/app/core/_services/shared/storage.service';
import { TooltipService } from '../../core/_services/shared/tooltip.service';
import { colorpicker } from '../../core/_constants/settings.config';
import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../core/_services/main.config';

@Component({
  selector: 'app-new-tasks',
  templateUrl: './new-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
@PageTitle(['New Task'])
export class NewTasksComponent implements OnInit {

  // Config
  private priority = environment.config.tasks.priority;
  private maxAgents = environment.config.tasks.maxAgents;
  private chunkSize = environment.config.tasks.chunkSize;

  faInfoCircle=faInfoCircle;
  faHome=faHomeAlt;
  faTrash=faTrash;
  faPlus=faPlus;
  faLock=faLock;

  color = '#fff';
  colorpicker=colorpicker;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: any = {};
  dtOptionsAgents: any = {};
  copyMode = false;
  copyFiles: any;
  editedIndex: number;
  whichView: string;
  copyType: number; //0 copy from task and 1 copy from pretask
  prep: any;  // ToDo change to interface
  crackertype: any;  // ToDo change to interface
  crackerversions: any = [];
  createForm: FormGroup;

  needTrusted = false;
  notTrustedAgent = false;

  showAgentsDataForTable: any = [];
  selectedData: Set<any> = new Set();
  agentIds: any;

  // ToDo change to interface
  public allfiles: {
      fileId: number,
      filename: string,
      size: number,
      isSecret: number,
      fileType: number,
      accessGroupId: number,
      lineCount:number
      accessGroup: {
        accessGroupId: number,
        groupName: string
      }
    }[] = [];

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private tooltipService: TooltipService,
    private uiService: UIConfigService,
    private modalService: NgbModal,
    private route:ActivatedRoute,
    private gs: GlobalService,
    private router: Router
  ) { }

  private maxResults = environment.config.prodApiMaxResults;

  // New checkbox
  filesFormArray: Array<any> = [];
  onChange(fileId:number, fileType:number, fileName: string, cmdAttk: number, $target: EventTarget) {
    const isChecked = (<HTMLInputElement>$target).checked;
    if(isChecked && cmdAttk === 0 ) {
        if (this.copyMode) {
          this.filesFormArray = this.createForm.get('files').value;
        }
        this.filesFormArray.push(fileId);
        this.OnChangeAttack(fileName, fileType);
        this.createForm.get('files').value;
        this.createForm.patchValue({files: this.filesFormArray});
    }
    if (isChecked && cmdAttk === 1) {
        this.OnChangeAttackPrep(fileName, fileType);
    } if (!isChecked && cmdAttk === 0) {
      if (this.copyMode) {
        this.filesFormArray = this.createForm.get('files').value;
      }
      const index = this.filesFormArray.indexOf(fileId);
      this.filesFormArray.splice(index,1);
      this.createForm.patchValue({files: this.filesFormArray});
      this.OnChangeAttack(fileName, fileType, true);
    } if (!isChecked && cmdAttk === 1) {
      this.OnChangeAttackPrep(fileName, fileType, true);
    }
  }

  onChecked(fileId: number){
    return this.createForm.get('files').value.includes(fileId);
  }

  OnChangeAttack(item: string, fileType: number, onRemove?: boolean){
    if(onRemove === true){
        const currentCmd = this.createForm.get('attackCmd').value;
        let newCmd = item
        if (fileType === 1 ){newCmd = '-r '+ newCmd;}
        newCmd = currentCmd.replace(newCmd,'');
        newCmd = newCmd.replace(/^\s+|\s+$/g, "");
        this.createForm.patchValue({
          attackCmd: newCmd
        });
    } else {
        const currentCmd = this.createForm.get('attackCmd').value;
        let newCmd = item;
        this.validateFile(newCmd);
        if (fileType === 1 ){
          newCmd = '-r '+ newCmd;
        }
        this.createForm.patchValue({
          attackCmd: currentCmd+' '+ newCmd
        });
    }
  }

  OnChangeAttackPrep(item: string, fileType: number, onRemove?: boolean){
    if(onRemove === true){
        const currentCmd = this.createForm.get('preprocessorCommand').value;
        let newCmd = item
        if (fileType === 1 ){newCmd = '-r '+ newCmd;}
        newCmd = currentCmd.replace(newCmd,'');
        newCmd = newCmd.replace(/^\s+|\s+$/g, "");
        this.createForm.patchValue({
          preprocessorCommand: newCmd
        });
    } else {
        const currentCmd = this.createForm.get('preprocessorCommand').value;
        let newCmd = item;
        this.validateFile(newCmd);
        if (fileType === 1 ){
          newCmd = '-r '+ newCmd;
        }
        this.createForm.patchValue({
          preprocessorCommand: currentCmd+' '+ newCmd
        });
    }
  }

  validateFile(value){
    if(value.split('.').pop() == '7zip'){
      Swal.fire({
        title: "Heads Up!",
        text: "Hashcat has some issues loading 7z files. Better convert it to a hash file ;)",
        icon: "warning",
      })
    }
  }

  onRemoveFChars(){
    let currentCmd = this.createForm.get('attackCmd').value;
    currentCmd = currentCmd.replace(this.getBanChars(),'');
    this.createForm.patchValue({
      attackCmd: currentCmd
    });
  }

  getBanChars(){
    const chars = this.uiService.getUIsettings('blacklistChars').value.replace(']', '\\]').replace('[', '\\[');
    return new RegExp('['+chars+'\/]', "g")
  }

  getBanChar(){
    return this.uiService.getUIsettings('blacklistChars').value;
  }

  // Tooltips
  tasktip: any =[]

  updateSelectedData(selectedData: any[]) {
    this.selectedData = new Set(selectedData);
    this.agentIds = selectedData.map(item => parseInt(item.split('-')[0]));
    this._changeDetectorRef.detectChanges();
  }

  getSelectedDataArray(): any[] {
    return Array.from(this.selectedData);
  }

  updateRowColors(selectedData: any): void {

    const dataArray = Array.from(selectedData);
 
    this.showAgentsDataForTable.forEach(agent => {
      const cleanedAgentName = agent.agentName.replace(/\s/g, '');
      const uniqueKey = `${agent.agentId}-${cleanedAgentName.toUpperCase()}`;

      agent.rowClass = dataArray.includes(uniqueKey) ? 'highlighted-row' : '';
    });
  }

  ngOnInit(): void {
    
    this.fetchData(); 
    this.route.params
    .subscribe(
      (params: Params) => {
        this.editedIndex = +params['id'];
        this.copyMode = params['id'] != null;
      }
    );

    this.tasktip = this.tooltipService.getTaskTooltips();

    this.route.data.subscribe(data => {
      switch (data['kind']) {

        case 'new-task':
          this.whichView = 'create';
        break;

        case 'copy-task':
          this.whichView = 'edit';
          this.copyType = 0;
          this.initFormt();
        break;

        case 'copy-pretask':
          this.whichView = 'edit';
          this.copyType = 1;
          this.initFormpt();
        break;

      }
    });
    const self = this;
    this.dtOptions = {
      dom: 'Bfrtip',
      scrollY: "700px",
      scrollCollapse: true,
      select: false,
      autoWidth: false,
      lengthMenu: [
          [10, 25, 50, -1],
          ['10 rows', '25 rows', '50 rows', 'Show all rows']
        ],
      pageLength: 10,
      buttons: {
        dom: {
          button: {
            className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
          }
        },
        buttons: [
          {
            extend: 'pageLength',
            className: 'btn-sm',
            titleAttr: 'Show number of rows',
          }
        ]
      }
      
    }


  this.dtOptionsAgents = {
    dom: 'Bfrtip',
    scrollY: "700px",
    scrollCollapse: true,
    select:{
      style: 'multi',
    },
    columnDefs: [ { 
      orderable: false, 
      className: 'select-checkbox', 
      targets: 0
    } 
    ],
    order: [[1, 'asc']]
    ,
    autoWidth: false,
    
   
      lengthMenu: [
        [10, 25, 50, -1],
        ['10 rows', '25 rows', '50 rows', 'Show all rows']
      ],
    pageLength: 10,
    buttons: {
      dom: {
        button: {
          className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
        }
      },
      buttons: [
        {
          text: 'Add/Remove selected agents',
          action: (e, dt, button, config) => {
            const selectedRows = dt.rows({ selected: true }).data().toArray();
      
            selectedRows.forEach(row => {
 
              const rowId = row[1];
              const rowName = row[2].toUpperCase();
              const uniqueKey = `${rowId}-${rowName}`;
       
              if (this.selectedData.has(uniqueKey)) 
              {
                this.selectedData.delete(uniqueKey);
              } 
              else 
              {
                this.selectedData.add(uniqueKey);
              }
            });
            
            this.updateRowColors(this.selectedData);
            this.updateSelectedData(Array.from(this.selectedData));
            this.checkIfAgentIsTrusted();
            dt.rows({ selected: true }).deselect();
          }
        },
        {
          extend: 'pageLength',
          className: 'btn-sm',
          titleAttr: 'Show number of rows',
        }
      ]
    }
    
  }
    this.getAgentsData();
    this.createForm = new FormGroup({
      'taskName': new FormControl('', [Validators.required]),
      'notes': new FormControl(''),
      'hashlistId': new FormControl(),
      'attackCmd': new FormControl(this.uiService.getUIsettings('hashlistAlias').value, [Validators.required, this.forbiddenChars(this.getBanChars())]),
      'priority': new FormControl(null || this.priority,[Validators.required, Validators.pattern("^[0-9]*$")]),
      'maxAgents': new FormControl(null || this.maxAgents),
      'chunkTime': new FormControl(null || Number(this.uiService.getUIsettings('chunktime').value)),
      'statusTimer': new FormControl(null || Number(this.uiService.getUIsettings('statustimer').value)),
      'color': new FormControl(''),
      'isCpuTask': new FormControl(null || false),
      'skipKeyspace': new FormControl(null || 0),
      'crackerBinaryId': new FormControl(null || 1),
      "crackerBinaryTypeId": new FormControl(),
      "isArchived": new FormControl(false),
      'staticChunks': new FormControl(null || 0),
      'chunkSize': new FormControl(null || this.chunkSize),
      'forcePipe': new FormControl(null || false),
      'preprocessorId': new FormControl(null || 0),
      'preprocessorCommand': new FormControl(''),
      'isSmall': new FormControl(null || false),
      'useNewBench': new FormControl(null || true),
      'files': new FormControl('' || [])
    });

    this.patchHashalias();

  }

  get attckcmd(){
    return this.createForm.controls['attackCmd'];
  }

  forbiddenChars(name: RegExp): ValidatorFn{
    return (control: AbstractControl): { [key: string]: any } => {
      const forbidden = name.test(control.value);
      return forbidden ? { 'forbidden' : { value: control.value } } : null;
    };
  }

  getValueBchars(): void {
    this.uiService.getUIsettings('blacklistChars').value
  }

  getAgentsData() {
    const paramsAgent = {'maxResults': this.maxResults, 'expand':'accessGroups'}
    const params = {'maxResults': this.maxResults};
    this.gs.getAll(SERV.AGENTS,paramsAgent).subscribe((agents: any) => {
      this.gs.getAll(SERV.AGENT_ASSIGN,params).subscribe((agent_assign: any) => {
        this.gs.getAll(SERV.TASKS,params).subscribe((tasks: any)=>{

            const agentsData = agents.values.map(agent => {
              const matchAgentWithAssignedAgent = agent_assign.values.find(assignedAgents => assignedAgents.agentId === agent.agentId)
              return { ...agent, ...matchAgentWithAssignedAgent}
            })
            
            this.showAgentsDataForTable = agentsData.map(mainObject => {
              const matchTaskWithAssignedAgent = tasks.values.find(e => e.taskId === mainObject.taskId)
              return { ...mainObject, ...matchTaskWithAssignedAgent}
            })
            
            this.dtTrigger.next(void 0);
            
      })
    });
  });
  }
  async fetchData() {

    await this.gs.getAll(SERV.CRACKERS_TYPES).subscribe((crackers) => {
      this.crackertype = crackers.values;
      let crackerBinaryTypeId = '';
      if(this.crackertype.find(obj => obj.typeName === 'hashcat').crackerBinaryTypeId){
        crackerBinaryTypeId = this.crackertype.find(obj => obj.typeName === 'hashcat').crackerBinaryTypeId;
      }else{
        crackerBinaryTypeId = this.crackertype.slice(-1)[0]['crackerBinaryTypeId'];
      }
      this.gs.getAll(SERV.CRACKERS,{'maxResults': this.maxResults,'filter': 'crackerBinaryTypeId='+crackerBinaryTypeId+'' }).subscribe((crackers) => {
        this.crackerversions = crackers.values;
        const lastItem = this.crackerversions.slice(-1)[0]['crackerBinaryId'];
        this.createForm.get('crackerBinaryTypeId').patchValue(lastItem);
      })
    });

    await this.gs.getAll(SERV.PREPROCESSORS,{'maxResults': this.maxResults }).subscribe((prep) => {
      this.prep = prep.values;
    });

    await this.gs.getAll(SERV.FILES,{'maxResults': this.maxResults, 'expand': 'accessGroup'}).subscribe((files) => {
      this.allfiles = files.values;
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        setTimeout(() => {
          this.dtTrigger[0].next(null);
          dtInstance.columns.adjust();
        });
     });
    });
  }

  patchHashalias(){
    this.createForm.patchValue({
      attackCmd:this.uiService.getUIsettings('hashlistAlias').value
    });
  }

  active= 1; //Active show first table wordlist

  ngAfterViewInit() {

    setTimeout(() => {
      this.active = 1;
    },2000);
    this.dtTrigger.next(null);

    const params = {'maxResults': this.maxResults};

    this.gs.getAll(SERV.HASHLISTS,params).subscribe((hlist: any) => {
      const self = this;
      const response = hlist.values;
      ($("#hashlist") as any).selectize({
        plugins: ['remove_button'],
        preload: true,
        create: false,
        valueField: "hashlistId",
        placeholder: "Search hashlist...",
        labelField: "name",
        searchField: ["name"],
        loadingClass: 'Loading...',
        highlight: true,
        onChange: function (value) {
          self.OnChangeHashlist(value);
        },
        render: {
          option: function (item, escape) {
            return '<div  class="style_selectize">' + escape(item.hashlistId) + ' -  ' + escape(item.name) + '</div>';
          },
        },
        load: function (query, callback) {
          if (self.copyMode && self.copyType === 0) {
            const that = this;
            self.gs.get(SERV.TASKS,self.editedIndex,{'expand': 'hashlist'}).subscribe((result)=>{
              that.setValue(result.hashlist[0]['hashlistId']);
            })
          }
        },
        onInitialize: function(){
            const selectize = this;
            selectize.addOption(response);
            const selected_items = [];
            $.each(response, function( i, obj) {
                selected_items.push(obj.id);
            });
            selectize.setValue(selected_items);
          },
          });
      });

  }

  OnChangeValue(value){
    this.createForm.patchValue({
      color: value
    });

    
    this._changeDetectorRef.detectChanges();
  }

  checkIsTrustedRequired(value: number): void{

    const params = {'maxResults': this.maxResults};
    this.needTrusted = false;
    this.gs.getAll(SERV.HASHLISTS,params).subscribe((hlist: any) => {
    
    hlist.values.map(list => {

      if(list.hashlistId == value && list.isSecret == true){
      this.needTrusted = true;
      this.checkIfAgentIsTrusted();
      }
      else 
      if(list.hashlistId == value && list.isSecret == false){

        this.needTrusted = false;
        this.checkIfAgentIsTrusted();
       }  
      });
    });
  }

  OnChangeHashlist(value){
    this.createForm.patchValue({
      hashlistId: Number(value)
    });
    this.checkIsTrustedRequired(value);
    this._changeDetectorRef.detectChanges();
  }

  onChangeBinary(id: string){
    const params = {'filter': 'crackerBinaryTypeId='+id+''};
    this.gs.getAll(SERV.CRACKERS,params).subscribe((crackers: any) => {
      this.crackerversions = crackers.values;
      const lastItem = this.crackerversions.slice(-1)[0]['crackerBinaryId'];
      this.createForm.get('crackerBinaryTypeId').patchValue(lastItem);
    });
  }
  checkIfAgentIsTrusted(){
    if(this.needTrusted === true){
    this.gs.getAll(SERV.AGENTS).subscribe((agents: any) => {

    const notTrustedAgentFound = agents.values.some(agent => {
      return (this.agentIds.includes(agent.agentId) && agent.isTrusted === false); 
    });

    this.notTrustedAgent = notTrustedAgentFound;
    });
  }
  else
  {
    this.notTrustedAgent = false;
  }
  }

  onSubmit(){
    
    if(this.needTrusted === true && this.notTrustedAgent === false){
    if (this.createForm.valid) {     
      this.gs.create(SERV.TASKS,this.createForm.value).subscribe((response) => {
        const taskId = response.taskId; //Get the current task id
          Swal.fire({
            title: "Success",
            text: "New Task created!",
            icon: "success",
            showConfirmButton: false,
            timer: 1500
          });
          this.assignAgents(taskId);   
        }
      );
    }
  }
  }

  assignAgents(taskId: number){

  if (Array.isArray(this.agentIds)) {  
    this.agentIds.forEach(agentId => {
    const payload = {"taskId":taskId,"agentId":agentId};
    this.gs.create(SERV.AGENT_ASSIGN,payload).subscribe(() => {
        Swal.fire({
          title: "Success",
          text: "Agent Assigned!",
          icon: "success",
          showConfirmButton: false,
          timer: 1500
        });
        this.router.navigate(['tasks/show-tasks']);
    });
  });
  }else{
    const payload = {"taskId":taskId,"agentId":this.agentIds};
    this.gs.create(SERV.AGENT_ASSIGN,payload);
    this.router.navigate(['tasks/show-tasks']);
      }
  }
  // Copied from Task
  private initFormt() {
    if (this.copyMode) {
    this.gs.get(SERV.TASKS,this.editedIndex,{'expand': 'hashlist,speeds,crackerBinary,crackerBinaryType,files'}).subscribe((result)=>{
      this.color = result['color'];
      const arrFiles: Array<any> = [];
      if(result.files){
        for(let i=0; i < result.files.length; i++){
          arrFiles.push(result.files[i]['fileId']);
        }
      }
      this.createForm = new FormGroup({
        'taskName': new FormControl(result['taskName']+'_(Copied_task_id_'+this.editedIndex+')', [Validators.required, Validators.minLength(1)]),
        'notes': new FormControl('Copied from task id'+this.editedIndex+''),
        'hashlistId': new FormControl(result.hashlist['hashlistId']),
        'attackCmd': new FormControl(result['attackCmd'], [Validators.required, this.forbiddenChars(/[&*;$()\[\]{}'"\\|<>\/]/)]),
        'maxAgents': new FormControl(result['maxAgents']),
        'chunkTime': new FormControl(result['chunkTime']),
        'statusTimer': new FormControl(result['statusTimer']),
        'priority': new FormControl(result['priority']),
        'color': new FormControl(result['color']),
        'isCpuTask': new FormControl(result['isCpuTask']),
        'crackerBinaryTypeId': new FormControl(result['crackerBinaryTypeId']),
        'isSmall': new FormControl(result['isSmall']),
        'useNewBench': new FormControl(result['useNewBench']),
        // 'isMaskImport': new FormControl(result['isMaskImport']),
        'skipKeyspace': new FormControl(result['skipKeyspace']),
        'crackerBinaryId': new FormControl(result.crackerBinary['crackerBinaryId']),
        "isArchived": new FormControl(false),
        'staticChunks': new FormControl(result['staticChunks']),
        'chunkSize': new FormControl(result['chunkSize']),
        'forcePipe': new FormControl(result['forcePipe']),
        'preprocessorId': new FormControl(result['preprocessorId']),
        'preprocessorCommand': new FormControl(result['preprocessorCommand']),
        'files': new FormControl(arrFiles)
      });
    });
   }
  }

  // Copied from PreTask
  private initFormpt() {
    if (this.copyMode) {
    this.gs.get(SERV.PRETASKS,this.editedIndex,{'expand':'pretaskFiles'}).subscribe((result)=>{
      this.color = result['color'];
      const arrFiles: Array<any> = [];
      if(result['pretaskFiles']){
        for(let i=0; i < result['pretaskFiles'].length; i++){
          arrFiles.push(result['pretaskFiles'][i]['fileId']);
        }
        this.copyFiles = arrFiles;
      }
      this.createForm = new FormGroup({
        'taskName': new FormControl(result['taskName']+'_(Copied_pretask_id_'+this.editedIndex+')', [Validators.required, Validators.minLength(1)]),
        'notes': new FormControl('Copied from pretask id '+this.editedIndex+''),
        'hashlistId': new FormControl(),
        'attackCmd': new FormControl(result['attackCmd'], [Validators.required, this.forbiddenChars(/[&*;$()\[\]{}'"\\|<>\/]/)]),
        'maxAgents': new FormControl(result['maxAgents']),
        'chunkTime': new FormControl(result['chunkTime']),
        'statusTimer': new FormControl(result['statusTimer']),
        'priority': new FormControl(result['priority']),
        'color': new FormControl(result['color']),
        'isCpuTask': new FormControl(result['isCpuTask']),
        'crackerBinaryTypeId': new FormControl(result['crackerBinaryTypeId']),
        'isSmall': new FormControl(result['isSmall']),
        'useNewBench': new FormControl(result['useNewBench']),
        // 'isMaskImport': new FormControl(result['isMaskImport']), //Now is not working with it
        'skipKeyspace': new FormControl(null || 0),
        'crackerBinaryId': new FormControl(null || 1),
        "isArchived": new FormControl(false),
        'staticChunks': new FormControl(null || 0),
        'chunkSize': new FormControl(null || this.chunkSize),
        'forcePipe': new FormControl(null || false),
        'preprocessorId': new FormControl(0),
        'preprocessorCommand': new FormControl(''),
        'files': new FormControl(arrFiles),
      });
    });
   }
  }

  ngOnDestroy(){
    this.dtTrigger.unsubscribe();
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

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.canDeactivate()) {
      $event.returnValue = "IE and Edge Message";
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.createForm.valid) {
    return false;
    }
    return true;
  }

  // Modal Information
  closeResult = '';
  open(content) {
    this.modalService.open(content, { size: 'xl' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      },
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  onRefresh(){
    this.rerender();
    this.setdtOptionsAgents();
    this.ngOnInit();
  }
  setdtOptionsAgents(){
    this.dtOptionsAgents  = {
      dom: 'Bfrtip',
      scrollY: "700px",
      scrollCollapse: true,
      select: false,
      autoWidth: false,
      lengthMenu: [
          [10, 25, 50, -1],
          ['10 rows', '25 rows', '50 rows', 'Show all rows']
        ],
      pageLength: 10,
      buttons: {
        dom: {
          button: {
            className: 'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
          }
        },
        buttons: [
          {
            extend: 'pageLength',
            className: 'btn-sm',
            titleAttr: 'Show number of rows',
          }
        ]
      }
      
    }
  }
}
