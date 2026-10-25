import {calculateQuotePaymentSplit} from './quote-payment';

describe('calculateQuotePaymentSplit', () => {
  it('splits totals in integer cents and keeps the sum exact', () => {
    expect(calculateQuotePaymentSplit(100.01, 50)).toEqual({deposit: 50.01, balance: 50});
    expect(calculateQuotePaymentSplit(100.01, 33)).toEqual({deposit: 33, balance: 67.01});
  });

  it('supports zero and full deposits', () => {
    expect(calculateQuotePaymentSplit(89.99, 0)).toEqual({deposit: 0, balance: 89.99});
    expect(calculateQuotePaymentSplit(89.99, 100)).toEqual({deposit: 89.99, balance: 0});
  });
});
