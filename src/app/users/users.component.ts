import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Component, OnInit,OnDestroy, ViewChild, ChangeDetectorRef,ChangeDetectionStrategy,AfterViewInit, NgZone } from '@angular/core';

import { DataTableDirective } from 'angular-datatables';
import { fileSizeValue, validateFileExt } from './../shared/utils/util';
import { Subject, Subscription } from 'rxjs';

import { ValidationService } from '../core/_services/shared/validation.service';
import { GlobalService } from 'src/app/core/_services/main.service';
import { PageTitle } from 'src/app/core/_decorators/autotitle';
import { environment } from 'src/environments/environment';
import { SERV } from '../core/_services/main.config';
import { error } from 'console';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

@PageTitle(['New User'])
export class UsersComponent implements  OnInit {
  dtSubscription: Subscription;
  createForm: FormGroup;
  singleTabForm: FormGroup;
  multipleTabForm: FormGroup;
  // Default value for the select field in the second tab (multipleTabForm) ; -1 = no group selected (default)
  selectedAccessPermission: any;
  agp:any;
  usedUserNames = [];
  fileData: any;
  userData: any = [];
  content: string;
  showTable = false;
  importantCsvNote = false;
  isIgnoreGroups = false;
  errorInGroups = false;
  nameUsed = false;
  activeTab = 1;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dtTrigger: Subject<any> = new Subject<any>();
  dtOptions: any = {};

  constructor(
     private route:ActivatedRoute,
     private gs: GlobalService,
     private router: Router,
     private cdRef: ChangeDetectorRef,
     private ngZone: NgZone
     ){}

  private maxResults = environment.config.prodApiMaxResults;   

  ngOnInit(): void {

    this.singleTabForm = new FormGroup({
      'name': new FormControl(null, [Validators.required, this.checkUserNameExist.bind(this)]),
      'email': new FormControl(null, [Validators.required, Validators.email]), //Check ValidationService.emailValidator
      'isValid': new FormControl(true),
      'globalPermissionGroupId': new FormControl()
    });
  
    this.multipleTabForm = new FormGroup({
      'sourceData': new FormControl(),
    });


    const params = {'maxResults': this.maxResults};
    this.gs.getAll(SERV.ACCESS_PERMISSIONS_GROUPS,params).subscribe((agp: any) => {
      this.agp = agp.values;
    });

    this.gs.getAll(SERV.USERS,params).subscribe((res: any) => {
      const arrNames = [];
      for(let i=0; i < res.values.length; i++){
        arrNames.push(res.values[i]['name']);
      }
      this.usedUserNames = arrNames;
    });

  }

  onSubmit() {
    if (this.singleTabForm.valid) {
      this.gs.create(SERV.USERS, this.singleTabForm.value).subscribe(() => {
        Swal.fire({
          title: 'Success',
          text: 'New User created!',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500
        });

        this.router.navigate(['users/all-users']);

      });
    }
    if(this.multipleTabForm.valid && this.userData.length > 0 && !this.errorInGroups && !this.nameUsed){
      for(let i=0; i < this.userData.length; i++){
        const arrd = this.userData[i];

        const userDataToSend = { ...arrd };
        delete userDataToSend.group; // Delete the group property from the object

        this.gs.create(SERV.USERS, userDataToSend).subscribe(() => {
          Swal.fire({
            title: 'Success',
            text: 'New User created!',
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
          });
  
          this.router.navigate(['users/all-users']);
  
        });    
      }
    }
  }

  checkPermissionGroup(name: string): number | void{
    
    for (const agp of this.agp) {
      if (agp.name === name) {
        return agp.id;
      }
    }
    this.errorInGroups = true;
    return -1;
  }
  assignToNotSpecifiedGroup() {
    // Reset the userData to the original data
    this.userData = this.extractDataFromContent(this.content);
    this.userData.forEach((ud: any) => {
      ud.globalPermissionGroupId = this.checkPermissionGroup(ud.group);
    });
    try {
      
      for (const user of this.userData) {

        if (user.globalPermissionGroupId === undefined || user.globalPermissionGroupId === -1 && this.selectedAccessPermission) {
          user.globalPermissionGroupId = this.selectedAccessPermission.id;
          user.group = this.selectedAccessPermission.name;
        }
        
      }
      if(this.userData.length > 0 && this.selectedAccessPermission){
        this.errorInGroups = false;
      }
    } catch (error) {
      console.error('Error in function "assignToNotSpecifiedGroup()" :', error);
      this.errorInGroups = true;
    }
  }


  ignoreGroups(isIgnoreGroups: boolean){
    this.errorInGroups = false;
  if(isIgnoreGroups)
  {
    this.assignToNotSpecifiedGroup();
  }
  else
  {
    // Reset the userData to the original data
    this.userData = this.extractDataFromContent(this.content);
    this.userData.forEach((ud: any) => {
      ud.globalPermissionGroupId = this.checkPermissionGroup(ud.group);
    });
  }

  }

  // Connect this with the
  checkUserNameExist(control: FormControl): {[s: string]: boolean}{
    if(this.usedUserNames.indexOf(control.value) !== -1){
      
      return {'nameIsUsed': true};
    }
    return null as any;
  }
  checkUserNameExistInCsv(name: any):number | void{
    
    for(const usedName of this.usedUserNames){
      if(usedName === name){
        this.nameUsed = true;
        return -1;
      }
    }
    return 0;
  }
  onFileChange(event: any): void {
    this.ngZone.run(() => {
    const file = event.target.files[0];
  
    if (file) {
      this.fileData = file;
      this.readCSV(file);
    }
  });
  }

  OnTabChange(tabNumber: number): void {
    this.activeTab = tabNumber;
  }
  isActiveTab(tabNumber: number): boolean {
    return this.activeTab === tabNumber;
  }
  hasErrorInGroup(user: any): boolean {

    const value = this.checkPermissionGroup(user.group);
    if(value === -1){
    return true;
    }
    return false;
  }
  hasErrorInName(user: any): boolean {

    const value = this.checkUserNameExistInCsv(user.name);
    if(value === -1){
    return true;
    }
    return false;
  }

  readCSV(file: File): void {
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      this.content = e.target.result;
      this.showTable = true;
      this.userData = this.extractDataFromContent(this.content);
      this.nameUsed = false;
      this.userData.forEach((ud: any) => {
        ud.globalPermissionGroupId = this.checkPermissionGroup(ud.group);
        this.checkUserNameExistInCsv(ud.name);
      });
      
      this.cdRef.detectChanges();
    };
    
    reader.readAsText(file);
  }
  
  extractDataFromContent(content: string): any[] {
    const lines: string[] = content.split('\n');
    const header: string[] = lines[0].split(';');

    const data: any[] = [];
  
    for (let i = 1; i < lines.length -1; i++) {
      const values: string[] = lines[i].split(';');
      const row: any = {};
      
      if (values.length === header.length) {
        for (let j = 0; j < header.length; j++) {
          row[header[j].trim()] = values[j] ? values[j].trim() : '';
          
        }
        data.push(row);
      } else {
        console.error(`Anzahl der Werte in Zeile ${i + 1} entspricht nicht der Anzahl der Spalten.`);
      }
      
    }
    console.log("data ready");
    return data;
  }
  

}
