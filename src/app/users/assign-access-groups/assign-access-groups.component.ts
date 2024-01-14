import {
  faHomeAlt,
  faPlus,
  faTrash,
  faEdit,
  faSave,
  faCancel,
} from '@fortawesome/free-solid-svg-icons';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  QueryList,
} from '@angular/core';
import { environment } from 'src/environments/environment';
import { DataTableDirective } from 'angular-datatables';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Subject,forkJoin, mergeMap, of } from 'rxjs';

import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../core/_services/main.config';

@Component({
  selector: 'app-assign-access-groups',
  templateUrl: './assign-access-groups.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
@PageTitle(['Assign Groups'])
export class AssignGroupsComponent implements OnInit {
  // Form attributtes
  faHome = faHomeAlt;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faSave = faSave;
  faCancel = faCancel;

  private maxResults = environment.config.prodApiMaxResults;
  isFilterOpen = false;
  filterData: any = [];
  selectedStatus: string | undefined = undefined;
  // Datatable
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtTriggerAgents: Subject<any> = new Subject<any>();
  dtOptions: any = {};
  dtOptionsAgents: any = {};

  showAgentsDataForTable: any = [];
  selectedData: Set<any> = new Set();
  agentIds: any;
  selectedGroup: any;

  public agroups: {
    accessGroupId: number;
    groupName: string;
    isEdit: false;
  }[] = [];

  constructor(
    private gs: GlobalService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  updateSelectedData(selectedData: any[]) {
    this.selectedData = new Set(selectedData);
    this.agentIds = selectedData.map((item) => parseInt(item.split('-')[0]));
    this._changeDetectorRef.detectChanges();
  }

  getSelectedDataArray(): any[] {
    return Array.from(this.selectedData);
  }

  updateRowColors(selectedData: any): void {
    const dataArray = Array.from(selectedData);

    this.showAgentsDataForTable.forEach((agent) => {
      const cleanedAgentName = agent.agentName.replace(/\s/g, '');
      const uniqueKey = `${agent.agentId}-${cleanedAgentName.toUpperCase()}`;

      agent.rowClass = dataArray.includes(uniqueKey) ? 'highlighted-row' : '';
    });
  }

  ngOnInit(): void {
    const self = this;
    this.loadAccessGroups();
    this.loadAgentsData();
    this.dtOptionsAgents = {
      dom: 'Bfrtip',
      scrollY: '700px',
      scrollCollapse: true,
      select: {
        style: 'multi',
      },
      columnDefs: [
        {
          orderable: false,
          className: 'select-checkbox',
          targets: 0,
        },
      ],
      order: [[1, 'asc']],
      autoWidth: false,

      lengthMenu: [
        [10, 25, 50, -1],
        ['10 rows', '25 rows', '50 rows', 'Show all rows'],
      ],
      pageLength: 10,
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
            extend: 'pageLength',
            className: 'btn-sm',
            titleAttr: 'Show number of rows',
          },
        ],
      },

      rowCallback: function (row, data, index) {
        $(row).on('click', () => {
          const rowId = data[1];
          const rowName = data[2].toUpperCase();
          const uniqueKey = `${rowId}-${rowName}`;

          if (self.selectedData.has(uniqueKey)) {
            self.selectedData.delete(uniqueKey);
          } else {
            self.selectedData.add(uniqueKey);

            self.updateRowColors(self.selectedData);
            self.updateSelectedData(Array.from(self.selectedData));
          }
        });
      },
    };
  }

  loadAgentsData() {
    const paramsAgent = { maxResults: this.maxResults, expand: 'accessGroups' };
    this.gs.getAll(SERV.AGENTS, paramsAgent).subscribe((agents: any) => {
      this.showAgentsDataForTable = agents.values;

      this.dtTriggerAgents.next(void 0);
    });
  }
  loadAccessGroups() {
    const params = { expand: 'agentMembers' };
    this.gs.getAll(SERV.ACCESS_GROUPS, params).subscribe((agroups: any) => {
      this.agroups = agroups.values;
      this.filterData = agroups.values;
      this.dtTrigger.next(void 0);
    });
  }

  previousSearchTerms: { [key: string]: string } = {};

  search(term: any, key: string) {
    const searchTerm =
      (term.target as HTMLInputElement)?.value?.trim().toLowerCase() ?? '';

    this.previousSearchTerms[key] = searchTerm;
    if (searchTerm === '') {
      delete this.previousSearchTerms[key];
    }

    this.filterData = this.agroups.filter((x) => {
      const searchTermsMatch = Object.keys(this.previousSearchTerms).every(
        (searchKey) => {
          const searchValue = this.previousSearchTerms[searchKey];
          switch (searchKey) {
            case 'id':
              return x.accessGroupId === parseInt(searchValue, 10);
            case 'groupName':
              return x.groupName.trim().toLowerCase().includes(searchValue);
            default:
              return true; // Don't filter on unknown keys
          }
        }
      );

      return searchTermsMatch;
    });
  }

  onRefresh() {
    this.rerender();
    this.ngOnInit();
  }

  rerender(): void {
    this.selectedData = new Set();
    this.agentIds = [];
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      setTimeout(() => {
        this.dtTriggerAgents['new'].next();
      });
    });
  }

  onDelete(id: number) {
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
        this.gs.delete(SERV.ACCESS_GROUPS, id).subscribe(() => {
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
          text: 'Your Access Group is safe!',
          icon: 'error',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }
  onAdd() {
    if (Array.isArray(this.agentIds)) {
      const createObservables = this.agentIds.map((agentId) => {
        return this.gs.getAll(SERV.ACCESS_GROUPS_AGENTS).pipe(
          mergeMap((agroups: any) => {
            const existingAgentIds = agroups.values.map((agroup: any) =>
              agroup.accessGroupId == this.selectedGroup.accessGroupId &&
              agroup.agentId == agentId
                ? agroup.agentId
                : null
            );
  
            if (!existingAgentIds.includes(agentId)) {
              const payload = {
                accessGroupId: this.selectedGroup.accessGroupId,
                agentId: agentId,
              };
  
             
              return this.gs.create(SERV.ACCESS_GROUPS_AGENTS, payload);
            } else {
              
              return of(null);
            }
          })
        );
      });
  
      
      forkJoin(createObservables).subscribe(() => {
      
        Swal.fire({
          title: 'Success',
          text: 'Access Group has been updated',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
        });
  
        this.ngOnInit();
        this.rerender();
      });
    }
  }

  onRemove() {
    if (Array.isArray(this.agentIds)) {
      const deleteObservables = this.agentIds.map((agentId) => {
        return this.gs.getAll(SERV.ACCESS_GROUPS_AGENTS).pipe(
          mergeMap((agroups: any) => {
            let existingId = 0;
            agroups.values.forEach((agroup: any) => {
              if (
                agroup.accessGroupId === this.selectedGroup.accessGroupId &&
                agroup.agentId === agentId
              ) {
                existingId = agroup.accessGroupAgentId;
              }
            });
  
            if (existingId !== 0) {
              return this.gs.delete(SERV.ACCESS_GROUPS_AGENTS, existingId);
            } else {
              return of(null);
            }
          })
        );
      });
  
      forkJoin(deleteObservables).subscribe(() => {

        Swal.fire({
          title: 'Success',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
        });

        this.ngOnInit();
        this.rerender();
      });
    }
  }

  // Add unsubscribe to detect changes
  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
    this.dtTriggerAgents.unsubscribe();
  }
}
