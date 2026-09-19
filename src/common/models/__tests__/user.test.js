import User from '../user';
import { CUSTOMER, MANAGER, STAFF } from '../../constants/enum';

describe('User.type', () => {
    it('defaults to customer', () => {
        const user = new User({ name: 'A', email: 'a@b.com', password: 'x' });
        expect(user.type).toBe(CUSTOMER);
    });

    it.each([CUSTOMER, MANAGER, STAFF])('accepts %s', (type) => {
        const user = new User({ name: 'A', email: 'a@b.com', password: 'x', type });
        expect(user.validateSync()).toBeUndefined();
    });

    it('rejects an unknown type', () => {
        const user = new User({ name: 'A', email: 'a@b.com', password: 'x', type: 'wizard' });
        expect(user.validateSync().errors.type).toBeDefined();
    });
});
