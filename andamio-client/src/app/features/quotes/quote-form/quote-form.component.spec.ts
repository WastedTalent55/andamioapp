import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
import {Location} from '@angular/common';
import {of} from 'rxjs';
import {QuoteFormComponent} from './quote-form.component';
import {QuoteService} from '../../../core/services/quote.service';
import {EvaluationService} from '../../../core/services/evaluation.service';

describe('QuoteForm special conditions', () => {
  let fixture: ComponentFixture<QuoteFormComponent>;
  let component: QuoteFormComponent;
  let quotes: jasmine.SpyObj<QuoteService>;
  let route: any;
  beforeEach(async () => {
    quotes = jasmine.createSpyObj('QuoteService', ['getQuoteById', 'getQuoteByEvaluationId', 'createQuote', 'updateQuote']);
    quotes.createQuote.and.returnValue(of({success: true, data: {quoteId: 9}}));
    quotes.updateQuote.and.returnValue(of({success: true, data: {quoteId: 9, versioned: false}}));
    route = {snapshot: {paramMap: convertToParamMap({customerId: 1})}};
    await TestBed.configureTestingModule({imports: [QuoteFormComponent], providers: [
      {provide: QuoteService, useValue: quotes},
      {provide: EvaluationService, useValue: {getEvaluationById: () => of({success: true, data: {customer_id: 1, evaluation_cost: 0}})}},
      {provide: ActivatedRoute, useValue: route}, {provide: Router, useValue: {navigate: jasmine.createSpy()}},
      {provide: Location, useValue: {back: jasmine.createSpy()}}
    ]}).compileComponents();
    spyOn(window, 'alert');
  });
  function start() {
    fixture = TestBed.createComponent(QuoteFormComponent); component = fixture.componentInstance; fixture.detectChanges();
    component.quoteForm.patchValue({delivery_time: 3});
  }
  it('creates with multiline conditions without changing totals', () => {
    start(); component.addRow('labor'); component.laborItems.at(0).patchValue({description: 'Trabajo', unit_price: 100, quantity: 2});
    const before = component.finalAmount;
    component.quoteForm.patchValue({special_conditions: 'Acuerdo ñ 🛠\nSegunda línea'}); component.onSubmit();
    const payload = quotes.createQuote.calls.mostRecent().args[0];
    expect(payload.special_conditions).toBe('Acuerdo ñ 🛠\nSegunda línea'); expect(payload.total_amount).toBe(before); expect(before).toBe(200);
  });
  it('uses 50 percent by default', () => {
    start(); component.onSubmit();
    expect(quotes.createQuote.calls.mostRecent().args[0].down_payment_percent).toBe(50);
  });
  it('submits a configured deposit percentage', () => {
    start(); component.addRow('labor'); component.laborItems.at(0).patchValue({description: 'Trabajo', unit_price: 100, quantity: 1});
    component.quoteForm.patchValue({down_payment_percent: 35}); component.onSubmit();
    expect(quotes.createQuote.calls.mostRecent().args[0].down_payment_percent).toBe(35);
    expect(component.paymentSplit).toEqual({deposit: 35, balance: 65});
  });
  it('accepts both inclusive percentage limits', () => {
    for (const percent of [0, 100]) {
      start(); component.quoteForm.patchValue({down_payment_percent: percent});
      expect(component.quoteForm.get('down_payment_percent')?.valid).toBeTrue();
      component.onSubmit();
      expect(quotes.createQuote.calls.mostRecent().args[0].down_payment_percent).toBe(percent);
      fixture.destroy(); quotes.createQuote.calls.reset();
    }
  });
  it('rejects non-integer percentages and percentages outside 0 to 100', () => {
    for (const invalidPercent of [-1, 100.5, 101]) {
      start(); component.quoteForm.patchValue({down_payment_percent: invalidPercent}); component.onSubmit();
      expect(quotes.createQuote).not.toHaveBeenCalled();
      fixture.destroy();
    }
  });
  it('creates without conditions as null', () => {
    start(); component.onSubmit(); expect(quotes.createQuote.calls.mostRecent().args[0].special_conditions).toBeNull();
  });
  it('validates Unicode characters without truncating input and exposes accessible errors', () => {
    start(); const text = '🛠'.repeat(5000); component.quoteForm.patchValue({special_conditions: text});
    expect(component.quoteForm.valid).toBeTrue(); expect(component.specialConditionsLength).toBe(5000);
    component.quoteForm.patchValue({special_conditions: text + 'x'}); component.onSubmit(); fixture.detectChanges();
    expect(quotes.createQuote).not.toHaveBeenCalled(); expect(component.quoteForm.get('special_conditions')?.value).toBe(text + 'x');
    expect(fixture.nativeElement.querySelector('textarea').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#special-conditions-error').getAttribute('role')).toBe('alert');
  });
  for (const throughEvaluation of [false, true]) {
    for (const conditions of [null, 'Acuerdo anterior\nñ']) {
      it(`loads and edits ${throughEvaluation ? 'evaluation' : 'direct'} quote with ${conditions === null ? 'legacy NULL' : 'conditions'}`, () => {
        route.snapshot.paramMap = convertToParamMap(throughEvaluation ? {evaluationId: 7} : {id: 9});
        const response: any = of({success: true, data: {quote_id: 9, customer_id: 1, delivery_time: 3, down_payment_percent: 37, special_conditions: conditions, items: []}});
        quotes.getQuoteById.and.returnValue(response); quotes.getQuoteByEvaluationId.and.returnValue(response);
        start(); expect(component.quoteForm.value.special_conditions).toBe(conditions ?? '');
        expect(component.quoteForm.value.down_payment_percent).toBe(37);
        component.quoteForm.patchValue({special_conditions: 'Cambio'}); component.onSubmit();
        expect(quotes.updateQuote.calls.mostRecent().args[1].special_conditions).toBe('Cambio');
        expect(quotes.updateQuote.calls.mostRecent().args[1].down_payment_percent).toBe(37);
        component.quoteForm.patchValue({special_conditions: ''}); component.onSubmit();
        expect(quotes.updateQuote.calls.mostRecent().args[1].special_conditions).toBeNull();
      });
    }
  }
});
