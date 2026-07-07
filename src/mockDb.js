const defaultVendors = [
  {
    id: 'v1',
    name: 'CJ 음료',
    cutoffTime: '15:00',
    contact: '010-1234-5678',
    notes: '탄산음료 및 생수',
  },
  {
    id: 'v2',
    name: '신선 식자재',
    cutoffTime: '16:00',
    contact: '010-9876-5432',
    notes: '채소 및 냉장 식재료',
  },
  {
    id: 'v3',
    name: '팩플러스',
    cutoffTime: '13:00',
    contact: '02-555-7777',
    notes: '일회용 컵, 뚜껑, 포장재',
  },
];

const defaultItems = [
  {
    id: 'i1',
    name: '코카콜라 355ml',
    sku: 'BEV-001',
    category: '음료',
    vendorId: 'v1',
    currentStock: 45,
    safetyStock: 30,
    leadTimeDays: 1,
    moq: 24,
    unit: '캔',
    recent7dSalesTotal: 140,
    active: true,
  },
  {
    id: 'i2',
    name: '스프라이트 355ml',
    sku: 'BEV-002',
    category: '음료',
    vendorId: 'v1',
    currentStock: 20,
    safetyStock: 24,
    leadTimeDays: 1,
    moq: 24,
    unit: '캔',
    recent7dSalesTotal: 105,
    active: true,
  },
  {
    id: 'i3',
    name: '냉동 삼겹살',
    sku: 'ING-001',
    category: '식자재',
    vendorId: 'v2',
    currentStock: 5,
    safetyStock: 10,
    leadTimeDays: 2,
    moq: 5,
    unit: 'kg',
    recent7dSalesTotal: 21,
    active: true,
  },
  {
    id: 'i4',
    name: '양파 1kg',
    sku: 'ING-002',
    category: '식자재',
    vendorId: 'v2',
    currentStock: 12,
    safetyStock: 5,
    leadTimeDays: 1,
    moq: 1,
    unit: '봉',
    recent7dSalesTotal: 14,
    active: true,
  },
  {
    id: 'i5',
    name: '종이컵 16oz',
    sku: 'DIS-001',
    category: '소모품',
    vendorId: 'v3',
    currentStock: 200,
    safetyStock: 500,
    leadTimeDays: 3,
    moq: 1000,
    unit: '개',
    recent7dSalesTotal: 1400,
    active: true,
  },
];

const emitMockDbUpdated = () => {
  window.dispatchEvent(new CustomEvent('mock-db-updated'));
};

const isCorruptedSeed = (entries) =>
  entries.some((entry) => String(entry.name || '').includes('?') || String(entry.category || '').includes('?'));

const normalizeVendors = (vendors) =>
  vendors.map((vendor) => {
    const defaultVendor = defaultVendors.find((entry) => entry.id === vendor.id);
    return defaultVendor ? { ...vendor, ...defaultVendor, contact: vendor.contact || defaultVendor.contact } : vendor;
  });

const normalizeItems = (items) =>
  items.map((item) => {
    const defaultItem = defaultItems.find((entry) => entry.id === item.id);
    return defaultItem
      ? {
          ...item,
          name: defaultItem.name,
          category: defaultItem.category,
          unit: defaultItem.unit,
        }
      : item;
  });

export const initMockDb = () => {
  const savedVendors = JSON.parse(localStorage.getItem('vendors') || 'null');
  const savedItems = JSON.parse(localStorage.getItem('items') || 'null');

  if (!savedVendors || !Array.isArray(savedVendors) || isCorruptedSeed(savedVendors)) {
    localStorage.setItem('vendors', JSON.stringify(defaultVendors));
  } else {
    localStorage.setItem('vendors', JSON.stringify(normalizeVendors(savedVendors)));
  }

  if (!savedItems || !Array.isArray(savedItems) || isCorruptedSeed(savedItems)) {
    localStorage.setItem('items', JSON.stringify(defaultItems));
  } else {
    localStorage.setItem('items', JSON.stringify(normalizeItems(savedItems)));
  }
};

export const getItems = () => JSON.parse(localStorage.getItem('items') || '[]');
export const getVendors = () => JSON.parse(localStorage.getItem('vendors') || '[]');

export const saveItems = (items) => {
  localStorage.setItem('items', JSON.stringify(items));
  emitMockDbUpdated();
};

export const saveVendors = (vendors) => {
  localStorage.setItem('vendors', JSON.stringify(vendors));
  emitMockDbUpdated();
};
