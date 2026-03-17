export interface CardDetails {
    number: string;
    cvc: string;
    expiryMonth: string;
    expiryYear: string;
    holder: string;
}

export const TEST_CARD = {
    number: '4111111111111111',
    cvc: '123',
    expiryMonth: '12',
    expiryYear: '2030',
    holder: 'Test User'
};
