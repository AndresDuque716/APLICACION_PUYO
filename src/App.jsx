import { useState, useEffect } from 'react';
import logoImg from './assets/logo.png';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Check,
  Home as HomeIcon,
  Package,
  Plus,
  ShoppingCart,
  Menu,
  ShoppingBag,
  Trash2,
  Camera,
  ChevronRight,
  Bell,
  MoreHorizontal,
  X,
  Receipt,
  Search
} from 'lucide-react';

// Pre-defined products database for scanning simulation
const SCAN_PRODUCTS = [
  { name: 'Galletas Oreo', price: 2.50, avatar: '🍪' },
  { name: 'Chocolate Sublime', price: 3.00, avatar: '🍫' },
  { name: 'Gaseosa Sprite', price: 3.50, avatar: '🥤' },
  { name: 'Agua San Luis', price: 2.00, avatar: '💧' },
  { name: 'Papas Nativas Lays', price: 5.00, avatar: '🥔' },
  { name: 'Sublime Extremo', price: 4.50, avatar: '🍫' }
];

function App() {
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [error, setError] = useState('');

  // App / POS States
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio', 'productos', 'nueva-venta', 'ventas', 'mas'
  const [flashActive, setFlashActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [cart, setCart] = useState([
    { id: 1, name: 'Inca Kola 500ml', price: 3.50, qty: 2, avatar: '🥤' },
    { id: 2, name: 'Coca Cola 500ml', price: 3.50, qty: 1, avatar: '🥤' },
    { id: 3, name: 'Papas Lays Clásicas', price: 4.50, qty: 1, avatar: '🥔' }
  ]);

  useEffect(() => {
    // Catch unhandled promise rejections globally to prevent console crashes
    const handleRejection = (event) => {
      console.warn(`Captured unhandled promise rejection: ${event.reason}`);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', handleRejection);

    // Resize listener
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Simulated Locize backend loading log for translations
    console.log('[i18next] Initializing Locize backend...');
    const loadTranslations = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ es: { welcome: "Bienvenido" } });
      }, 300);
    });

    loadTranslations
      .then(() => {
        console.log('[i18next] Translations loaded successfully for language: es from Locize.');
      })
      .catch((error) => {
        console.error('[i18next] Error loading translations:', error);
      });

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handlers for Login
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (email.trim() !== 'duque@gmail.com' || password !== '12345678') {
      setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoggedInUser(email);
      setLoginSuccess(true);
      setActiveTab('inicio');
    }, 1800);
  };

  const handleGuestLogin = () => {
    setIsLoadingGuest(true);
    setTimeout(() => {
      setIsLoadingGuest(false);
      setLoggedInUser('Invitado_Vendix');
      setLoginSuccess(true);
      setActiveTab('inicio');
    }, 1200);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setError('');
    setLoginSuccess(false);
    setLoggedInUser('');
    setSidebarOpen(false);
  };

  // Handlers for Cart / POS
  const updateQty = (id, delta) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty < 1 ? 1 : newQty };
        }
        return item;
      })
    );
  };

  const deleteItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Simulated scan beep & product generation
  const handleScan = () => {
    // 1. Play synth beep using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // volume

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Beep duration 120ms
    } catch (e) {
      console.log('Audio API not allowed or supported yet:', e);
    }

    // 2. Trigger scanner laser flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 300);

    // 3. Add random product to cart
    const randProd = SCAN_PRODUCTS[Math.floor(Math.random() * SCAN_PRODUCTS.length)];
    setCart(prevCart => {
      const existing = prevCart.find(item => item.name === randProd.name);
      if (existing) {
        return prevCart.map(item => 
          item.name === randProd.name ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevCart, {
          id: Date.now(),
          name: randProd.name,
          price: randProd.price,
          qty: 1,
          avatar: randProd.avatar
        }];
      }
    });
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > 10 ? 1.50 : 0.00; // S/ 1.50 discount if subtotal exceeds S/ 10
  const total = subtotal - discount;

  // Render variables
  const isDashboardTab = activeTab === 'inicio';
  const isProductsTab = activeTab === 'productos';
  const isSalesTab = activeTab === 'ventas';
  const isNewSaleTab = activeTab === 'nueva-venta';

  return (
    <>
      {/* Background glow orbs */}
      <div className="bg-glow-container">
        <div className="bg-glow-orb-1"></div>
        <div className="bg-glow-orb-2"></div>
      </div>

      {/* 1. SIDEBAR DRAWER & OVERLAY */}
      {loginSuccess && (
        <>
          <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
          <div className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-profile">
                <div className="profile-icon">🏪</div>
                <div>
                  <h4>Vendix Pucallpa</h4>
                  <p>Sucursal Principal</p>
                </div>
              </div>
              <button className="btn-close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>
            <div className="sidebar-content">
              <div className="sidebar-menu-group">
                <span>Mi Negocio</span>
                <a href="#sucursales" className="sidebar-link active" onClick={(e) => { e.preventDefault(); setSidebarOpen(false); }}>
                  <span>Sucursal Pucallpa</span>
                  <ChevronRight size={14} />
                </a>
                <a href="#settings" className="sidebar-link" onClick={(e) => { e.preventDefault(); setSidebarOpen(false); alert('Configuraciones abiertas.'); }}>
                  <span>Configuraciones</span>
                  <ChevronRight size={14} />
                </a>
              </div>
              <div className="sidebar-menu-group">
                <span>Sesión</span>
                <span className="sidebar-user-info">{loggedInUser}</span>
                <button className="btn-secondary sidebar-logout-btn" onClick={handleReset}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. APP HEADER (Sticky Top) */}
      {loginSuccess && (
        <header className="app-header">
          <button className="menu-hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            <Menu size={24} />
          </button>
          <div className="brand-logo">
            <img src={logoImg} alt="Vendix Logo" />
            <span>Vendix</span>
          </div>
          <button className="notification-btn" onClick={() => alert('No tienes notificaciones pendientes.')} aria-label="Ver notificaciones">
            <Bell size={22} />
          </button>
        </header>
      )}

      <div className={`container ${loginSuccess ? 'dashboard-mode' : ''}`}>
        {!loginSuccess ? (
          <>
            {/* Brand Section (Left) */}
            <section className="brand-section">
                <div className="logo-wrapper">
                    <img src={logoImg} alt="Vendix Logo" className="logo-img" />
                    <h1 className="brand-name">Vendix</h1>
                </div>
                <p className="slogan">Controla. Vende. Crece.</p>
                <p className="brand-desc">
                    El sistema inteligente de gestión de ventas y control de inventarios diseñado para potenciar tu negocio. Simplifica tus operaciones diarias, escanea con códigos QR y mantén el control total desde cualquier dispositivo.
                </p>

                <div className="feature-list">
                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <TrendingUp size={20} />
                        </div>
                        <div className="feature-text">
                            <h3>Control de Ventas Rápido</h3>
                            <p>Factura en segundos y realiza un seguimiento automático de tus ingresos diarios.</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <Calendar size={20} />
                        </div>
                        <div className="feature-text">
                            <h3>Gestión de Inventario</h3>
                            <p>Controla existencias, entradas y salidas en tiempo real con soporte para códigos QR.</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <AlertCircle size={20} />
                        </div>
                        <div className="feature-text">
                            <h3>Alertas Inteligentes</h3>
                            <p>Recibe notificaciones automáticas cuando tus productos alcancen el stock mínimo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Login Card (Right) */}
            <main className="login-card">
              <div id="cardContent">
                <header className="card-header">
                  <h2>Bienvenido</h2>
                  <p>Ingresa tus credenciales para acceder a Vendix.</p>
                </header>

                {error && (
                  <div className="error-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Email / Username Input */}
                  <div className="form-group">
                    <div className="input-container">
                      <span className="input-icon">
                        <User size={18} />
                      </span>
                      <div className="input-field-wrapper">
                        <span className="input-label">USUARIO / CORREO</span>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="ejemplo@vendix.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading || isLoadingGuest}
                          required 
                          autoComplete="username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-group">
                    <div className="input-container">
                      <span className="input-icon">
                        <Lock size={18} />
                      </span>
                      <div className="input-field-wrapper">
                        <span className="input-label">CONTRASEÑA</span>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="input-field" 
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading || isLoadingGuest}
                          required 
                          autoComplete="current-password"
                        />
                      </div>
                      <button 
                        type="button" 
                        className="btn-toggle-password" 
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Mostrar u ocultar contraseña"
                        disabled={isLoading || isLoadingGuest}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="form-options">
                    <label className="remember-me">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading || isLoadingGuest}
                      />
                      <span>Recordarme</span>
                    </label>
                    <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button 
                      type="submit" 
                      className={`btn-primary ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading || isLoadingGuest}
                    >
                      {!isLoading ? (
                        <>
                          <span className="btn-text">Iniciar Sesión</span>
                          <ArrowRight size={16} />
                        </>
                      ) : (
                        <span className="spinner"></span>
                      )}
                    </button>

                    <div className="divider">o continúa con</div>

                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={handleGuestLogin}
                      disabled={isLoading || isLoadingGuest}
                    >
                      {isLoadingGuest ? (
                        <span className="spinner" style={{ borderTopColor: 'var(--color-text-main)' }}></span>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="motion-user-icon">
                            <line x1="2" y1="8" x2="6" y2="8" />
                            <line x1="2" y1="12" x2="8" y2="12" />
                            <line x1="2" y1="16" x2="5" y2="16" />
                            <path d="M19 21v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2" />
                            <circle cx="14" cy="7" r="4" />
                          </svg>
                          <span>Modo Invitado</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <footer className="card-footer">
                  ¿No tienes cuenta? <a href="#">Registra tu negocio aquí</a>
                </footer>
              </div>
            </main>
          </>
        ) : (
          /* ====================================================
             Logged In: Vendix Application Dashboard & Sales Views
             ==================================================== */
          <>
            {/* 1. LEFT SIDE PANEL (Dashboard, Products Catalog, or Sales History) */}
            {(isDashboardTab || (isNewSaleTab && windowWidth > 900)) && (
              <div className="dashboard-view">
                <div className="section-title-bar">
                  <h2>Dashboard Principal</h2>
                </div>

                {/* KPIs metric grid */}
                <div className="metric-grid">
                  <div className="metric-card">
                    <span>Ventas de Hoy</span>
                    <div className="metric-val">S/ 1,240.00</div>
                    <div className="metric-change">
                      <span>+12.5%</span>
                      <TrendingUp size={12} style={{ color: '#22B15B' }} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <span>Transacciones</span>
                    <div className="metric-val">84</div>
                    <div className="metric-change">
                      <span>+8.3%</span>
                      <TrendingUp size={12} style={{ color: '#22B15B' }} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <span>Ticket Promedio</span>
                    <div className="metric-val">S/ 14.80</div>
                    <div className="metric-change" style={{ color: '#8E8E93' }}>
                      <span>Estable</span>
                    </div>
                  </div>
                </div>

                {/* Motivation gamification banner */}
                <div className="gamification-banner" onClick={handleScan}>
                  <div className="banner-left">
                    <div className="banner-icon-box">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="banner-text">
                      <h3>¡Felicidades! Superaste tu meta</h3>
                      <p>Sigue vendiendo para alcanzar el logro diario.</p>
                    </div>
                  </div>
                  <div className="banner-arrow">
                    <ArrowRight size={20} />
                  </div>
                </div>

                {/* Sales Chart Card */}
                <div className="sales-chart-card">
                  <div className="chart-header">
                    <h3>Tendencia de Ventas</h3>
                    <button className="chart-pill">Esta semana</button>
                  </div>
                  <div className="chart-area">
                    <div className="chart-y-axis">
                      <span>1.5K</span>
                      <span>1.0K</span>
                      <span>500</span>
                      <span>0</span>
                    </div>
                    <div className="chart-svg-container">
                      <div className="chart-grid-line" style={{ top: '0%' }}></div>
                      <div className="chart-grid-line" style={{ top: '33.3%' }}></div>
                      <div className="chart-grid-line" style={{ top: '66.6%' }}></div>
                      <div className="chart-grid-line" style={{ top: '100%', borderTopStyle: 'solid' }}></div>
                      
                      <svg className="chart-svg">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00A859" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#00A859" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area shading under trendline */}
                        <path d="M 0 100 L 0 80 Q 40 70 80 65 Q 120 60 160 75 Q 200 90 240 45 Q 280 10 320 20 Q 360 30 400 10 L 400 100 Z" className="chart-area-fill" />
                        {/* Trendline */}
                        <path d="M 0 80 Q 40 70 80 65 Q 120 60 160 75 Q 200 90 240 45 Q 280 10 320 20 Q 360 30 400 10" className="chart-line" />
                        {/* Interactive Nodes */}
                        <circle cx="0" cy="80" r="4.5" className="chart-node" />
                        <circle cx="80" cy="65" r="4.5" className="chart-node" />
                        <circle cx="160" cy="75" r="4.5" className="chart-node" />
                        <circle cx="240" cy="45" r="4.5" className="chart-node" />
                        <circle cx="320" cy="20" r="4.5" className="chart-node" />
                        <circle cx="400" cy="10" r="4.5" className="chart-node" />
                      </svg>
                    </div>
                  </div>
                  <div className="chart-x-axis">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>
                </div>

                {/* Quick info alerts section */}
                <div className="quick-info-grid">
                  <div className="alert-card warning">
                    <div className="alert-icon-box">
                      <AlertCircle size={16} />
                    </div>
                    <h4>Stock Bajo</h4>
                    <span className="alert-num">5</span>
                  </div>

                  <div className="alert-card danger">
                    <div className="alert-icon-box">
                      <AlertCircle size={16} />
                    </div>
                    <h4>Agotados</h4>
                    <span className="alert-num">2</span>
                  </div>

                  <div className="alert-card info">
                    <div className="alert-icon-box">
                      <User size={16} />
                    </div>
                    <h4>Cajas</h4>
                    <span className="alert-num">2</span>
                  </div>

                  <div className="alert-card success">
                    <div className="alert-icon-box">
                      <Check size={16} />
                    </div>
                    <h4>Clientes</h4>
                    <span className="alert-num">48</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS CATALOG VIEW */}
            {isProductsTab && (
              <div className="products-view">
                <div className="section-title-bar">
                  <h2>Catálogo de Productos</h2>
                  <button className="chart-pill" onClick={() => alert('Función para agregar producto disponible próximamente.')}>+ Nuevo Producto</button>
                </div>

                {/* Search Bar */}
                <div className="search-bar-container">
                  <span className="search-icon"><Search size={18} /></span>
                  <input type="text" placeholder="Buscar producto por nombre, categoría o código..." className="search-input" readOnly />
                </div>

                {/* Products Grid */}
                <div className="products-grid-list">
                  {[
                    { name: 'Inca Kola 500ml', price: 3.50, stock: 24, avatar: '🥤', category: 'Bebidas', status: 'In stock' },
                    { name: 'Coca Cola 500ml', price: 3.50, stock: 18, avatar: '🥤', category: 'Bebidas', status: 'In stock' },
                    { name: 'Papas Lays Clásicas', price: 4.50, stock: 5, avatar: '🥔', category: 'Snacks', status: 'Low stock' },
                    { name: 'Chocolate Sublime', price: 3.00, stock: 0, avatar: '🍫', category: 'Golosinas', status: 'Out of stock' },
                    { name: 'Galletas Oreo', price: 2.50, stock: 15, avatar: '🍪', category: 'Golosinas', status: 'In stock' },
                    { name: 'Agua San Luis 500ml', price: 2.00, stock: 32, avatar: '💧', category: 'Bebidas', status: 'In stock' }
                  ].map((p, index) => (
                    <div key={index} className="product-catalog-card">
                      <div className="prod-cat-header">
                        <span className="prod-cat-avatar">{p.avatar}</span>
                        <span className={`prod-cat-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
                          {p.status === 'In stock' ? 'Disponible' : p.status === 'Low stock' ? 'Bajo Stock' : 'Agotado'}
                        </span>
                      </div>
                      <div className="prod-cat-body">
                        <h3>{p.name}</h3>
                        <p className="prod-cat-category">{p.category}</p>
                        <div className="prod-cat-info">
                          <span className="prod-cat-price">S/ {p.price.toFixed(2)}</span>
                          <span className="prod-cat-stock">Stock: {p.stock} u.</span>
                        </div>
                      </div>
                      <div className="prod-cat-footer">
                        <button className="btn-primary btn-small" onClick={() => {
                          setCart(prevCart => {
                            const existing = prevCart.find(item => item.name === p.name);
                            if (existing) {
                              return prevCart.map(item => 
                                item.name === p.name ? { ...item, qty: item.qty + 1 } : item
                              );
                            } else {
                              return [...prevCart, {
                                id: Date.now() + index,
                                name: p.name,
                                price: p.price,
                                qty: 1,
                                avatar: p.avatar
                              }];
                            }
                          });
                          // Play simulated beep
                          try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const oscillator = audioCtx.createOscillator();
                            const gainNode = audioCtx.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioCtx.destination);
                            oscillator.type = 'sine';
                            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
                            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                            oscillator.start();
                            oscillator.stop(audioCtx.currentTime + 0.1);
                          } catch (e) {}
                        }}>+ Agregar</button>
                        <button className="btn-edit-product" onClick={() => alert(`Editando ${p.name}`)}>
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SALES HISTORY VIEW */}
            {isSalesTab && (
              <div className="sales-history-view">
                <div className="section-title-bar">
                  <h2>Historial de Ventas</h2>
                  <button className="chart-pill">Hoy</button>
                </div>

                {/* Sales Summary Banner */}
                <div className="sales-summary-banner">
                  <div className="sales-summary-info">
                    <span>Total Facturado Hoy</span>
                    <h3>S/ 1,240.00</h3>
                  </div>
                  <div className="sales-summary-meta">
                    <span>84 Transacciones</span>
                    <span>Ticket Promedio: S/ 14.80</span>
                  </div>
                </div>

                {/* Recent Sales List */}
                <div className="sales-history-list">
                  {[
                    { id: 'VEN-9082', time: 'Hace 10 min', total: 24.50, items: 3, method: 'Efectivo', client: 'Franks D.' },
                    { id: 'VEN-9081', time: 'Hace 32 min', total: 15.00, items: 2, method: 'Yape', client: 'General' },
                    { id: 'VEN-9080', time: 'Hace 1 hora', total: 8.50, items: 1, method: 'Plin', client: 'General' },
                    { id: 'VEN-9079', time: 'Hace 2 horas', total: 42.00, items: 5, method: 'Tarjeta', client: 'Maria R.' },
                    { id: 'VEN-9078', time: 'Hace 3 horas', total: 11.50, items: 1, method: 'Efectivo', client: 'General' },
                    { id: 'VEN-9077', time: 'Hace 4 horas', total: 35.00, items: 4, method: 'Yape', client: 'Jose M.' },
                    { id: 'VEN-9076', time: 'Hace 5 horas', total: 18.00, items: 2, method: 'Efectivo', client: 'General' }
                  ].map((sale) => (
                    <div key={sale.id} className="sale-history-item">
                      <div className="sale-history-left">
                        <div className="sale-history-icon">
                          <Receipt size={18} />
                        </div>
                        <div className="sale-history-details">
                          <h4>Venta {sale.id}</h4>
                          <p>{sale.time} • Cliente: {sale.client}</p>
                        </div>
                      </div>
                      <div className="sale-history-right">
                        <span className="sale-history-amount">S/ {sale.total.toFixed(2)}</span>
                        <div className="sale-history-tags">
                          <span className="sale-tag-items">{sale.items} items</span>
                          <span className={`sale-tag-method ${sale.method.toLowerCase()}`}>{sale.method}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. RIGHT SIDE PANEL (POS/New Sale) */}
            {(isNewSaleTab || windowWidth > 900) && (
              <div className={`pos-view ${isNewSaleTab ? '' : 'desktop-only'}`}>
                <div className="section-title-bar">
                  <h2>Módulo de Nueva Venta</h2>
                </div>

                {/* Product Scanner (Top Box) */}
                <div className="scanner-box" onClick={handleScan}>
                  <div className="scanner-laser"></div>
                  <div className={`flash-effect ${flashActive ? 'active' : ''}`}></div>
                  <div className="scanner-icon-box">
                    <Camera size={24} />
                  </div>
                  <div className="scanner-text">
                    <h3>Escanear Código de Barras / QR</h3>
                    <p>Haz clic para simular el escaneo de un producto con la cámara.</p>
                  </div>
                </div>

                {/* Cart Added Products List */}
                <div className="cart-list">
                  {cart.length > 0 ? (
                    cart.map(item => (
                      <div key={item.id} className="product-item">
                        <div className="prod-info-block">
                          <div className="prod-avatar">{item.avatar}</div>
                          <div className="prod-details">
                            <h4>{item.name}</h4>
                            <p>Precio Unitario: S/ {item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="prod-action-block">
                          <div className="quantity-selector">
                            <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                            <span className="qty-num">{item.qty}</span>
                            <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                          </div>
                          <div className="prod-price-block">
                            <span className="prod-price">S/ {(item.price * item.qty).toFixed(2)}</span>
                          </div>
                          <button className="btn-delete" onClick={() => deleteItem(item.id)} aria-label="Eliminar producto">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-sec)', fontSize: '13px' }}>
                      El carrito está vacío. Escanea productos para comenzar.
                    </div>
                  )}
                </div>

                {/* Billing Summary Box */}
                <div className="totals-box">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row discount">
                    <span>Descuento</span>
                    <span>- S/ {discount.toFixed(2)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>TOTAL</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>

                  <button className="btn-primary" style={{ marginTop: '8px' }} onClick={() => alert('Venta continuada con éxito por un total de S/ ' + total.toFixed(2))}>
                    <span>Continuar venta</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* 5. COMMON BOTTOM NAVIGATION BAR */}
            <nav className="bottom-nav">
              <button 
                className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
                onClick={() => setActiveTab('inicio')}
              >
                <HomeIcon size={20} />
                <span>Inicio</span>
              </button>

              <button 
                className={`nav-item ${activeTab === 'productos' ? 'active' : ''}`}
                onClick={() => setActiveTab('productos')}
              >
                <Package size={20} />
                <span>Productos</span>
              </button>

              {/* Botón Central de Nueva Venta */}
              <button 
                className="btn-floating-action"
                onClick={() => {
                  setActiveTab('nueva-venta');
                }}
                aria-label="Nueva Venta"
              >
                <Plus size={28} />
              </button>

              <button 
                className={`nav-item ${activeTab === 'ventas' ? 'active' : ''}`}
                onClick={() => setActiveTab('ventas')}
              >
                <Receipt size={20} />
                <span>Ventas</span>
              </button>

              {/* Los 3 puntos abajo a la derecha ahora activan el escáner */}
              <button className="nav-item key-action-scanner" onClick={handleScan} aria-label="Escanear producto rápido">
                <MoreHorizontal size={20} />
                <span>Escanear</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  );
}

export default App;
