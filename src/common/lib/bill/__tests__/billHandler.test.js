import { createManualBillHandler } from '../billHandler';
import billHelper from '../../../helpers/bill.helper';

jest.mock('../../../helpers/bill.helper', () => ({
    __esModule: true,
    default: { addObject: jest.fn((doc) => Promise.resolve(doc)) },
}));

const items = [
    { name: 'Paneer Butter Masala', price: 320, quantity: 2 },
    { name: 'Extra naan (off-menu)', price: 40, quantity: 3 },
];

beforeEach(() => billHelper.addObject.mockClear());

describe('createManualBillHandler', () => {
    it('prices the bill from the payload', async () => {
        const bill = await createManualBillHandler({ customer_name: 'Aditya', items });

        expect(bill.subtotal).toBe(760);   // 320*2 + 40*3
        expect(bill.tax).toBe(38);         // 5% of 760
        expect(bill.total).toBe(798);
        expect(bill.bill_number).toMatch(/^BILL-/);
        expect(bill.customer_name).toBe('Aditya');
    });

    it('subtracts discount and never goes below zero', async () => {
        const bill = await createManualBillHandler({
            customer_name: 'Aditya', items, discount: 10000,
        });
        expect(bill.total).toBe(0);
    });

    it('rounds float drift to paise', async () => {
        const bill = await createManualBillHandler({
            customer_name: 'Aditya', items: [{ name: 'Sweet', price: 0.1, quantity: 3 }],
        });
        expect(bill.subtotal).toBe(0.3);
    });

    it('defaults quantity to 1', async () => {
        const bill = await createManualBillHandler({
            customer_name: 'Aditya', items: [{ name: 'Coffee', price: 100 }],
        });
        expect(bill.items[0].quantity).toBe(1);
    });

    it.each([
        ['blank customer_name', { customer_name: '  ', items }],
        ['no items', { customer_name: 'A', items: [] }],
        ['unnamed item', { customer_name: 'A', items: [{ price: 10, quantity: 1 }] }],
        ['negative price', { customer_name: 'A', items: [{ name: 'X', price: -5, quantity: 1 }] }],
        ['non-numeric price', { customer_name: 'A', items: [{ name: 'X', price: 'free', quantity: 1 }] }],
        ['fractional quantity', { customer_name: 'A', items: [{ name: 'X', price: 10, quantity: 1.5 }] }],
        ['zero quantity', { customer_name: 'A', items: [{ name: 'X', price: 10, quantity: 0 }] }],
        ['negative discount', { customer_name: 'A', items, discount: -50 }],
    ])('rejects %s', async (_label, input) => {
        await expect(createManualBillHandler(input)).rejects.toBeDefined();
        expect(billHelper.addObject).not.toHaveBeenCalled();
    });
});
