import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerListComponent } from './customer-list.component';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;

  const customers: Customer[] = [
    { id: 1, first_name: 'Ana', last_name: 'Cliente', phone: '5512345678', projects_count: 1, evaluations_count: 2 },
    { id: 2, first_name: 'Beto', last_name: 'Cliente', phone: '5587654321', projects_count: 0, evaluations_count: 0 }
  ];

  beforeEach(async () => {
    customerService = jasmine.createSpyObj<CustomerService>('CustomerService', [
      'getCustomers', 'getCustomerCount'
    ]);
    customerService.getCustomers.and.returnValue(of({ success: true, data: customers } as any));
    customerService.getCustomerCount.and.returnValue(of({
      success: true,
      data: { total: 2, newThisMonth: 3 }
    } as any));

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        { provide: CustomerService, useValue: customerService },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps all four customer KPI values and their original calculations', () => {
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('.kpi-value'),
      (element: Element) => element.textContent?.trim()
    );

    expect(values).toEqual(['2', '1', '1', '3']);
    expect(customerService.getCustomers).toHaveBeenCalledTimes(1);
    expect(customerService.getCustomerCount).toHaveBeenCalledTimes(1);
  });
});
