import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllPermitsComponent } from '../../admin/all-permits/all-permits.component';

@Component({
  selector: 'app-global-permits',
  standalone: true,
  imports: [CommonModule, AllPermitsComponent],
  template: `<app-all-permits />`
})
export class GlobalPermitsComponent {}
