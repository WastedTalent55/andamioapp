import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';
import { EvaluationFormComponent } from './evaluation-form.component';
import { CustomerService } from '../../../core/services/customer.service';
import { EvaluationService } from '../../../core/services/evaluation.service';

describe('EvaluationFormComponent', () => {
  let fixture: ComponentFixture<EvaluationFormComponent>;
  let component: EvaluationFormComponent;
  let customers: jasmine.SpyObj<CustomerService>;
  let evaluations: jasmine.SpyObj<EvaluationService>;
  let router: jasmine.SpyObj<Router>;
  let route: any;
  const customer = {id: 1, first_name: 'Cliente', last_name: 'Prueba', phone: '', address_id: 11, full_address: 'Calle ficticia'};

  beforeEach(async () => {
    customers = jasmine.createSpyObj('CustomerService', ['getCustomers', 'createCustomer', 'getCustomerById']);
    customers.getCustomers.and.returnValue(of({success: true, data: [customer]}));
    customers.createCustomer.and.returnValue(of({success: true, data: {id: 9}}));
    customers.getCustomerById.and.returnValue(of({success: true, data: {...customer, id: 9, address_id: 19}}));
    evaluations = jasmine.createSpyObj('EvaluationService', ['getEvaluationById', 'createEvaluation', 'updateEvaluationDetails']);
    evaluations.createEvaluation.and.returnValue(of({success: true, data: {id: 5}}));
    evaluations.updateEvaluationDetails.and.returnValue(of({success: true}));
    router = jasmine.createSpyObj('Router', ['navigate']);
    route = {queryParams: of({}), snapshot: {paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({})}};
    await TestBed.configureTestingModule({imports: [EvaluationFormComponent], providers: [
      {provide: CustomerService, useValue: customers}, {provide: EvaluationService, useValue: evaluations},
      {provide: Router, useValue: router}, {provide: ActivatedRoute, useValue: route},
      {provide: Location, useValue: jasmine.createSpyObj('Location', ['back'])}
    ]}).compileComponents();
    spyOn(window, 'alert');
  });

  function start() {
    fixture = TestBed.createComponent(EvaluationFormComponent);
    component = fixture.componentInstance; fixture.detectChanges();
  }
  function fillDraft() {
    component.selectCustomer(customer);
    component.evaluationForm.patchValue({scheduled_date_date: '2026-11-20', scheduled_date_time: '14:35', evaluation_cost: 150, requested_work: 'Trabajo ficticio', requirements: 'Conservar notas'});
  }

  it('selects an existing customer and its address', () => {
    start(); component.selectCustomer(customer);
    expect(component.evaluationForm.value.customer_id).toBe(1);
    expect(component.evaluationForm.value.address_id).toBe(11);
  });

  it('clears a stale selection when the customer search changes', () => {
    start(); fillDraft(); component.onSearch({target: {value: 'Otro'}});
    expect(component.evaluationForm.value.customer_id).toBe('');
    expect(component.evaluationForm.value.address_id).toBe('');
    expect(component.evaluationForm.value.requested_work).toBe('Trabajo ficticio');
  });

  it('does not retain an old address for a customer without one', () => {
    start(); fillDraft(); component.selectCustomer({...customer, id: 2, address_id: undefined});
    expect(component.filteredAddresses).toEqual([]);
    expect(component.evaluationForm.value.address_id).toBe('');
  });

  it('focuses the name input and cancels without creating records', () => {
    start(); fillDraft(); const draft = {...component.evaluationForm.value};
    component.openCustomerModal();
    expect(component.customerDialog.nativeElement.open).toBeTrue();
    expect(document.activeElement?.getAttribute('formControlName')).toBe('first_name');
    component.closeCustomerModal();
    expect(component.evaluationForm.value).toEqual(draft);
    expect(customers.createCustomer).not.toHaveBeenCalled();
    expect(evaluations.createEvaluation).not.toHaveBeenCalled();
  });

  it('preserves the draft and selects the created customer and address', () => {
    start(); fillDraft(); component.openCustomerModal();
    const child = component.modalCustomerForm!;
    child.customerForm.patchValue({first_name: 'Nuevo', address: 'Calle nueva'});
    child.onSubmit();
    expect(component.evaluationForm.value).toEqual(jasmine.objectContaining({customer_id: 9, address_id: 19, scheduled_date_date: '2026-11-20', scheduled_date_time: '14:35', evaluation_cost: 150, requested_work: 'Trabajo ficticio', requirements: 'Conservar notas'}));
    expect(component.customerDialog.nativeElement.open).toBeFalse();
    expect(evaluations.createEvaluation).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('blocks Escape cancellation during a customer save', () => {
    start(); component.openCustomerModal(); component.modalCustomerForm!.submitting = true;
    const cancel = new Event('cancel', {cancelable: true});
    component.onCustomerDialogCancel(cancel); component.closeCustomerModal();
    expect(cancel.defaultPrevented).toBeTrue();
    expect(component.customerDialog.nativeElement.open).toBeTrue();
    component.modalCustomerForm!.submitting = false; component.closeCustomerModal();
  });

  it('does not use an evaluation ID as the embedded customer ID and preserves edit dates', () => {
    route.snapshot.paramMap = convertToParamMap({id: 44});
    evaluations.getEvaluationById.and.returnValue(of({success: true, data: {id: 44, customer_id: 1, address_id: 11, scheduled_date: '2026-11-20T14:35:00.000Z', evaluation_cost: 150, requested_work: 'Trabajo', status: 'pendiente'}} as any));
    start(); component.openCustomerModal();
    expect(component.modalCustomerForm!.isEditMode).toBeFalse();
    expect(customers.getCustomerById).not.toHaveBeenCalled();
    expect(component.evaluationForm.value.scheduled_date_date).toBe('2026-11-20');
    expect(component.evaluationForm.value.scheduled_date_time).toBe('14:35');
    component.closeCustomerModal(); component.onSubmit();
    expect(evaluations.updateEvaluationDetails).toHaveBeenCalledWith(44, jasmine.objectContaining({scheduled_date: '2026-11-20T14:35'}));
  });

  it('preserves API serialization without separate date/time fields', () => {
    start(); fillDraft(); component.onSubmit();
    const payload = evaluations.createEvaluation.calls.mostRecent().args[0];
    expect(payload.scheduled_date).toBe('2026-11-20T14:35');
    expect('scheduled_date_date' in payload).toBeFalse();
    expect('scheduled_date_time' in payload).toBeFalse();
  });

  it('validates required date/time without submitting invalid data', () => {
    start(); component.onSubmit(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#date-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#time-error')).not.toBeNull();
    expect(evaluations.createEvaluation).not.toHaveBeenCalled();
  });

  it('preserves inputs on API errors and blocks double submission', () => {
    const pending = new Subject<any>(); evaluations.createEvaluation.and.returnValue(pending);
    start(); fillDraft(); const draft = {...component.evaluationForm.value};
    component.onSubmit(); component.onSubmit();
    expect(evaluations.createEvaluation).toHaveBeenCalledTimes(1);
    pending.error({status: 500});
    expect(component.submitting).toBeFalse();
    expect(component.submitError).toContain('Tus datos se conservan');
    expect(component.evaluationForm.value).toEqual(draft);
  });

  it('retries customer loading after a failure', () => {
    customers.getCustomers.and.returnValues(throwError(() => ({status: 500})), of({success: true, data: [customer]}));
    start(); expect(component.customerLoadError).not.toBe('');
    component.loadCustomers(); expect(component.customers).toEqual([customer]);
    expect(component.customerLoadError).toBe('');
  });
});
