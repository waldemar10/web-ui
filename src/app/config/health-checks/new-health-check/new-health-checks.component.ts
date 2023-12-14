import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../../core/_services/main.config';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-new-health-checks',
  templateUrl: './new-health-checks.component.html',
})

@PageTitle(['New Health Check'])
export class NewHealthChecksComponent implements OnInit {
  private maxResults = environment.config.prodApiMaxResults;
  // Form create Health Check
  createForm: FormGroup;
  
  constructor(
    private gs: GlobalService,
    private router:Router
  ) { }

  crackertype: any = [];
  crackerversions: any = [];
  
  agents: any[] = [];
  filteredAgents: any[] = [];
  selectedAgents: any[] = [];
  agentInput: string = "";

  ngOnInit(): void {
    const params = {'maxResults': this.maxResults}

    this.gs.getAll(SERV.CRACKERS_TYPES).subscribe((crackers: any) => {
      this.crackertype = crackers.values;
    });

    this.gs.getAll(SERV.AGENTS,params).subscribe((agents: any) => {
      const tempAgents = agents.values;
      tempAgents.forEach(agent => {
        agent.selected = false;
      })
      this.agents = tempAgents;
      this.filteredAgents = tempAgents;
    });

    this.createForm = new FormGroup({
      'checkType': new FormControl(0),
      'hashtypeId': new FormControl(null || 0, [Validators.required]),
      'crackerBinaryId': new FormControl('', [Validators.required]),
    });
  }

  onInput() {
    const input = this.agentInput.toLocaleLowerCase();
    this.filteredAgents = this.agents.filter((agent) => agent.agentName.toLowerCase().includes(input))
  }

  selectAgent(agent: any) {
    agent.selected = !agent.selected;
  }

  selectAll() {
    this.agents.forEach(agent => {
      agent.selected = true;
    })
  }

  selectInactive() {
    this.agents.forEach(agent => {
      if(agent.isActive === false){
        agent.selected = true;
      }
    })
  }

  getSelectedAgents() {
    const temp = [];
    this.agents.forEach((agent) => {
      if(agent.selected)
        temp.push(agent.agentId);
    })
    this.selectedAgents = temp;
  }

  onChangeBinary(id: string){
    const params = {'filter': 'crackerBinaryTypeId='+id+''};
    this.gs.getAll(SERV.CRACKERS,params).subscribe((crackers: any) => {
      this.crackerversions = crackers.values;
    });
  }

  onSubmit(){
    this.getSelectedAgents();
   if (this.createForm.valid && this.selectedAgents.length > 0) {
      const selectedAgents = this.selectedAgents.join(',');
      const mergedObject = {...this.createForm.value, agentIds: selectedAgents};

      this.gs.create(SERV.HEALTH_CHECKS,mergedObject).subscribe(() => {
          Swal.fire({
            title: "Success",
            text: "New Health Check created!",
            icon: "success",
            showConfirmButton: false,
            timer: 1500
          });
          this.router.navigate(['/config/health-checks']);
        }
      );
    }
    else{
      const text = !this.createForm.valid ? "Please fill out all required fields" : "Select at least 1 Agent";
      Swal.fire({
        title: "Failed",
        text: text,
        icon: "error",
        showConfirmButton: false,
        timer: 1500
      })
    }
  }
  
}
