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
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { forkJoin, mergeMap, of } from 'rxjs';

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
  filterDataAgent: any = [];
  selectAllChecked = false;
  selectedStatus: string | undefined = undefined;

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

  ngOnInit(): void {
    this.loadAccessGroups();
    this.loadAgentsData();
  }

  onFilterClick() {
    this.isFilterOpen = !this.isFilterOpen;
  }
  onRowClick(data: any) {
    const rowId = data.agentId;
    const rowName = data.agentName.toUpperCase();
    const uniqueKey = `${rowId}-${rowName}`;

    if (this.selectedData.has(uniqueKey)) {
      this.selectedData.delete(uniqueKey);
    } else {
      this.selectedData.add(uniqueKey);
    }

    this.updateSelectedData(Array.from(this.selectedData));
  }

  isSelected(agent: any): boolean {
    const uniqueKey = `${agent.agentId}-${agent.agentName.toUpperCase()}`;
    return this.selectedData.has(uniqueKey);
  }
  loadAgentsData() {
    const params = { maxResults: this.maxResults };
    const paramsAgent = { maxResults: this.maxResults, expand: 'accessGroups' };
    this.gs.getAll(SERV.AGENTS, paramsAgent).subscribe((agents: any) => {
      this.gs.getAll(SERV.AGENT_ASSIGN, params).subscribe((assign: any) => {
        this.gs.getAll(SERV.TASKS, params).subscribe((t: any) => {
          const getAData = agents.values.map((mainObject) => {
            const matchObjectTask = assign.values.find(
              (e) => e.agentId === mainObject.agentId
            );
            return { ...mainObject, ...matchObjectTask };
          });
          const jointasks = getAData.map((mainObject) => {
            const matchObjectTask = t.values.find(
              (e) => e.taskId === mainObject.taskId
            );
            return { ...mainObject, ...matchObjectTask };
          });
          this.filterDataAgent = jointasks;
          this.showAgentsDataForTable = jointasks;
        });
      });
    });
  }
  loadAccessGroups() {
    const params = { expand: 'agentMembers' };
    this.gs.getAll(SERV.ACCESS_GROUPS, params).subscribe((agroups: any) => {
      this.agroups = agroups.values;
      this.filterData = agroups.values;
    });
  }

  rerender(): void {
    this.selectedData = new Set();
    this.agentIds = [];
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
    if (Array.isArray(this.agentIds) && this.selectedGroup !== undefined) {
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
        this.selectedGroup = this.filterData[0];
        this.ngOnInit();
        this.rerender();
      });
    }
  }

  onRemove() {
    if (Array.isArray(this.agentIds) && this.selectedGroup !== undefined) {
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
          forkJoin(deleteObservables).subscribe(() => {
            Swal.fire({
              title: 'Success',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
            });
            this.selectedGroup = this.filterData[0];
            this.ngOnInit();
            this.rerender();
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
  }

  previousSearchTerms: { [key: string]: string } = {};
  //Search Filter
  search(term: any, key: string) {
    const searchTerm =
      (term.target as HTMLInputElement)?.value?.trim().toLowerCase() ?? '';

    this.previousSearchTerms[key] = searchTerm;
    if (searchTerm === '') {
      delete this.previousSearchTerms[key];
    }

    this.filterDataAgent = this.showAgentsDataForTable.filter((x) => {
      const searchTermsMatch = Object.keys(this.previousSearchTerms).every(
        (searchKey) => {
          const searchValue = this.previousSearchTerms[searchKey];
          switch (searchKey) {
            case 'name':
              return x.agentName.trim().toLowerCase().includes(searchValue);
            case 'assignedTask':
              return x.taskName.trim().toLowerCase().includes(searchValue);
            case 'accessGroup':
              // Check if any element in the accessGroup array includes the search term
              return x.accessGroups.some((group) =>
                group.groupName.trim().toLowerCase().includes(searchValue)
              );

            default:
              return true; // Don't filter on unknown keys
          }
        }
      );
      return searchTermsMatch;
    });
  }

  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;

    if (this.selectAllChecked) {
      this.selectedData.clear();
      this.filterDataAgent.forEach((agent) => {
        const uniqueKey = `${agent.agentId}-${agent.agentName.toUpperCase()}`;
        this.selectedData.add(uniqueKey);
      });
    } else {
      this.selectedData.clear();
    }

    this.updateSelectedData(Array.from(this.selectedData));
  }
}
