export const PRODUCT_DATA = {
  create: {
    name: `AutoProduct_${Date.now()}`,
    // We'll update this dynamically in the test
  },

  update: {
    nameSuffix: '_Updated',
  },

  // Used to store created product name across tests
  runtime: {
    createdProductName: '',
  },
};

// Generate a unique product name with timestamp to avoid conflicts
export function generateProductName(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `TestProduct_${timestamp}`;
}
