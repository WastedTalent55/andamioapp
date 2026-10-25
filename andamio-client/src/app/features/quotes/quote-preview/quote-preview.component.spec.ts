import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
import {of} from 'rxjs';
import jsPDF from 'jspdf';
import {QuotePreviewComponent} from './quote-preview.component';
import {QuoteService} from '../../../core/services/quote.service';
import {TenantService} from '../../../core/services/tenant.service';

describe('QuotePreview special conditions and PDF', () => {
  let fixture: ComponentFixture<QuotePreviewComponent>;
  let component: QuotePreviewComponent;

  const quote: any = {quote_id: 9, customer_id: 1, evaluation_id: null, quote_folio: 9, version_number: 1,
    status: 'borrador', total_amount: 100, evaluation_discount: 0, delivery_time: 3, phone: '0000000000',
    special_conditions: 'Acuerdo ñ\nEntrega especial', items: [{type: 'material', description: 'Material', unit_price: 50, quantity: 2, unit: 'pza'}]};
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [QuotePreviewComponent], providers: [
      {provide: ActivatedRoute, useValue: {snapshot: {paramMap: convertToParamMap({id: 9})}}},
      {provide: Router, useValue: {navigate: jasmine.createSpy()}},
      {provide: QuoteService, useValue: {getQuoteById: () => of({success: true, data: {...quote}}), getQuoteHistory: () => of({success: true, data: []})}},
      {provide: TenantService, useValue: {getMyTenantConfig: () => of({success: true, data: [{company_name: 'Ficticio', terms_conditions: 'Generales vigentes'}]})}}
    ]}).compileComponents();
    fixture = TestBed.createComponent(QuotePreviewComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  it('shows two separate plain text blocks, never user HTML', () => {
    component.quoteData!.special_conditions = '<img src=x onerror=alert(1)>\nAcuerdo'; fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('.terms-section'); expect(sections.length).toBe(2);
    expect(sections[0].textContent).toContain('Generales vigentes'); expect(sections[1].textContent).toContain('<img src=x'); expect(sections[1].querySelector('img')).toBeNull();
  });
  it('omits the particulars for legacy NULL without hiding general terms', () => {
    component.quoteData!.special_conditions = null; fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('.terms-section').length).toBe(1);
  });
  it('downloads short conditions and keeps financial calculations', () => {
    const doc: jsPDF = (component as any).generatePDF();
    expect(doc.getNumberOfPages()).toBe(1);
    spyOn(doc, 'save').and.returnValue(doc); spyOn<any>(component, 'generatePDF').and.returnValue(doc);
    component.downloadPDF(); expect(doc.save).toHaveBeenCalledWith('Cotizacion_9.pdf');
    expect(component.downPayment).toBe(50); expect(component.laborSubtotal + component.materialsSubtotal - component.evaluationDiscount).toBe(100);
  });
  it('applies the selected percentage to the stored final total after discount in preview and PDF', () => {
    const configuredQuote = {...quote, total_amount: 100, evaluation_discount: 25, down_payment_percent: 35,
      items: [{type: 'material', description: 'Material', unit_price: 125, quantity: 1, unit: 'pza'}]};
    spyOn(TestBed.inject(QuoteService) as any, 'getQuoteById')
      .and.returnValue(of({success: true, data: configuredQuote}));
    component.loadInitialData(); fixture.detectChanges();
    expect(component.netTotal).toBe(100);
    expect(component.downPayment).toBe(35);
    expect(component.balanceDue).toBe(65);
    expect(fixture.nativeElement.textContent).toContain('35%');
    expect(fixture.nativeElement.textContent).toContain('$35.00');

    const currencySpy = spyOn<any>(component, 'formatCurrency').and.callThrough();
    const generatedPdf: jsPDF = (component as any).generatePDF();
    expect(generatedPdf.getNumberOfPages()).toBeGreaterThan(0);
    expect(currencySpy).toHaveBeenCalledWith(35);
    expect(currencySpy).toHaveBeenCalledWith(65);
  });
  it('paginates long general and particular conditions', () => {
    component.tenantConfig.terms_conditions = 'Generales de prueba ñ\n'.repeat(250);
    component.quoteData!.special_conditions = 'Particulares de prueba\n'.repeat(210);
    const doc: jsPDF = (component as any).generatePDF(); expect(doc.getNumberOfPages()).toBeGreaterThan(3);
  });
  it('WhatsApp generates the same PDF before opening its existing link', () => {
    const open = spyOn(window, 'open'); const download = spyOn(component, 'downloadPDF'); component.sendWhatsApp(); expect(download).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(jasmine.stringMatching(/^https:\/\/wa.me\//), '_blank');
  });
});
