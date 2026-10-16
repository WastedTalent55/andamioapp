import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
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

  it('starts without suggestions and filters cached customers without new requests', () => {
    start();
    expect(component.filteredCustomers).toEqual([]);
    for (const term of ['C', 'cli', '  CLIENTE  ', '   ']) {
      component.onSearch({target: {value: term}});
      expect(component.filteredCustomers.length).toBe(term.trim() ? 1 : 0);
    }
    expect(component.customerSuggestionsOpen).toBeFalse();
    expect(customers.getCustomers).toHaveBeenCalledTimes(1);
  });

  it('deduplicates suggestions while retaining every available address', () => {
    customers.getCustomers.and.returnValue(of({success: true, data: [
      customer, {...customer, address_id: 12, full_address: 'Segunda dirección'}, customer
    ]}));
    start(); component.onSearch({target: {value: 'prueba'}});
    expect(component.filteredCustomers.length).toBe(1);
    component.selectCustomer(component.filteredCustomers[0]);
    expect(component.filteredAddresses.map(address => address.id)).toEqual([11, 12]);
    expect(component.evaluationForm.value.customer_id).toBe(1);
    expect(component.evaluationForm.value.address_id).toBe(11);
  });

  it('supports arrows, Enter and Escape with an accessible active option', () => {
    customers.getCustomers.and.returnValue(of({success: true, data: [customer, {...customer, id: 2, address_id: 22}]}));
    start(); component.onSearch({target: {value: 'Cliente'}}); fixture.detectChanges();
    expect(component.activeCustomerOptionId).toBe('evaluation-customer-option-1');
    component.onCustomerSearchKeydown(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    expect(component.activeCustomerOptionId).toBe('evaluation-customer-option-2');
    component.onCustomerSearchKeydown(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
    expect(component.activeCustomerOptionId).toBe('evaluation-customer-option-1');
    const enter = new KeyboardEvent('keydown', {key: 'Enter', cancelable: true});
    component.onCustomerSearchKeydown(enter); fixture.detectChanges();
    expect(enter.defaultPrevented).toBeTrue();
    expect(component.evaluationForm.value.customer_id).toBe(1);
    expect(component.customerSuggestionsOpen).toBeFalse();
    expect(evaluations.createEvaluation).not.toHaveBeenCalled();
    component.onSearch({target: {value: 'Cliente'}});
    component.onCustomerSearchKeydown(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(component.customerSuggestionsOpen).toBeFalse();
    expect(component.activeCustomerOptionId).toBeNull();
    component.onCustomerSearchKeydown(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
    expect(component.activeCustomerOptionId).toBe('evaluation-customer-option-2');
  });

  it('offers creation only for a nonempty search with no matches', () => {
    start(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-match-box')).toBeNull();
    component.onSearch({target: {value: 'Cliente'}}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-match-box')).toBeNull();
    component.onSearch({target: {value: 'Persona nueva'}}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-match-box button').textContent).toContain('Agregar nuevo cliente');
    const open = spyOn(component, 'openCustomerModal');
    const enter = new KeyboardEvent('keydown', {key: 'Enter', cancelable: true});
    component.onCustomerSearchKeydown(enter);
    expect(open).toHaveBeenCalledTimes(1);
    expect(enter.defaultPrevented).toBeTrue();
  });

  it('does not offer creation while loading and uses the typed term after loading', () => {
    const pending = new Subject<any>(); customers.getCustomers.and.returnValue(pending);
    start(); component.onSearch({target: {value: 'Persona nueva'}}); fixture.detectChanges();
    expect(component.customerSuggestionsOpen).toBeFalse();
    expect(fixture.nativeElement.querySelector('.no-match-box')).toBeNull();
    component.openCustomerModal(); expect(component.customerModalOpen).toBeFalse();
    pending.next({success: true, data: [customer]}); pending.complete(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-match-box')).not.toBeNull();
    expect(customers.getCustomers).toHaveBeenCalledTimes(1);
  });

  it('keeps API failure distinct from an empty search result', () => {
    customers.getCustomers.and.returnValue(throwError(() => ({status: 500})));
    start(); component.onSearch({target: {value: 'Persona nueva'}}); fixture.detectChanges();
    expect(component.customerLoadError).not.toBe('');
    expect(fixture.nativeElement.querySelector('.no-match-box')).toBeNull();
    component.openCustomerModal(); expect(component.customerModalOpen).toBeFalse();
  });

  it('unsubscribes from delayed customers before they can register a destroyed route subscription', () => {
    const pending = new Subject<any>(), params = new Subject<any>();
    customers.getCustomers.and.returnValue(pending); route.queryParams = params;
    start(); expect(pending.observed).toBeTrue(); fixture.destroy();
    expect(pending.observed).toBeFalse();
    pending.next({success: true, data: [customer]}); pending.complete();
    expect(component.customers).toEqual([]); expect(params.observed).toBeFalse();
  });

  it('unsubscribes from query parameters after a normal customer response', () => {
    const params = new Subject<any>(); route.queryParams = params;
    start(); expect(params.observed).toBeTrue(); fixture.destroy(); expect(params.observed).toBeFalse();
    params.next({clientId: 1}); expect(component.evaluationForm.getRawValue().customer_id).toBe('');
  });

  it('locks editing through both delayed requests, then preserves the new draft and created customer', () => {
    const customerResponse = new Subject<any>(), evaluationResponse = new Subject<any>();
    customers.getCustomers.and.returnValue(customerResponse);
    evaluations.getEvaluationById.and.returnValue(evaluationResponse);
    route.snapshot.paramMap = convertToParamMap({id: 44}); start();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('#evaluation-customer');
    const work: HTMLInputElement = fixture.nativeElement.querySelector('#evaluation-work');
    expect(component.loadingEvaluation).toBeTrue(); expect(component.evaluationForm.disabled).toBeTrue();
    expect(search.disabled).toBeTrue(); expect(work.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('form [role=status]').textContent).toContain('Cargando evaluación');
    search.focus(); work.focus(); expect(document.activeElement).not.toBe(search); expect(document.activeElement).not.toBe(work);
    customerResponse.next({success: true, data: [customer]}); customerResponse.complete(); fixture.detectChanges();
    expect(component.loadingCustomers).toBeFalse(); expect(component.evaluationForm.disabled).toBeTrue();
    component.onSearch({target: {value: 'Nuevo'}}); component.selectCustomer({...customer, id: 9});
    component.openCustomerModal(); component.onSubmit();
    expect(component.searchTerm).toBe(''); expect(component.customerModalOpen).toBeFalse();
    expect(component.evaluationForm.getRawValue().customer_id).toBe('');
    expect(evaluations.updateEvaluationDetails).not.toHaveBeenCalled();
    evaluationResponse.next({success: true, data: {id: 44, customer_id: 1, address_id: 11,
      scheduled_date: '2026-11-20T14:35:00.000Z', requested_work: 'Trabajo original'}});
    evaluationResponse.complete(); fixture.detectChanges();
    expect(component.loadingEvaluation).toBeFalse(); expect(work.disabled).toBeFalse(); expect(search.disabled).toBeFalse();
    expect(component.evaluationForm.value.requested_work).toBe('Trabajo original');
    component.evaluationForm.patchValue({requested_work: 'Borrador nuevo'}); component.openCustomerModal();
    component.modalCustomerForm!.customerForm.patchValue({first_name: 'Nuevo', address: 'Calle nueva'});
    component.modalCustomerForm!.onSubmit();
    expect(component.evaluationForm.value).toEqual(jasmine.objectContaining({customer_id: 9, address_id: 19, requested_work: 'Borrador nuevo'}));
  });

  it('keeps editing locked on customer load errors while allowing retry', () => {
    route.snapshot.paramMap = convertToParamMap({id: 44});
    customers.getCustomers.and.returnValues(throwError(() => ({status: 500})), of({success: true, data: [customer]}));
    const pending = new Subject<any>(); evaluations.getEvaluationById.and.returnValue(pending); start();
    const retry: HTMLButtonElement = fixture.nativeElement.querySelector('.search-container [role=alert] button');
    expect(retry.disabled).toBeFalse(); expect(component.evaluationForm.disabled).toBeTrue();
    retry.click(); fixture.detectChanges();
    expect(component.customerLoadError).toBe(''); expect(component.loadingEvaluation).toBeTrue();
    pending.next({success: true, data: {customer_id: 1, address_id: 11, scheduled_date: '2026-11-20T14:35:00.000Z', requested_work: 'Original'}});
    pending.complete(); fixture.detectChanges(); expect(component.evaluationForm.enabled).toBeTrue();
  });

  it('ignores a delayed evaluation response and error after leaving the form', () => {
    route.snapshot.paramMap = convertToParamMap({id: 44});
    const pending = new Subject<any>(); evaluations.getEvaluationById.and.returnValue(pending);
    start(); const before = component.evaluationForm.getRawValue(); fixture.destroy(); expect(pending.observed).toBeFalse();
    pending.next({success: true, data: {customer_id: 1, requested_work: 'Respuesta tardía'}}); pending.error({status: 500});
    expect(component.evaluationForm.getRawValue()).toEqual(before); expect(window.alert).not.toHaveBeenCalled();
  });

  for (const editing of [false, true]) {
    it(`cancels a pending evaluation ${editing ? 'update' : 'creation'} without late navigation`, () => {
      const pending = new Subject<any>();
      if (editing) {
        route.snapshot.paramMap = convertToParamMap({id: 44});
        evaluations.getEvaluationById.and.returnValue(of({success: true, data: {customer_id: 1}} as any));
        evaluations.updateEvaluationDetails.and.returnValue(pending);
      } else evaluations.createEvaluation.and.returnValue(pending);
      start(); fillDraft(); component.onSubmit(); expect(pending.observed).toBeTrue(); fixture.destroy(); expect(pending.observed).toBeFalse();
      const busy = component.submitting; pending.next({success: true, data: {id: 44}}); pending.complete();
      expect(router.navigate).not.toHaveBeenCalled(); expect(window.alert).not.toHaveBeenCalled(); expect(component.submitting).toBe(busy);
    });
  }

});


@Component({standalone: true, template: '<p>Otra pantalla</p>'})
class AwayComponent {}

describe('EvaluationForm navigation during HTTP loading', () => {
  it('cancels the HttpClient request when navigating away before customers arrive', async () => {
    await TestBed.configureTestingModule({providers: [
      provideRouter([{path: 'evaluations/new', component: EvaluationFormComponent}, {path: 'away', component: AwayComponent}]),
      provideHttpClient(), provideHttpClientTesting()
    ]}).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create('/evaluations/new');
    const component = harness.routeDebugElement!.componentInstance as EvaluationFormComponent;
    const request = http.expectOne(req => req.url.endsWith('/customers'));
    await harness.navigateByUrl('/away'); expect(request.cancelled).toBeTrue(); expect(component.customers).toEqual([]); http.verify();
  });
});
