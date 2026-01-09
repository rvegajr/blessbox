/**
 * Square Web Payments SDK Mock
 * 
 * Purpose: Replace Square's iframe with controllable inputs for E2E testing
 * 
 * Usage in Playwright:
 *   await page.addInitScript({ path: 'tests/mocks/square-sdk-mock.js' });
 * 
 * This mock allows full automation of the payment form by replacing
 * Square's cross-origin iframe with regular HTML inputs.
 */

// Mock Square SDK
window.Square = {
  payments: (applicationId, locationId) => {
    console.log('[MOCK] Square.payments initialized', { applicationId, locationId });
    
    return {
      card: async (options = {}) => {
        console.log('[MOCK] Card instance created', options);
        
        let container = null;
        let isDestroyed = false;
        
        return {
          /**
           * Attach card form to container
           * Replaces Square iframe with mock HTML inputs
           */
          attach: async (selector) => {
            if (isDestroyed) {
              throw new Error('Card instance has been destroyed');
            }
            
            console.log('[MOCK] Attaching card to', selector);
            container = document.querySelector(selector);
            
            if (!container) {
              throw new Error(`Container ${selector} not found`);
            }
            
            // Clear existing content
            container.innerHTML = '';
            
            // Create mock card form (styled to match Square)
            container.innerHTML = `
              <div data-testid="mock-square-form" style="
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 12px;
                padding: 16px;
                background: white;
                border: 1px solid #E0E0E0;
                border-radius: 8px;
              ">
                <div style="grid-column: 1 / -1;">
                  <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">
                    Card Number
                  </label>
                  <input 
                    data-testid="mock-card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    style="
                      width: 100%;
                      padding: 10px;
                      border: 1px solid #E0E0E0;
                      border-radius: 4px;
                      font-size: 14px;
                    "
                  />
                </div>
                
                <div>
                  <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">
                    Expiry (MM/YY)
                  </label>
                  <input 
                    data-testid="mock-card-expiry"
                    type="text"
                    placeholder="12/25"
                    maxlength="5"
                    style="
                      width: 100%;
                      padding: 10px;
                      border: 1px solid #E0E0E0;
                      border-radius: 4px;
                      font-size: 14px;
                    "
                  />
                </div>
                
                <div>
                  <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">
                    CVV
                  </label>
                  <input 
                    data-testid="mock-card-cvv"
                    type="text"
                    placeholder="123"
                    maxlength="4"
                    style="
                      width: 100%;
                      padding: 10px;
                      border: 1px solid #E0E0E0;
                      border-radius: 4px;
                      font-size: 14px;
                    "
                  />
                </div>
                
                <div style="grid-column: 1 / -1;">
                  <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">
                    ZIP Code
                  </label>
                  <input 
                    data-testid="mock-card-postal"
                    type="text"
                    placeholder="12345"
                    maxlength="10"
                    style="
                      width: 100%;
                      padding: 10px;
                      border: 1px solid #E0E0E0;
                      border-radius: 4px;
                      font-size: 14px;
                    "
                  />
                </div>
              </div>
            `;
            
            console.log('[MOCK] Card form attached successfully');
          },
          
          /**
           * Tokenize card data
           * Reads values from mock inputs and returns test token
           */
          tokenize: async () => {
            if (isDestroyed) {
              return {
                status: 'ERROR',
                errors: [{ message: 'Card instance has been destroyed' }],
              };
            }
            
            if (!container) {
              return {
                status: 'ERROR',
                errors: [{ message: 'Card not attached to container' }],
              };
            }
            
            // Read values from mock inputs
            const cardNumber = container.querySelector('[data-testid="mock-card-number"]')?.value || '';
            const expiry = container.querySelector('[data-testid="mock-card-expiry"]')?.value || '';
            const cvv = container.querySelector('[data-testid="mock-card-cvv"]')?.value || '';
            const postal = container.querySelector('[data-testid="mock-card-postal"]')?.value || '';
            
            console.log('[MOCK] Tokenizing card', {
              cardNumber: cardNumber.replace(/\d/g, '*'),
              expiry,
              cvv: '***',
              postal,
            });
            
            // Validate inputs
            const errors = [];
            
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
              errors.push({ field: 'cardNumber', message: 'Invalid card number' });
            }
            
            if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
              errors.push({ field: 'expirationDate', message: 'Invalid expiration date' });
            }
            
            if (!cvv || cvv.length < 3) {
              errors.push({ field: 'cvv', message: 'Invalid CVV' });
            }
            
            if (!postal || postal.length < 5) {
              errors.push({ field: 'postalCode', message: 'Invalid postal code' });
            }
            
            if (errors.length > 0) {
              console.log('[MOCK] Tokenization failed - validation errors', errors);
              return {
                status: 'INVALID',
                errors,
              };
            }
            
            // Simulate different test scenarios based on card number
            const cleanCardNumber = cardNumber.replace(/\s/g, '');
            
            // Test card scenarios
            if (cleanCardNumber === '4111111111111111') {
              // Successful tokenization
              const token = `cnon:mock-token-${Date.now()}`;
              console.log('[MOCK] Tokenization successful', { token });
              return {
                status: 'OK',
                token,
              };
            } else if (cleanCardNumber.startsWith('5')) {
              // Declined card (Mastercard starting with 5)
              console.log('[MOCK] Tokenization failed - card declined');
              return {
                status: 'ERROR',
                errors: [{ code: 'CARD_DECLINED', message: 'Card was declined' }],
              };
            } else if (cleanCardNumber.startsWith('2')) {
              // CVV error
              console.log('[MOCK] Tokenization failed - CVV error');
              return {
                status: 'ERROR',
                errors: [{ code: 'CVV_FAILURE', message: 'CVV verification failed' }],
              };
            } else {
              // Default success for any other card
              const token = `cnon:mock-token-${Date.now()}`;
              console.log('[MOCK] Tokenization successful (default)', { token });
              return {
                status: 'OK',
                token,
              };
            }
          },
          
          /**
           * Destroy card instance
           */
          destroy: async () => {
            console.log('[MOCK] Destroying card instance');
            isDestroyed = true;
            if (container) {
              container.innerHTML = '';
              container = null;
            }
          },
        };
      },
    };
  },
};

console.log('[MOCK] Square SDK mock loaded successfully');

