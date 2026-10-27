import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Quote } from '../../../core/models/quote.model';
import { QuoteService } from '../../../core/services/quote.service';
import { QuoteListComponent } from './quote-list.component';

describe('QuoteListComponent', () => {
  let component: QuoteListComponent;
  let fixture: ComponentFixture<QuoteListComponent>;
  let quoteService: jasmine.SpyObj<QuoteService>;
  let responseQuotes: Quote[];

  const quotes: Quote[] = [
    { id: 1, quote_folio: 101, evaluation_id: null, customer_id: 1, customer_name: 'Ana Draft', version_number: 1, delivery_time: 5, status: 'borrador', evaluation_discount: 0, total_amount: 100, down_payment_percent: 50 },
    { id: 2, quote_folio: 102, evaluation_id: null, customer_id: 2, customer_name: 'Bruno Sent', version_number: 1, delivery_time: 5, status: 'enviada', evaluation_discount: 0, total_amount: 200, down_payment_percent: 50 },
    { id: 3, quote_folio: 103, evaluation_id: null, customer_id: 3, customer_name: 'Carla Accepted', version_number: 1, delivery_time: 5, status: 'aceptada', evaluation_discount: 0, total_amount: 300, down_payment_percent: 50 },
    { id: 4, quote_folio: 104, evaluation_id: null, customer_id: 4, customer_name: 'Diego Rejected', version_number: 1, delivery_time: 5, status: 'rechazada', evaluation_discount: 0, total_amount: 400, down_payment_percent: 50 }
  ];

  beforeEach(async () => {
    responseQuotes = quotes;
    quoteService = jasmine.createSpyObj<QuoteService>('QuoteService', ['getQuotes']);
    quoteService.getQuotes.and.callFake(() => of({ success: true, data: responseQuotes } as any));

    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [
        provideRouter([]),
        { provide: QuoteService, useValue: quoteService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('groups quotes in the requested order and names sent quotes as pending', () => {
    expect(component.statusGroups.map(group => group.status)).toEqual([
      'borrador', 'enviada', 'aceptada', 'rechazada'
    ]);
    expect(component.statusGroups.map(group => group.title)).toEqual([
      'Borradores', 'Pendientes', 'Aceptadas', 'Rechazadas'
    ]);
    expect(component.statusGroups.map(group => group.quotes.length)).toEqual([1, 1, 1, 1]);
    expect(fixture.nativeElement.textContent).toContain('enviada');
  });

  it('renders a counter and an empty message for each section without quotes', () => {
    expect(fixture.nativeElement.querySelectorAll('.status-section-header').length).toBe(4);
    expect(fixture.nativeElement.querySelectorAll('.section-count').length).toBe(4);
    expect(fixture.nativeElement.querySelectorAll('.section-empty-state').length).toBe(0);

    component.onSearch({ target: { value: '101' } } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.section-empty-state').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.section-count')[1].textContent.trim()).toBe('0');
  });

  it('searches by customer and folio while keeping KPI values based on all quotes', () => {
    component.onSearch({ target: { value: '104' } } as unknown as Event);

    expect(component.statusGroups.map(group => group.quotes.length)).toEqual([0, 0, 0, 1]);
    expect(component.totalCount).toBe(4);
    expect(component.enviadasCount).toBe(1);
    expect(component.aceptadasCount).toBe(1);
    expect(component.montoAceptado).toBe(300);

    component.onSearch({ target: { value: 'ana draft' } } as unknown as Event);
    expect(component.statusGroups.map(group => group.quotes.length)).toEqual([1, 0, 0, 0]);
  });

  it('shows a no-results message when search has no matches', () => {
    component.onSearch({ target: { value: 'sin coincidencias' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.hasSearchResults).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron cotizaciones');
    expect(fixture.nativeElement.querySelectorAll('.section-empty-state').length).toBe(4);
  });

  it('shows the general empty state when there are no quotes', () => {
    responseQuotes = [];
    component.loadQuotes();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('no hay cotizaciones.');
    expect(fixture.nativeElement.querySelectorAll('.status-section').length).toBe(0);
  });
});
