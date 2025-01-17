import { FormControl, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { SERV } from '../../../core/_services/main.config';

@Component({
  selector: 'app-new-globalpermissionsgroups',
  templateUrl: './new-globalpermissionsgroups.component.html'
})
@PageTitle(['New Global Permission Group'])
export class NewGlobalpermissionsgroupsComponent implements OnInit {

  // Form
  createForm: FormGroup;
  public isCollapsed = true;

  constructor(
    private gs: GlobalService,
    private router:Router
  ) { }

  ngOnInit(): void {

    this.createForm = new FormGroup({
      'name': new FormControl('', [Validators.required, Validators.minLength(1)]),
    });

  }

  onSubmit(): void{
    if (this.createForm.valid) {

    this.gs.create(SERV.ACCESS_PERMISSIONS_GROUPS,this.createForm.value).subscribe(() => {
      Swal.fire({
        title: "Success",
        text: "Global Permission Group created!",
        icon: "success",
        showConfirmButton: false,
        timer: 1500
      });
      this.router.navigate(['/users/global-permissions-groups']);
    }
  );
  this.createForm.reset(); // success, we reset form
  }
}

}
