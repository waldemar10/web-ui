import {
  faPencil,
  faEdit,
  faTrash,
  faLock,
  faFileImport,
  faFileExport,
  faPlus,
  faHomeAlt,
  faArchive,
  faCopy,
  faBookmark,
  faEye,
  faMicrochip,
  faCheckCircle,
  faTerminal,
  faNoteSticky,
  faPause,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from './../../../environments/environment';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Subject, Subscription, catchError, delay, forkJoin, of } from 'rxjs';

import { GlobalService } from '../../core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../core/_services/main.config';
import { ModalSubtasksComponent } from './modal-subtasks/modal-subtasks.component';
import { use } from 'echarts';
import { FormControl, FormGroup, Validators } from '@angular/forms';
declare let $: any;

@Component({
  selector: 'app-show-tasks',
  templateUrl: './show-tasks.component.html',
})
@PageTitle(['Show Tasks'])
export class ShowTasksComponent implements OnInit {
  faCheckCircle = faCheckCircle;
  faNoteSticky = faNoteSticky;
  faFileImport = faFileImport;
  faFileExport = faFileExport;
  faMicrochip = faMicrochip;
  faTerminal = faTerminal;
  faBookmark = faBookmark;
  faArchive = faArchive;
  faPencil = faPencil;
  faHome = faHomeAlt;
  faTrash = faTrash;
  faEdit = faEdit;
  faLock = faLock;
  faPlus = faPlus;
  faCopy = faCopy;
  faEye = faEye;
  faPause = faPause;
  faPlay = faPlay;
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtTrigger1: Subject<any> = new Subject<any>();
  dtOptions: any = {};
  dtOptionsWithFilter: any;
  dtOptionsWithoutFilter: any;
  private updateSubscription: Subscription;

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
  }

  alltasks: any = []; //Change to Interface
  isArchived: boolean;
  whichView: string;
  isTaskactive = 0;
  currenspeed = 0;
  filterData: any = [];
  data: any = [];
  isFilterOpen = false;
  selectedStatus: string | undefined = undefined;
  selectedInfoPlus: string;
  isFilterApplied = false;
  defaultStatus = '';
  isPaused = false;
  
  private maxResults = environment.config.prodApiMaxResults;
  updateAgentForm: FormGroup;
  updateTaskForm: FormGroup;
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private gs: GlobalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      switch (data['kind']) {
        case 'show-tasks':
          this.whichView = 'live';
          this.isArchived = false;
          break;

        case 'show-tasks-archived':
          this.whichView = 'archived';
          this.isArchived = true;
          break;
      }

      this.getTasks();

      const self = this;
      this.dtOptions = {
        dom: 'Bfrtip',
        bStateSave: true,
        destroy: true,
        autoWidth: true,
        bAutoWidth: true,
        order: [], // Removes the default order by id. We need it to sort by priority.
        pageLength: -1,
        bSortCellsTop: true,
        ordering: false,
        searching: false,
        lengthMenu: [
          [10, 25, 50, -1],
          ['10 rows', '25 rows', '50 rows', 'Show all rows'],
        ],
        select: {
          style: 'multi',
          // selector: 'tr>td:nth-child(1)' //This only allows select the first row
        },
        buttons: {
          dom: {
            button: {
              className:
                'dt-button buttons-collection btn btn-sm-dt btn-outline-gray-600-dt',
            },
          },
          buttons: [
            {
              text: '↻',
              autoClose: true,
              action: function (e, dt, node, config) {
                self.onRefresh();
              },
            },
            {
              extend: 'collection',
              text: 'Export',
              buttons: [
                {
                  extend: 'excelHtml5',
                  exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                  },
                },
                {
                  extend: 'print',
                  exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                  },
                  customize: function (win) {
                    $(win.document.body).css('font-size', '10pt');
                    $(win.document.body)
                      .find('table')
                      .addClass('compact')
                      .css('font-size', 'inherit');
                  },
                },
                {
                  extend: 'csvHtml5',
                  exportOptions: { modifier: { selected: true } },
                  select: true,
                  customize: function (dt, csv) {
                    let data = '';
                    for (let i = 0; i < dt.length; i++) {
                      data = 'Show Tasks\n\n' + dt;
                    }
                    return data;
                  },
                },
                {
                  extend: 'copy',
                },
              ],
            },
            {
              extend: 'collection',
              text: 'Bulk Actions',
              drawCallback: function () {
                const hasRows =
                  this.api().rows({ filter: 'applied' }).data().length > 0;
                $('.buttons-excel')[0].style.visibility = hasRows
                  ? 'visible'
                  : 'hidden';
              },
              buttons: [
                {
                  text: 'Delete Task(s)',
                  autoClose: true,
                  action: function (e, dt, node, config) {
                    self.onDeleteBulk();
                  },
                },
                {
                  text: 'Archive Task(s)',
                  autoClose: true,
                  enabled: !this.isArchived,
                  action: function (e, dt, node, config) {
                    const edit = { isArchived: true };
                    self.onUpdateBulk(edit);
                  },
                },
                // {
                //   text: 'Assign to Project (under construction)',
                //   autoClose: true,
                //   enabled: !this.isArchived,
                //   action: function ( e, dt, node, config ) {
                //     const title = 'Assign to Project'
                //     self.onModalProject(title)
                //   }
                // },
              ],
            },
            {
              text: !this.isArchived ? 'Show Archived' : 'Show Live',
              action: function () {
                if (!self.isArchived) {
                  self.router.navigate(['tasks/show-tasks-archived']);
                }
                if (self.isArchived) {
                  self.router.navigate(['tasks/show-tasks']);
                }
              },
            },
            {
              extend: 'colvis',
              text: 'Column View',
              columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            },
            {
              extend: 'pageLength',
              className: 'btn-sm',
              titleAttr: 'Show number of rows',
            },
            {
              text: 'Filter',
              className: 'btn-sm',
              action: (e, dt, node, config) => {
                this.isFilterOpen = !this.isFilterOpen;
              },
            },
          ],
        },
      };
    });
  }
  previousDropdownFilters: { [key: string]: string } = {};

  previousSearchTerms: { [key: string]: string } = {};

  search(term: any, key: string) {
    const searchTerm =
      (term.target as HTMLInputElement)?.value?.trim().toLowerCase() ?? '';

    this.previousSearchTerms[key] = searchTerm;
    if (searchTerm === '') {
      delete this.previousSearchTerms[key];
    }

    this.filterData = this.alltasks.filter((x) => {
      const dropdownFiltersMatch =
        this.applyStatusFilter(x, this.selectedStatus) &&
        this.applyInfoPlusFilter(x, this.selectedInfoPlus);

      const searchTermsMatch = Object.keys(this.previousSearchTerms).every(
        (searchKey) => {
          const searchValue = this.previousSearchTerms[searchKey];
          switch (searchKey) {
            case 'taskId':
              return x.taskId === parseInt(searchValue, 10);
            case 'taskName':
              return x.taskName.trim().toLowerCase().includes(searchValue);
            case 'hashlistName':
              return x.hashlist[0].name
                .trim()
                .toLowerCase()
                .includes(searchValue);
            case 'cracked':
              return x.hashlist[0].cracked === parseInt(searchValue, 10);
            case 'agents':
              return x.assignedAgents.length === parseInt(searchValue, 10);
            case 'priority':
              return x.priority === parseInt(searchValue, 10);
            case 'maxAgents':
              return x.maxAgents === parseInt(searchValue, 10);
            default:
              return true; // Don't filter on unknown keys
          }
        }
      );

      return dropdownFiltersMatch && searchTermsMatch;
    });
  }

  applyStatusFilter(x: any, selectedStatus: string): boolean {
    switch (selectedStatus) {
      case 'None':
        return true;
      case 'Processing':
        return x.taskId > 0 && x.taskType === 0;
      case 'Completed':
        return (
          x.keyspaceProgress >= x.keyspace &&
          x.keyspaceProgress > 0 &&
          x.taskType === 0
        );
      default:
        return true;
    }
  }

  applyInfoPlusFilter(x: any, selectedInfoPlus: string): boolean {
    switch (selectedInfoPlus) {
      case 'None':
        return true;
      case 'Notes':
        return x.notes !== '' && x.taskType === 0;
      case 'Small tasks':
        return x.isSmall === true && x.taskType === 0;
      case 'CPU only':
        return x.isCpuTask === true && x.taskType === 0;
      case 'Supertask':
        return x.taskType === 1;
      default:
        return true;
    }
  }
  onRefresh() {
    this.ngOnInit();
    this.rerender(); // rerender datatables
  }

  //Get Tasks and SuperTasks combining the task API and the task wrapper
  getTasks(): void {
    const params = {
      maxResults: this.maxResults,
      expand: 'crackerBinary,crackerBinaryType,hashlist,assignedAgents',
      filter: 'isArchived=' + this.isArchived + '',
    };
    this.gs
      .getAll(SERV.TASKS_WRAPPER, { maxResults: this.maxResults })
      .subscribe((tw: any) => {
        this.gs.getAll(SERV.TASKS, params).subscribe((tasks: any) => {
          this.gs
            .getAll(SERV.HASHLISTS, { 'maxResults': this.maxResults, 'expand': 'accessGroup' })
            .subscribe((h: any) => {
              const filtersupert = tw.values.filter(
                (u) => u.taskType == 1 && u.isArchived === this.isArchived
              ); // Active SuperTasks
              const supertasks = filtersupert.map((mainObject) => {
                const matchObject = h.values.find(
                  (element) => element.hashlistId === mainObject.hashlistId
                );
                return { ...mainObject, ...matchObject };
              }); //Join Supertasks from TaskWrapper with Hashlist info
              const hashdata = tasks.values.map((mainObject) => {
                const matchObject = h.values.find(
                  (element) => element.hashlistId === mainObject.hashlist[0].hashlistId
                );
                return { ...mainObject, ...matchObject };
              });
              // Show only tasks with the right accessGroup
              const filteredTasks = hashdata.filter((task) => task.accessGroup);

              const mergeTasks = filteredTasks.map((mainObject) => {
                const matchObject = tw.values.find(
                  (element) =>
                    element.taskWrapperId === mainObject.taskWrapperId
                );
                return { ...mainObject, ...matchObject };
              }); // Join Tasks with Taskwrapper information for filtering
              
              const filtertasks = mergeTasks.filter(
                (u) => u.taskType == 0 && u.isArchived === this.isArchived
              ); //Filter Active Tasks remove subtasks
              const prepdata = filtertasks.concat(supertasks); // Join with supertasks
              
              //Order by Task Priority. filter exclude when is cracked && (a.keyspaceProgress < a.keyspace)
              this.alltasks = prepdata.sort(
                (a, b) => Number(b.priority) - Number(a.priority)
              );
              this.filterData = this.alltasks;
              this.dtTrigger.next(null);
            });
        });
      });
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

  onArchive(id: number, type: number) {
    const path = type === 0 ? SERV.TASKS : SERV.TASKS_WRAPPER;
    this.gs.archive(path, id).subscribe(() => {
      Swal.fire({
        title: 'Success',
        text: 'Archived!',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
      });
      this.ngOnInit();
      this.rerender(); // rerender datatables
    });
  }

  getSubtasks(name: string, id: number) {
    this.gs
      .getAll(SERV.TASKS, {
        maxResults: this.maxResults,
        filter: 'taskWrapperId=' + id + '',
        expand: 'assignedAgents',
      })
      .subscribe((subtasks: any) => {
        const ref = this.modalService.open(ModalSubtasksComponent, {
          centered: true,
          size: 'xl',
        });
        ref.componentInstance.prep = subtasks.values;
        ref.componentInstance.supertaskid = id;
        ref.componentInstance.title = name;
      });
  }
  onPause(task: any) {
    // Pause all Agents assigned to the task
    if (task.assignedAgents.length > 0) {

      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: 'btn',
          cancelButton: 'btn',
        },
        buttonsStyling: false,
      });
      Swal.fire({
        title: 'Are you sure?',
        text: 'The chunks that are currently being processed are not completed.',
        icon: 'warning',
        reverseButtons: true,
        showCancelButton: true,
        cancelButtonColor: '#8A8584',
        confirmButtonColor: '#C53819',
        confirmButtonText: 'Yes, pause!',
      }).then((result) => {
        if (result.isConfirmed) {


      // Set the priority to 0
      let updatePriority = { priority: +0 };
      const updateTaskObservable = this.gs.update(
        SERV.TASKS,
        task.taskId,
        updatePriority
      );
      const updateTaskWrapperObservable = this.gs.update(
        SERV.TASKS_WRAPPER,
        task.taskWrapperId,
        updatePriority
      );
      
      // Set all Agents assigned to the task to active
      task.assignedAgents.map((t: any) => {
        const updateAgent = { isActive: false };
        this.gs.update(SERV.AGENTS, t.agentId, updateAgent).subscribe(
           //
      );
      });

      forkJoin({
        taskResult: updateTaskObservable,
        taskWrapperResult: updateTaskWrapperObservable,
      }).subscribe({
        next: ({ taskResult, taskWrapperResult }) => {
          Swal.fire({
            title: 'Success',
            text: 'Active!',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
          });
          this.isPaused = true;
          this.ngOnInit();
          this.rerender();
        },
        error: (error) => {
          Swal.fire({
            title: 'Error',
            text: 'Error when pausing the task ' + error,
            icon: 'error',
            showConfirmButton: false,
            timer: 1500,
          });
          console.log('Error when pausing the task: ' + error);
        },
      });
    }
    else {
      swalWithBootstrapButtons.fire({
        title: 'Cancelled',
        text: 'Cancelled pause task!',
        icon: 'error',
        showConfirmButton: false,
        timer: 1500,
      });
    }});
    }
  }

  onStart(task: any) {
    // Set all Agents assigned to the task to active
    if (task.assignedAgents.length > 0) {
      // Se the priority to 1
      let updatePriority = { priority: +1 };

      const updateTaskObservable = this.gs.update(
        SERV.TASKS,
        task.taskId,
        updatePriority
      );
      const updateTaskWrapperObservable = this.gs.update(
        SERV.TASKS_WRAPPER,
        task.taskWrapperId,
        updatePriority
      );
    
      // Set all Agents assigned to the task to active
      const updateAgentObservables = null;
      task.assignedAgents.map((t: any) => {
        const updateAgent = { isActive: true };
        this.gs.update(SERV.AGENTS, t.agentId, updateAgent).subscribe(
           //
      );
      });

      forkJoin({
        taskResult: updateTaskObservable,
        taskWrapperResult: updateTaskWrapperObservable,
      }).subscribe({
        next: ({ taskResult, taskWrapperResult }) => {
          Swal.fire({
            title: 'Success',
            text: 'Active!',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
          });
          this.isPaused = false;
          this.ngOnInit();
          this.rerender();
        },
        error: (error) => {
          Swal.fire({
            title: 'Error',
            text: 'Error when playing the task ' + error,
            icon: 'error',
            showConfirmButton: false,
            timer: 1500,
          });
          console.log('Error when playing the task: ' + error);
        },
      });
    }
  }

  onDelete(id: number, type: number) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn',
        cancelButton: 'btn',
      },
      buttonsStyling: false,
    });
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once deleted, it can not be recovered!',
      icon: 'warning',
      reverseButtons: true,
      showCancelButton: true,
      cancelButtonColor: '#8A8584',
      confirmButtonColor: '#C53819',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        const path = type === 0 ? SERV.TASKS : SERV.TASKS_WRAPPER;
        console.log('DELETE ' + path);
        this.gs.delete(path, id).subscribe(() => {
          Swal.fire({
            title: 'Success',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
          });
          this.ngOnInit();
          this.rerender(); // rerender datatables
        });
      } else {
        swalWithBootstrapButtons.fire({
          title: 'Cancelled',
          text: 'Your Task is safe!',
          icon: 'error',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }

  // Bulk actions

  onSelectedTasks() {
    $('.dt-button-background').trigger('click');
    const selection = $($(this.dtElement).DataTable.tables())
      .DataTable()
      .rows({ selected: true })
      .data()
      .pluck(0)
      .toArray();
    if (selection.length == 0) {
      Swal.fire({
        title: "You haven't selected any Task",
        type: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    const selectionnum = selection.map((i) => Number(i));

    return selectionnum;
  }

  onDeleteBulk() {
    const self = this;
    const selectionnum = $($(this.dtElement).DataTable.tables())
      .DataTable()
      .rows({ selected: true })
      .data()
      .pluck(0)
      .toArray();
    const type = String(
      $($(this.dtElement).DataTable.tables())
        .DataTable()
        .rows({ selected: true })
        .data()
        .pluck(3)
        .toArray()
    );
    const search = type.includes('SuperTask');
    const sellen = selectionnum.length;
    const errors = [];
    selectionnum.forEach(function (value) {
      Swal.fire('Deleting...' + sellen + ' Task(s)...Please wait');
      Swal.showLoading();
      const path = !search ? SERV.TASKS : SERV.TASKS_WRAPPER;
      self.gs.delete(SERV.TASKS, value).subscribe((err) => {
        console.log('HTTP Error', err);
        err = 1;
        errors.push(err);
      });
    });
    self.onDone(sellen);
  }

  onUpdateBulk(value: any) {
    const self = this;
    const selectionnum = this.onSelectedTasks();
    const sellen = selectionnum.length;
    const type = String(
      $($(this.dtElement).DataTable.tables())
        .DataTable()
        .rows({ selected: true })
        .data()
        .pluck(3)
        .toArray()
    );
    const search = type.includes('SuperTask');
    selectionnum.forEach(function (id) {
      Swal.fire('Updating...' + sellen + ' Task(s)...Please wait');
      Swal.showLoading();
      const path = !search ? SERV.TASKS : SERV.TASKS_WRAPPER;
      self.gs.update(path, id, value).subscribe();
    });
    self.onDone(sellen);
  }

  onDone(value?: any) {
    setTimeout(() => {
      this.ngOnInit();
      this.rerender(); // rerender datatables
      Swal.close();
      Swal.fire({
        title: 'Done!',
        type: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }, 3000);
  }

  onModalProject(title: string) {
    (async () => {
      $('.dt-button-background').trigger('click');
      const selection = $($(this.dtElement).DataTable.tables())
        .DataTable()
        .rows({ selected: true })
        .data()
        .pluck(0)
        .toArray();
      if (selection.length == 0) {
        Swal.fire({
          title: "You haven't selected any Task",
          type: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      const { value: formValues } = await Swal.fire({
        title: title,
        html: '<input id="project-input" class="swal2-input">',
        focusConfirm: false,
        confirmButtonColor: '#4B5563',
        preConfirm: () => {
          return [
            (<HTMLInputElement>document.getElementById('project-input')).value,
          ];
        },
      });

      if (formValues) {
        const edit = { projectName: +formValues };
        this.onUpdateBulk(edit);
      }
    })();
  }

  onModalUpdate(
    title: string,
    id: number,
    cvalue: any,
    formlabel: boolean,
    nameref: string,
    type: number
  ) {
    (async () => {
      const { value: formValues } = await Swal.fire({
        title: title + ' - ' + nameref,
        html:
          '<input id="project-input" class="swal2-input" type="number" placeholder="' +
          cvalue +
          '">',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonColor: '#C53819',
        confirmButtonColor: '#8A8584',
        cancelButton: true,
        preConfirm: () => {
          return [
            (<HTMLInputElement>document.getElementById('project-input')).value,
          ];
        },
      });

      if (formValues) {
        if (cvalue !== Number(formValues[0])) {
          let update;
          if (formlabel) {
            update = { priority: +formValues };
          } else {
            update = { maxAgents: +formValues };
          }
          const path = type === 0 ? SERV.TASKS : SERV.TASKS_WRAPPER;
          this.gs.update(path, id, update).subscribe(() => {
            Swal.fire({
              title: 'Success',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
            });
            this.ngOnInit();
            this.rerender(); // rerender datatables
          });
        }
      }
    })();
  }
}
