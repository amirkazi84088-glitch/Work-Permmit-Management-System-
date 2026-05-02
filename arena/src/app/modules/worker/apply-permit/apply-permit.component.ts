import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PermitService } from '../../../core/services/permit.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermitTypeOption } from '../../../core/models';

@Component({
  selector: 'app-apply-permit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="breadcrumb">
        <a href="#" onclick="history.back(); return false;">Dashboard</a>
        <span class="bc-separator">›</span>
        <span class="bc-current">Apply for Work Permit</span>
      </div>

      <div class="page-header">
        <div class="page-title-section">
          <h2>Apply for Work Permit</h2>
          <p>Fill in the details below to submit a permit application</p>
        </div>
      </div>

      <form [formGroup]="permitForm" (ngSubmit)="onSubmit()">
        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start;">

          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="card">
              <div class="card-header"><h3>Basic Information</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Permit Title <span class="required">*</span></label>
                  <input type="text" formControlName="title" class="form-control"
                    [class.is-invalid]="isInvalid('title')"
                    placeholder="e.g. Welding work on Boiler Unit B2" />
                  @if (getError('title', 'required')) { <span class="form-error">Title is required</span> }
                  @if (getError('title', 'minlength')) { <span class="form-error">Title must be at least 5 characters</span> }
                </div>

                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">Permit Type <span class="required">*</span></label>
                    <select formControlName="permitTypeId" class="form-control" [class.is-invalid]="isInvalid('permitTypeId')">
                      <option value="">Select type...</option>
                      @for (type of permitTypes(); track type.id) {
                        <option [value]="type.id">{{ type.name }}</option>
                      }
                    </select>
                    @if (isInvalid('permitTypeId')) { <span class="form-error">Permit type is required</span> }
                  </div>

                  <div class="form-group">
                    <label class="form-label">Risk Level <span class="required">*</span></label>
                    <select formControlName="riskLevel" class="form-control" [class.is-invalid]="isInvalid('riskLevel')">
                      <option value="">Select risk...</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    @if (isInvalid('riskLevel')) { <span class="form-error">Risk level is required</span> }
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Description <span class="required">*</span></label>
                  <textarea formControlName="description" class="form-control"
                    [class.is-invalid]="isInvalid('description')"
                    placeholder="Describe the work to be performed in detail..."
                    rows="4"></textarea>
                  @if (getError('description', 'required')) { <span class="form-error">Description is required</span> }
                  @if (getError('description', 'minlength')) { <span class="form-error">Description must be at least 10 characters</span> }
                </div>

                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">Work Location <span class="required">*</span></label>
                    <input type="text" formControlName="location" class="form-control"
                      [class.is-invalid]="isInvalid('location')"
                      placeholder="e.g. Plant A, Floor 2" />
                    @if (getError('location', 'required')) { <span class="form-error">Location is required</span> }
                    @if (getError('location', 'minlength')) { <span class="form-error">Location must be at least 3 characters</span> }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Work Area</label>
                    <input type="text" formControlName="workArea" class="form-control"
                      placeholder="Specific area or zone" />
                  </div>
                </div>

                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">Start Date & Time <span class="required">*</span></label>
                    <input type="datetime-local" formControlName="startDate" class="form-control"
                      [class.is-invalid]="isInvalid('startDate')" />
                    @if (getError('startDate', 'required')) { <span class="form-error">Start date is required</span> }
                  </div>
                  <div class="form-group">
                    <label class="form-label">End Date & Time <span class="required">*</span></label>
                    <input type="datetime-local" formControlName="endDate" class="form-control"
                      [class.is-invalid]="isInvalid('endDate') || !!permitForm.errors?.['invalidDateRange']" />
                    @if (getError('endDate', 'required')) { <span class="form-error">End date is required</span> }
                    @if (permitForm.errors?.['invalidDateRange'] && permitForm.get('endDate')?.touched) {
                      <span class="form-error">End date must be after start date</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="card">
              <div class="card-header"><h3>Submit</h3></div>
              <div class="card-body">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                  Review your application before submitting. Once submitted, it will go to your supervisor for approval.
                </p>
                @if (submitError()) {
                  <div class="alert alert-danger" style="margin-bottom: 16px; font-size: 0.85rem;">
                    {{ submitError() }}
                  </div>
                }
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <button type="submit" class="btn btn-primary" [disabled]="loading()">
                    @if (loading()) { <span class="btn-spinner"></span> Submitting... }
                    @else { Submit Application }
                  </button>
                  <button type="button" class="btn btn-secondary" [disabled]="loading()"
                    (click)="saveDraft()">
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h3>Checklist</h3></div>
              <div class="card-body">
                <div class="checklist">
                  <div class="check-item" [class.done]="permitForm.get('title')?.value">
                    <span class="check-icon">{{ permitForm.get('title')?.value ? 'OK' : '--' }}</span>
                    Title added
                  </div>
                  <div class="check-item" [class.done]="permitForm.get('permitTypeId')?.value">
                    <span class="check-icon">{{ permitForm.get('permitTypeId')?.value ? 'OK' : '--' }}</span>
                    Permit type selected
                  </div>
                  <div class="check-item" [class.done]="permitForm.get('riskLevel')?.value">
                    <span class="check-icon">{{ permitForm.get('riskLevel')?.value ? 'OK' : '--' }}</span>
                    Risk level set
                  </div>
                  <div class="check-item" [class.done]="permitForm.get('startDate')?.value && permitForm.get('endDate')?.value && !permitForm.errors?.['invalidDateRange']">
                    <span class="check-icon">{{ (permitForm.get('startDate')?.value && permitForm.get('endDate')?.value && !permitForm.errors?.['invalidDateRange']) ? 'OK' : '--' }}</span>
                    Dates defined
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .checklist { display: flex; flex-direction: column; gap: 10px; }
    .check-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted); }
    .check-item.done { color: var(--success); }
    .check-icon { font-size: 12px; min-width: 22px; font-weight: 600; }
  `]
})
export class ApplyPermitComponent implements OnInit {
  private fb = inject(FormBuilder);
  private permitService = inject(PermitService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private authService = inject(AuthService);

  permitForm!: FormGroup;
  loading = signal(false);
  submitError = signal('');
  permitTypes = signal<PermitTypeOption[]>([]);

  ngOnInit(): void {
    this.permitForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), this.trimRequiredValidator]],
      description: ['', [Validators.required, Validators.minLength(10), this.trimRequiredValidator]],
      permitTypeId: ['', Validators.required],
      riskLevel: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3), this.trimRequiredValidator]],
      workArea: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      estimatedDuration: ['']
    }, { validators: this.dateRangeValidator });

    this.permitService.getPermitTypes().subscribe({
      next: (types) => this.permitTypes.set((types || []).filter(type => type?.isActive !== false)),
      error: () => {
        this.submitError.set('Unable to load permit types.');
      }
    });
  }

  isInvalid(field: string): boolean {
    const c = this.permitForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getError(field: string, error: string): boolean {
    const c = this.permitForm.get(field);
    return !!(c?.touched && c?.hasError(error));
  }

  saveDraft(): void {
    const payload = this.buildPermitPayload();
    this.loading.set(true);
    this.submitError.set('');
    this.permitService.createPermit(payload).subscribe({
      next: (permit) => {
        this.loading.set(false);
        this.toastService.success('Draft saved', `Permit draft saved as ${permit.permitNumber || 'new permit'}`);
        this.router.navigate(['/worker/my-permits']);
      },
      error: (err) => {
        this.loading.set(false);
        this.submitError.set(err?.error?.message || 'Failed to save draft');
      }
    });
  }

  onSubmit(): void {
    if (this.permitForm.invalid) {
      this.permitForm.markAllAsTouched();
      this.submitError.set('Please fill all required fields before submitting.');
      return;
    }

    this.loading.set(true);
    this.submitError.set('');

    this.permitService.createPermit(this.buildPermitPayload()).subscribe({
      next: (permit) => {
        this.permitService.submitPermit(permit.id).subscribe({
          next: () => {
            this.loading.set(false);
            this.toastService.success('Permit submitted!', `${permit.permitNumber} sent for supervisor approval`);
            this.router.navigate(['/worker/my-permits']);
          },
          error: (err) => {
            this.loading.set(false);
            this.submitError.set(err?.error?.message || 'Failed to submit permit');
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.submitError.set(err?.error?.message || 'Failed to create permit');
      }
    });
  }

  private buildPermitPayload(): Record<string, unknown> {
    const raw = this.permitForm.getRawValue();
    const currentUser = this.authService.user();
    return {
      title: raw.title?.trim(),
      description: raw.description?.trim(),
      permitTypeId: Number(raw.permitTypeId),
      riskLevel: raw.riskLevel,
      location: raw.location?.trim(),
      workArea: raw.workArea?.trim() || undefined,
      departmentId: currentUser?.departmentId,
      startDate: this.normalizeDateTime(raw.startDate),
      endDate: this.normalizeDateTime(raw.endDate),
      estimatedDuration: raw.estimatedDuration || undefined
    };
  }

  private normalizeDateTime(value: string): string {
    if (!value) {
      return value;
    }
    return value.length === 16 ? `${value}:00` : value;
  }

  private trimRequiredValidator(control: { value: string | null | undefined }) {
    const value = control.value ?? '';
    return value.trim().length > 0 ? null : { required: true };
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) {
      return null;
    }
    return new Date(end) > new Date(start) ? null : { invalidDateRange: true };
  }
}
