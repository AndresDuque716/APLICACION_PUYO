export const THEME = {
  colors: {
    background: '#080808',
    card: '#111111',
    inputBg: '#161616',
    border: '#1C1C1E',
    borderDark: '#222222',
    primary: '#00d26a',
    primaryDark: '#00A859',
    success: '#22B15B',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#0A84FF',
    textWhite: '#FFFFFF',
    textGray: '#8E8E93',
    textLightGray: '#aaaaaa',
    textMuted: '#48484A',
    overlay: 'rgba(0, 0, 0, 0.6)'
  }
};

export const STORAGE_KEYS = {
  PRODUCTS: '@vendix_products',
  SALES_HISTORY: '@vendix_sales_history',
  CART: '@vendix_cart',
  LOGGED_USER: '@vendix_logged_user',
  CATEGORIES: '@vendix_categories'
};

export const INITIAL_PRODUCTS = [
  {
    id: "PROD-001",
    name: "Coca Cola 500 ml",
    category: "Bebidas",
    price: 4.0,
    stock: 45,
    barcode: "7750101001234",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop",
    avatar: "🥤"
  },
  {
    id: "PROD-002",
    name: "Inca Kola 500 ml",
    category: "Bebidas",
    price: 4.5,
    stock: 12,
    barcode: "7750101005676",
    image: "https://images.unsplash.com/photo-1543257580-7269da773bf5?q=80&w=600&auto=format&fit=crop",
    avatar: "🥤"
  },
  {
    id: "PROD-003",
    name: "Papas Lays Clásicas 25 g",
    category: "Snacks",
    price: 2.5,
    stock: 5,
    barcode: "7750202003412",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop",
    avatar: "🥔"
  },
  {
    id: "PROD-004",
    name: "Chocolate Sublime Extra",
    category: "Golosinas",
    price: 3.0,
    stock: 28,
    barcode: "7750303009811",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=600&auto=format&fit=crop",
    avatar: "🍫"
  },
  {
    id: "PROD-005",
    name: "Arroz Costeño Extra 1 kg",
    category: "Abarrotes",
    price: 4.8,
    stock: 0,
    barcode: "7750404001122",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop",
    avatar: "🍚"
  },
  {
    id: "PROD-006",
    name: "Leche Gloria Azul Evaporada",
    category: "Lácteos",
    price: 4.2,
    stock: 19,
    barcode: "7750505007744",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop",
    avatar: "🥛"
  },
  {
    id: "PROD-007",
    name: "Agua San Mateo Sin Gas 600 ml",
    category: "Bebidas",
    price: 2.0,
    stock: 50,
    barcode: "7750101009988",
    image: "https://images.unsplash.com/photo-1608885898957-a599fb1b4641?q=80&w=600&auto=format&fit=crop",
    avatar: "💧"
  },
  {
    id: "PROD-008",
    name: "Galletas Casino Chocolate",
    category: "Golosinas",
    price: 1.2,
    stock: 60,
    barcode: "7750303001155",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&auto=format&fit=crop",
    avatar: "🍪"
  }
];

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

export const INITIAL_SALES = [
  { id: 'VEN-9082', time: 'Hace 10 min', total: 24.50, items: 3, method: 'Efectivo', client: 'Franks D.', timestamp: now },
  { id: 'VEN-9081', time: 'Hace 32 min', total: 15.00, items: 2, method: 'Yape', client: 'General', timestamp: now },
  { id: 'VEN-9080', time: 'Hace 1 hora', total: 8.50, items: 1, method: 'Plin', client: 'General', timestamp: now - 0.2 * oneDay },
  { id: 'VEN-9079', time: 'Hace 2 horas', total: 42.00, items: 5, method: 'Tarjeta', client: 'Maria R.', timestamp: now - 1 * oneDay },
  { id: 'VEN-9078', time: 'Hace 3 horas', total: 11.50, items: 1, method: 'Efectivo', client: 'General', timestamp: now - 2 * oneDay }
];
