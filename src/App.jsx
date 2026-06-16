import React, { useState, useEffect } from 'react';
import logoImg from './assets/logo.png';
import { FacebookLogin } from '@capacitor-community/facebook-login';
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
  ChevronLeft,
  Bell,
  Scan,
  X,
  Receipt,
  Search,
  Minus,
  SlidersHorizontal
} from 'lucide-react';

// Pre-defined products database for scanning simulation & catalog
const PRODUCT_DATABASE = [
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

// ==========================================
// 1. COMPONENTE: LOGIN (Pantalla de Acceso)
// ==========================================
const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";

function LoginScreen({ onLoginSuccess, email, setEmail, password, setPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1000);
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.brandHeader}>
        <div style={styles.logoWrapper}>
          <img src={logoImg} alt="Vendix Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          <h1 style={styles.logoText}>Vendix</h1>
        </div>
        <p style={styles.slogan}>Controla. Vende. Crece.</p>
      </div>

      <div style={styles.loginCard}>
        <h2 style={styles.cardTitle}>Bienvenido</h2>
        <p style={styles.cardSubtitle}>Ingresa tus credenciales para acceder a Vendix.</p>
        
        <form onSubmit={handleFormSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>USUARIO / CORREO</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: '#8E8E93', display: 'flex', alignItems: 'center' }}><User size={18} /></span>
              <input 
                type="text" 
                placeholder="ejemplo@vendix.com" 
                style={{ ...styles.inputField, paddingLeft: '42px' }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>CONTRASEÑA</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', color: '#8E8E93', display: 'flex', alignItems: 'center' }}><Lock size={18} /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                style={{ ...styles.inputField, paddingLeft: '42px', paddingRight: '42px' }} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={styles.rowUtilities}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" defaultChecked style={styles.checkbox} /> Recordarme
            </label>
            <span style={styles.linkText} onClick={() => alert('Recuperación de contraseña en desarrollo.')}>¿Olvidaste tu contraseña?</span>
          </div>

          <button type="submit" style={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>o continúa con</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.socialButtonsRow}>
          <button style={styles.btnGoogle} onClick={() => {
            setEmail('google.user@vendix.com');
            alert('Vinculando con Google...');
            setTimeout(() => onLoginSuccess(), 800);
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.37 3.66 1.43 7.56l3.87 3A7 7 0 0 1 12 5.04z" />
              <path fill="#4285F4" d="M23.73 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.6c-.29 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.41-4.94 3.41-8.58z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.06-2.21-7.05-5.19l-3.87 3C5.07 19.86 8.24 23 12 23z" />
              <path fill="#FBBC05" d="M4.95 13.12A7 7 0 0 1 4.95 10.88L1.08 7.88a11.96 11.96 0 0 0 0 8.24l3.87-3z" />
            </svg>
            Google
          </button>
          <button style={styles.btnFacebook} onClick={async () => {
            try {
              let appId = FACEBOOK_APP_ID;
              if (appId === "YOUR_FACEBOOK_APP_ID") {
                window.open("https://www.facebook.com", "_blank");
                return;
              }
              
              // Inicializar SDK de Facebook
              await FacebookLogin.initialize({ appId });
              
              // Intentar login
              const permissions = ['public_profile', 'email'];
              const result = await FacebookLogin.login({ permissions });
              
              if (result && result.accessToken) {
                console.log('Facebook Login exitoso:', result.accessToken);
                setEmail('facebook.user@vendix.com');
                alert('¡Vinculación con Facebook exitosa!');
                onLoginSuccess();
              } else {
                alert('No se pudo obtener el token de acceso de Facebook.');
              }
            } catch (err) {
              console.error(err);
              window.open("https://www.facebook.com", "_blank");
            }
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2" style={{ marginRight: '8px' }}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <button style={styles.btnSecondary} onClick={() => {
          setEmail('invitado@vendix.com');
          onLoginSuccess();
        }}>
           Modo Invitado
        </button>

        <p style={styles.registerText}>
          ¿No tienes cuenta? <span style={styles.linkTextHighlight} onClick={() => alert('Registro disponible pronto.')}>Registra tu negocio aquí</span>
        </p>
      </div>
      
      <div style={styles.securityFooter}>
         <Check size={14} style={{ color: '#00A859', marginRight: '4px' }} /> Tu información está segura con nosotros
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPONENTE: DASHBOARD (Vista de Inicio)
// ==========================================
function DashboardScreen({ onMetaClick }) {
  const containerRef = React.useRef(null);
  const [overscrollY, setOverscrollY] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  const touchLastY = React.useRef(0);
  const touchStartY = React.useRef(0);
  const isAtBoundary = React.useRef(null); // 'top', 'bottom', or null

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchLastY.current = e.touches[0].clientY;
    isAtBoundary.current = null;
    setIsBouncing(false);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const currentY = e.touches[0].clientY;
    
    const isPullingDown = currentY > touchLastY.current;
    const isPullingUp = currentY < touchLastY.current;

    // Check boundary limits with 2px tolerance
    const isAtTop = scrollTop <= 2;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 2;

    if (isAtTop && isPullingDown) {
      if (isAtBoundary.current !== 'top') {
        isAtBoundary.current = 'top';
        touchStartY.current = currentY;
      }
      const diff = currentY - touchStartY.current;
      setOverscrollY(diff * 0.25);
      if (e.cancelable) e.preventDefault();
    } else if (isAtBottom && isPullingUp) {
      if (isAtBoundary.current !== 'bottom') {
        isAtBoundary.current = 'bottom';
        touchStartY.current = currentY;
      }
      const diff = currentY - touchStartY.current;
      setOverscrollY(diff * 0.25);
      if (e.cancelable) e.preventDefault();
    } else {
      if (isAtBoundary.current === 'top' && currentY < touchStartY.current) {
        isAtBoundary.current = null;
        setOverscrollY(0);
      } else if (isAtBoundary.current === 'bottom' && currentY > touchStartY.current) {
        isAtBoundary.current = null;
        setOverscrollY(0);
      } else if (!isAtBoundary.current) {
        setOverscrollY(0);
      }
    }
    
    touchLastY.current = currentY;
  };

  const handleTouchEnd = () => {
    setIsBouncing(true);
    setOverscrollY(0);
    isAtBoundary.current = null;
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        ...styles.scrollContent,
        height: 'calc(100% - 70px)',
        overflowY: 'auto',
        overscrollBehaviorY: 'contain',
        transform: `translateY(${overscrollY}px)`,
        transition: isBouncing ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
      }}
    >
      <h2 style={styles.pageTitle}>Dashboard Principal</h2>
      
      {/* Grid de KPIs */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Ventas de Hoy</span>
          <span style={styles.kpiMainValue}>S/ 1,240.00</span>
          <span style={styles.trendUp}>
            <TrendingUp size={11} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} /> +12.5% 
          </span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Transacciones</span>
          <span style={styles.kpiMainValue}>84</span>
          <span style={styles.trendUp}>
            <TrendingUp size={11} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} /> +8.3% 
          </span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Ticket Promedio</span>
          <span style={styles.kpiMainValue}>S/ 14.80</span>
          <span style={styles.statusStable}>Estable</span>
        </div>
      </div>

      {/* Banner de Logro */}
      <div style={styles.achievementBanner} onClick={onMetaClick}>
        <div style={styles.bannerIconBox}>
          <ShoppingBag size={20} />
        </div>
        <div style={styles.bannerTextBox}>
          <span style={styles.bannerTitle}>¡Felicidades! Superaste tu meta</span>
          <span style={styles.bannerSub}>Sigue vendiendo para alcanzar el logro diario.</span>
        </div>
        <span style={styles.bannerArrow}>
          <ArrowRight size={18} />
        </span>
      </div>

      {/* Gráfico Analítico Simulado */}
      <h3 style={styles.sectionHeader}>Tendencia de Ventas</h3>
      <div style={styles.chartWrapper}>
        <div style={styles.chartYAxis}>
          <span>1.5K</span><span>1.0K</span><span>500</span><span>0</span>
        </div>
        <div style={{ ...styles.chartArea, display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
          {/* Beautiful SVG Graph of green waves */}
          <svg style={{ width: '100%', height: '110px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A859" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00A859" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M 0 110 L 0 90 Q 30 80 60 75 Q 90 70 120 85 Q 150 100 180 55 Q 210 20 240 30 Q 270 40 300 20 L 300 110 Z" fill="url(#chartGrad)" />
            <path d="M 0 90 Q 30 80 60 75 Q 90 70 120 85 Q 150 100 180 55 Q 210 20 240 30 Q 270 40 300 20" fill="none" stroke="#00A859" strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="90" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
            <circle cx="60" cy="75" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
            <circle cx="120" cy="85" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
            <circle cx="180" cy="55" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
            <circle cx="240" cy="30" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
            <circle cx="300" cy="20" r="4.5" fill="#FFFFFF" stroke="#00A859" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* Sección de Alertas Rápidas (Stock Bajo, Agotados, Cajas, Clientes) */}
      <h3 style={styles.sectionHeader}>Alertas y Cajas</h3>
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
  );
}

// ==========================================
// 8. COMPONENTE: FORMULARIO NUEVO PRODUCTO
// ==========================================
function NuevoProductoScreen({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bebidas');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  const handleBarcodeGenerate = () => {
    const code = "775" + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(code);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, ingresa el nombre del producto.');
      return;
    }
    if (!price || parseFloat(price) < 0) {
      alert('Por favor, ingresa un precio de venta válido.');
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      alert('Por favor, ingresa un stock válido.');
      return;
    }

    const categoryAvatars = {
      Bebidas: '🥤',
      Snacks: '🥔',
      Golosinas: '🍫',
      Abarrotes: '🍚',
      Lácteos: '🥛',
      Limpieza: '🧼',
      Librería: '📓',
      Otro: '📦'
    };

    const categoryImages = {
      Bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
      Snacks: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop',
      Golosinas: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=600&auto=format&fit=crop',
      Abarrotes: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop',
      Lácteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=600&auto=format&fit=crop',
      Limpieza: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=600&auto=format&fit=crop',
      Librería: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop',
      Otro: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop'
    };

    const finalImage = image.trim() || categoryImages[category] || categoryImages.Otro;
    const finalBarcode = barcode.trim() || "775" + Math.floor(1000000000 + Math.random() * 9000000000);

    const newProd = {
      id: "PROD-" + Date.now().toString().slice(-4),
      name: name.trim(),
      category: category,
      price: parseFloat(price),
      stock: parseInt(stock),
      barcode: finalBarcode,
      image: finalImage,
      avatar: categoryAvatars[category] || '📦'
    };

    onSave(newProd);
  };

  return (
    <div style={styles.scrollContent}>
      <div style={styles.headerBiblioteca}>
        <div>
          <h2 style={styles.pageTitle}>Nuevo producto</h2>
          <span style={styles.subtextHeader}>Registra un nuevo artículo en tu inventario</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
        <div style={{
          backgroundColor: '#111111',
          border: '1px dashed #22B15B',
          borderRadius: '16px',
          height: '140px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer'
        }} onClick={() => {
          const url = prompt('Ingresa la URL de la imagen del producto:');
          if (url) setImage(url);
        }}>
          {image ? (
            <>
              <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#22B15B',
                fontSize: '11px',
                textAlign: 'center',
                padding: '6px',
                fontWeight: '600'
              }}>
                Cambiar imagen
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#8E8E93' }}>
              <Camera size={28} style={{ color: '#22B15B' }} />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>+ Cargar imagen del producto</span>
              <span style={{ fontSize: '10px', color: '#48484A' }}>Opcional (se asignará una por defecto)</span>
            </div>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>NOMBRE DEL PRODUCTO</label>
          <input 
            type="text" 
            placeholder="Ej. Coca Cola 1L" 
            style={styles.inputField} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>CATEGORÍA</label>
          <select 
            style={{
              ...styles.inputField,
              backgroundColor: '#161616',
              color: '#FFFFFF',
              border: '1px solid #222222',
              appearance: 'none',
              cursor: 'pointer'
            }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Bebidas">Bebidas</option>
            <option value="Snacks">Snacks</option>
            <option value="Golosinas">Golosinas</option>
            <option value="Abarrotes">Abarrotes</option>
            <option value="Lácteos">Lácteos</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Librería">Librería</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>CÓDIGO DE BARRAS / SKU</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Ej. 7750101001234" 
              style={{ ...styles.inputField, flex: 1 }} 
              value={barcode} 
              onChange={(e) => setBarcode(e.target.value)} 
            />
            <button 
              type="button" 
              onClick={handleBarcodeGenerate}
              style={{
                backgroundColor: '#111111',
                border: '1px solid #22B15B',
                color: '#22B15B',
                borderRadius: '12px',
                padding: '0 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Generar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.inputLabel}>PRECIO DE VENTA (S/)</label>
            <input 
              type="number" 
              step="0.10" 
              placeholder="0.00" 
              style={styles.inputField} 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              required
            />
          </div>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.inputLabel}>STOCK INICIAL</label>
            <input 
              type="number" 
              placeholder="0" 
              style={styles.inputField} 
              value={stock} 
              onChange={(e) => setStock(e.target.value)} 
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button type="submit" style={styles.btnPrimaryAction}>
            Guardar producto
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: '#8E8E93',
              border: '1px solid #222222',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// 3. COMPONENTE: CATÁLOGO DE PRODUCTOS
// ==========================================
function ProductosScreen({ products, onAddProduct, onNewProductClick }) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute category counts dynamically based on products state
  const categorias = [
    { nombre: 'Todos', cant: products.length },
    { nombre: 'Bebidas', cant: products.filter(p => p.category === 'Bebidas').length },
    { nombre: 'Snacks', cant: products.filter(p => p.category === 'Snacks').length },
    { nombre: 'Golosinas', cant: products.filter(p => p.category === 'Golosinas').length },
    { nombre: 'Abarrotes', cant: products.filter(p => p.category === 'Abarrotes').length },
    { nombre: 'Lácteos', cant: products.filter(p => p.category === 'Lácteos').length }
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoriaActiva === 'Todos' || p.category === categoriaActiva;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={styles.scrollContent}>
      {/* Encabezado del Módulo */}
      <div style={styles.headerBiblioteca}>
        <div>
          <h2 style={styles.pageTitle}>Productos</h2>
          <span style={styles.subtextHeader}>Total: {products.length} productos</span>
        </div>
        <button style={styles.btnAñadirProducto} onClick={onNewProductClick}>+ Nuevo producto</button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={styles.searchRowContainer}>
        <div style={styles.searchBarContainerExpanded}>
          <Search size={18} style={{ color: '#8E8E93' }} />
          <input 
            type="text" 
            placeholder="Buscar producto..." 
            style={styles.searchInput} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button style={styles.btnFiltroIcon} onClick={() => alert('Filtros avanzados próximamente.')}>
          <SlidersHorizontal size={16} /> Filtros
        </button>
      </div>

      {/* Pastillas de Categorías Horizontales */}
      <div style={styles.categoriesHorizontalScroll}>
        {categorias.map((cat) => (
          <button 
            key={cat.nombre} 
            onClick={() => setCategoriaActiva(cat.nombre)}
            style={categoriaActiva === cat.nombre ? styles.tagCategoryActive : styles.tagCategoryInactive}
          >
            {cat.nombre} <span style={styles.tagCountBadge}>{cat.cant}</span>
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUCTOS ORGANIZADA EN FILAS */}
      <div style={styles.productRowsListContainer}>
        {filteredProducts.map((prod) => (
          <div 
            key={prod.id} 
            style={{
              ...styles.productListItemRow,
              opacity: prod.stock === 0 ? 0.6 : 1,
              cursor: prod.stock === 0 ? 'not-allowed' : 'pointer'
            }}
            onClick={() => {
              if (prod.stock > 0) {
                onAddProduct(prod);
                alert(`${prod.name} agregado a la venta.`);
              } else {
                alert('Este producto no tiene stock disponible.');
              }
            }}
          >
            <div style={styles.productListLeftSection}>
              <img src={prod.image} alt={prod.name} style={styles.productRowThumbnailImage} />
              <div style={styles.productRowDetailsBlock}>
                <div style={styles.productRowTitleName}>{prod.name}</div>
                <div style={styles.productRowSubDetails}>
                  <span style={styles.productRowCategoryLabel}>{prod.category}</span>
                  <span style={styles.productRowDivider}>|</span>
                  <span style={styles.productRowBarcodeText}>Código: {prod.barcode}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.productListRightSection}>
              <div style={styles.productRowStockBlock}>
                <span style={styles.stockLabelTitle}>Stock</span>
                <span style={prod.stock <= 5 ? styles.stockValueAlertNumber : styles.stockValueNormalNumber}>
                  {prod.stock}
                </span>
              </div>
              <div style={styles.productRowPriceValue}>S/ {prod.price.toFixed(2)}</div>
              <span style={styles.rowChevronArrow}>
                <ChevronRight size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN INFERIOR */}
      <div style={styles.paginationFooterRow}>
        <button style={styles.arrowPaginationBtn} onClick={() => alert('Anterior página')} aria-label="Página anterior">
          <ChevronLeft size={16} />
        </button>
        <button style={styles.pageNumberBtnActive}>1</button>
        <button style={styles.pageNumberBtn} onClick={() => alert('Página 2')}>2</button>
        <button style={styles.pageNumberBtn} onClick={() => alert('Página 3')}>3</button>
        <span style={styles.paginationEllipsis}>...</span>
        <button style={styles.pageNumberBtn} onClick={() => alert('Última página')}>8</button>
        <button style={styles.arrowPaginationBtn} onClick={() => alert('Siguiente página')} aria-label="Siguiente página">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. COMPONENTE: HISTORIAL DE VENTAS
// ==========================================
function SalesHistoryScreen() {
  const salesHistory = [
    { id: 'VEN-9082', time: 'Hace 10 min', total: 24.50, items: 3, method: 'Efectivo', client: 'Franks D.' },
    { id: 'VEN-9081', time: 'Hace 32 min', total: 15.00, items: 2, method: 'Yape', client: 'General' },
    { id: 'VEN-9080', time: 'Hace 1 hora', total: 8.50, items: 1, method: 'Plin', client: 'General' },
    { id: 'VEN-9079', time: 'Hace 2 horas', total: 42.00, items: 5, method: 'Tarjeta', client: 'Maria R.' },
    { id: 'VEN-9078', time: 'Hace 3 horas', total: 11.50, items: 1, method: 'Efectivo', client: 'General' }
  ];

  return (
    <div style={styles.scrollContent}>
      <h2 style={styles.pageTitle}>Historial de Ventas</h2>
      
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(0, 168, 89, 0.15) 0%, rgba(34, 177, 91, 0.05) 100%)',
        border: '1px solid rgba(0, 168, 89, 0.25)', 
        borderRadius: '16px', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>Total Facturado Hoy</span>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#22B15B', margin: '2px 0 0 0' }}>S/ 1,240.00</h3>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#8E8E93', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>84 Transacciones</span>
          <span>Promedio: S/ 14.80</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {salesHistory.map((s) => (
          <div key={s.id} style={styles.cartItem}>
            <div style={styles.cartItemLeft}>
              <span style={{ ...styles.productAvatar, color: '#22B15B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={18} /></span>
              <div>
                <div style={styles.productName}>Venta {s.id}</div>
                <div style={styles.productPriceText}>{s.time} • {s.client}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700' }}>S/ {s.total.toFixed(2)}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ fontSize: '9px', backgroundColor: '#161616', border: '1px solid #222', padding: '2px 6px', borderRadius: '4px', color: '#8E8E93' }}>{s.items} items</span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: '700',
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  backgroundColor: s.method === 'Efectivo' ? 'rgba(34, 177, 91, 0.1)' : s.method === 'Yape' ? 'rgba(160, 193, 247, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  color: s.method === 'Efectivo' ? '#22B15B' : s.method === 'Yape' ? '#A0C1F7' : '#ff9500'
                }}>{s.method}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. COMPONENTE: NUEVA VENTA (Vista Escáner)
// ==========================================
function NuevaVentaScreen({ cart, onAddQty, onSubQty, onDeleteItem, onScanClick, flashActive, onSearchAdd }) {
  const [manualSearch, setManualSearch] = useState('');
  
  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > 15 ? 1.50 : 0.00; // S/ 1.50 discount if subtotal exceeds S/ 15
  const total = subtotal - discount;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && manualSearch.trim()) {
      onSearchAdd(manualSearch);
      setManualSearch('');
    }
  };

  return (
    <div style={styles.scrollContent}>
      <h2 style={styles.pageTitle}>Nueva venta</h2>
      
      {/* Caja de Escáner Principal */}
      <div 
        style={{ 
          ...styles.mainScannerCard, 
          position: 'relative', 
          cursor: 'pointer',
          overflow: 'hidden'
        }} 
        onClick={onScanClick}
      >
        {/* Flash Effect overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 5,
          opacity: flashActive ? 0.8 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease'
        }}></div>

        <span style={styles.scannerHeaderTitle}>Escanear producto</span>
        <span style={styles.scannerHeaderSub}>Haz clic aquí para simular el escaneo de código de barras o QR</span>
        <div style={styles.scannerFrameTarget}>
          <div className="scanner-laser"></div>
          <Camera size={32} style={{ color: '#FFFFFF' }} />
        </div>
      </div>

      <div style={styles.searchBarContainer}>
         <Search size={18} style={{ color: '#8E8E93' }} />
         <input 
           type="text" 
           placeholder="Buscar producto manualmente (Presiona Enter)..." 
           style={styles.searchInput} 
           value={manualSearch}
           onChange={(e) => setManualSearch(e.target.value)}
           onKeyDown={handleKeyDown}
         />
      </div>

      {/* Lista del Carrito */}
      <h3 style={styles.sectionHeader}>Productos en la venta ({cart.reduce((sum, item) => sum + item.qty, 0)})</h3>
      <div style={styles.cartList}>
        {cart.length > 0 ? (
          cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <div style={styles.cartItemLeft}>
                <span style={styles.productAvatar}>{item.avatar || '🥤'}</span>
                <div>
                  <div style={styles.productName}>{item.name}</div>
                  <div style={styles.productPriceText}>S/ {item.price.toFixed(2)}</div>
                </div>
              </div>
              <div style={styles.cartItemRight}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={styles.qtyCounter}>
                    <span style={{ cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} onClick={() => onSubQty(item.id)}><Minus size={12} /></span> 
                    <span style={{ minWidth: '16px', textAlign: 'center' }}>{item.qty}</span> 
                    <span style={{ cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} onClick={() => onAddQty(item.id)}><Plus size={12} /></span>
                  </div>
                  <button 
                    style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    onClick={() => onDeleteItem(item.id)}
                    aria-label="Eliminar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <span style={styles.itemTotalRow}>S/ {(item.price * item.qty).toFixed(2)}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: '#8E8E93', fontSize: '13px' }}>
            El carrito está vacío. Escanea o agrega productos.
          </div>
        )}
      </div>

      {/* Resumen de Caja */}
      <div style={styles.checkoutSummaryCard}>
        <div style={styles.summaryRow}><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
        <div style={styles.summaryRow}><span>Descuento</span><span style={styles.greenText}>- S/ {discount.toFixed(2)}</span></div>
        <div style={styles.totalRowBlock}><span>TOTAL</span><span style={styles.totalPriceValue}>S/ {total.toFixed(2)}</span></div>
      </div>

      <button style={styles.btnPrimaryAction} onClick={() => alert('Venta completada con éxito por un total de S/ ' + total.toFixed(2))}>
        Continuar venta 
      </button>
    </div>
  );
}

// ==========================================
// 6. COMPONENTE CONTROLADOR (Raíz de la App)
// ==========================================
export default function VendixApp() {
  const [currentRoute, setCurrentRoute] = useState('login'); // 'login', 'dashboard', 'scanner', 'products', 'sales'
  const [products, setProducts] = useState(PRODUCT_DATABASE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Cart state initialized to matches mockup items
  const [cart, setCart] = useState([
    { id: 1, name: 'Coca Cola 500 ml', price: 4.00, qty: 2, avatar: '🥤' },
    { id: 2, name: 'Inca Kola 500 ml', price: 4.50, qty: 1, avatar: '🥤' }
  ]);

  // Handle simulated scan beep and random product addition
  const handleScan = () => {
    // 1. Play beep
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); 

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); 
    } catch (e) {
      console.log('Audio API beep supported/allowed:', e);
    }

    // 2. Trigger scanner laser flash
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    // 3. Add random product
    const randProd = products[Math.floor(Math.random() * products.length)];
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

  // Add from catalog
  const handleAddProductFromCatalog = (product) => {
    // Play sound beep
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

    setCart(prevCart => {
      const existing = prevCart.find(item => item.name === product.name);
      if (existing) {
        return prevCart.map(item => 
          item.name === product.name ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevCart, {
          id: Date.now(),
          name: product.name,
          price: product.price,
          qty: 1,
          avatar: product.avatar
        }];
      }
    });
  };

  // Search addition
  const handleSearchAdd = (name) => {
    const found = products.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase()) || 
      p.barcode === name
    );
    const productToAdd = found || { name: name, price: 4.50, avatar: '📦', stock: 10 };
    handleAddProductFromCatalog(productToAdd);
  };

  // Cart Qty Modifiers
  const handleAddQty = (id) => {
    setCart(prevCart => prevCart.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const handleSubQty = (id) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty - 1;
        return { ...item, qty: newQty < 1 ? 1 : newQty };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  return (
    <div style={styles.deviceViewport} className="app-container">
      {/* HEADER PRINCIPAL (Oculto en Login o en Venta Completa Escáner o Nuevo Producto) */}
      {currentRoute !== 'login' && currentRoute !== 'scanner' && currentRoute !== 'new-product' && (
        <header style={styles.navbarTop} className="app-header">
          {/* 3 RAYITAS ARRIBA A LA IZQUIERDA */}
          <button style={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>
             <Menu size={24} />
          </button>
          <span style={styles.topBarLogoName}>Vendix</span>
          <button style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => alert('No tienes notificaciones pendientes.')}>
             <Bell size={20} />
          </button>
        </header>
      )}

      {/* SIDEBAR DRAWER PANEL */}
      {currentRoute !== 'login' && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1000,
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s ease'
            }}
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              backgroundColor: '#111111',
              borderRight: '1px solid #222222',
              zIndex: 1010,
              display: 'flex',
              flexDirection: 'column',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px', backgroundColor: 'rgba(0, 168, 89, 0.1)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>🏪</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Vendix Pucallpa</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#8E8E93' }}>Sucursal Principal</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#00A859', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>Mi Negocio</span>
                <button 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0, 168, 89, 0.08)', border: '1px solid rgba(0, 168, 89, 0.2)', color: '#00A859', fontSize: '13.5px', fontWeight: '600', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => { setSidebarOpen(false); alert('Sucursal Principal seleccionada.'); }}
                >
                  <span>Sucursal Pucallpa</span>
                  <ChevronRight size={14} />
                </button>
                <button 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid transparent', color: '#FFFFFF', fontSize: '13.5px', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => { setSidebarOpen(false); alert('Configuraciones de negocio abiertas.'); }}
                >
                  <span>Configuraciones</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#8E8E93', display: 'block', marginBottom: '8px', borderTop: '1px dashed #222', paddingTop: '12px', wordBreak: 'break-all' }}>{loggedInUser || 'duque@gmail.com'}</span>
                <button 
                  onClick={() => {
                    setLoggedInUser('');
                    setEmail('');
                    setPassword('');
                    setCurrentRoute('login');
                    setSidebarOpen(false);
                  }}
                  style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', borderRadius: '12px', padding: '10px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ESPACIO DE RENDERIZADO DE PANTALLAS */}
      <main style={{
        ...styles.appViewContainer,
        overflowY: currentRoute === 'dashboard' ? 'hidden' : 'auto',
        paddingBottom: (currentRoute === 'dashboard' || currentRoute === 'login' || currentRoute === 'new-product') ? '0px' : '90px'
      }}>
        {currentRoute === 'login' && (
          <LoginScreen 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onLoginSuccess={() => {
              setLoggedInUser(email || 'duque@gmail.com');
              setCurrentRoute('dashboard');
            }} 
          />
        )}
        {currentRoute === 'dashboard' && <DashboardScreen onMetaClick={() => setCurrentRoute('scanner')} />}
        {currentRoute === 'products' && (
          <ProductosScreen 
            products={products}
            onAddProduct={handleAddProductFromCatalog} 
            onNewProductClick={() => setCurrentRoute('new-product')} 
          />
        )}
        {currentRoute === 'new-product' && (
          <NuevoProductoScreen 
            onSave={(newProd) => {
              setProducts(prev => [newProd, ...prev]);
              setCurrentRoute('products');
            }}
            onCancel={() => setCurrentRoute('products')}
          />
        )}
        {currentRoute === 'sales' && <SalesHistoryScreen />}
        {currentRoute === 'scanner' && (
          <NuevaVentaScreen 
            cart={cart}
            onAddQty={handleAddQty}
            onSubQty={handleSubQty}
            onDeleteItem={handleDeleteItem}
            onScanClick={handleScan}
            flashActive={flashActive}
            onSearchAdd={handleSearchAdd}
          />
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR (Oculta en Login o Nuevo Producto) */}
      {currentRoute !== 'login' && currentRoute !== 'new-product' && (
        <nav style={styles.bottomTabNavigation}>
          <button 
            style={currentRoute === 'dashboard' ? styles.tabItemActive : styles.tabItem} 
            onClick={() => setCurrentRoute('dashboard')}
          >
            <HomeIcon size={20} />
            <span>Inicio</span>
          </button>
          
          <button 
            style={currentRoute === 'products' ? styles.tabItemActive : styles.tabItem} 
            onClick={() => setCurrentRoute('products')}
          >
            <Package size={20} />
            <span>Productos</span>
          </button>
          
          {/* BOTÓN CENTRAL FLOTANTE NUEVA VENTA */}
          <button style={styles.centerFloatingBtn} onClick={() => setCurrentRoute('scanner')}>
            <Plus size={26} />
          </button>
          
          <button 
            style={currentRoute === 'sales' ? styles.tabItemActive : styles.tabItem} 
            onClick={() => setCurrentRoute('sales')}
          >
            <Receipt size={20} />
            <span>Ventas</span>
          </button>
          
          {/* BOTÓN DE ESCANEAR EN LA ESQUINA INFERIOR DERECHA */}
          <button 
            style={currentRoute === 'scanner' ? styles.tabItemActiveGreen : styles.tabItem} 
            onClick={() => {
              if (currentRoute !== 'scanner') {
                setCurrentRoute('scanner');
              } else {
                handleScan();
              }
            }}
          >
            <Scan size={20} />
            <span>Escanear</span>
          </button>
        </nav>
      )}
    </div>
  );
}

// ==========================================
// 7. OBJETO DE ESTILOS CSS EN LÍNEA (JS)
// ==========================================
const styles = {
  deviceViewport: { backgroundColor: '#080808', color: '#FFFFFF', height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' },
  navbarTop: { height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#080808', borderBottom: '1px solid #141414', position: 'sticky', top: 0, zIndex: 10 },
  hamburgerBtn: { background: 'none', border: 'none', color: '#FFFFFF', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  topBarLogoName: { fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.5px' },
  topNotificationIcon: { fontSize: '20px', cursor: 'pointer' },
  appViewContainer: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  scrollContent: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  
  // Biblioteca Grid Styles
  headerBiblioteca: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', margin: 0 },
  subtextHeader: { fontSize: '12px', color: '#22B15B', fontWeight: '600' },
  btnAñadirProducto: { backgroundColor: '#22B15B', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  
  searchRowContainer: { display: 'flex', gap: '12px', alignItems: 'center', width: '100%' },
  searchBarContainerExpanded: { backgroundColor: '#111111', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', color: '#8E8E93', flex: 1, border: '1px solid #1C1C1E' },
  btnFiltroIcon: { backgroundColor: '#111111', border: '1px solid #1C1C1E', borderRadius: '12px', color: '#FFFFFF', padding: '12px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  
  categoriesHorizontalScroll: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', width: '100%' },
  tagCategoryActive: { backgroundColor: '#22B15B', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  tagCategoryInactive: { backgroundColor: '#111111', color: '#8E8E93', border: '1px solid #1C1C1E', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  tagCountBadge: { fontSize: '11px', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '8px' },

  // Lista en Filas Organizadas (Product List Rows)
  productRowsListContainer: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' },
  productListItemRow: { backgroundColor: '#111111', border: '1px solid #1C1C1E', borderRadius: '16px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  productListLeftSection: { display: 'flex', alignItems: 'center', gap: '14px', flex: 1 },
  productRowThumbnailImage: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', backgroundColor: '#161616' },
  productRowDetailsBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  productRowTitleName: { fontSize: '14px', fontWeight: '600', color: '#FFFFFF' },
  productRowSubDetails: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
  productRowCategoryLabel: { color: '#22B15B', fontWeight: '500' },
  productRowDivider: { color: '#3A3A3C' },
  productRowBarcodeText: { color: '#8E8E93' },
  
  productListRightSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  productRowStockBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  stockLabelTitle: { fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase' },
  stockValueNormalNumber: { fontSize: '14px', fontWeight: '700', color: '#22B15B' },
  stockValueAlertNumber: { fontSize: '14px', fontWeight: '700', color: '#FF9500' },
  productRowPriceValue: { fontSize: '15px', fontWeight: '700', color: '#FFFFFF', width: '65px', textAlign: 'right' },
  rowChevronArrow: { color: '#3A3A3C', fontSize: '12px', display: 'flex', alignItems: 'center' },

  // Paginación
  paginationFooterRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '10px 0' },
  pageNumberBtn: { backgroundColor: '#111111', border: '1px solid #1C1C1E', color: '#8E8E93', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  pageNumberBtnActive: { backgroundColor: '#22B15B', border: 'none', color: '#FFFFFF', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  arrowPaginationBtn: { backgroundColor: '#111111', border: '1px solid #1C1C1E', color: '#FFFFFF', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  paginationEllipsis: { color: '#48484A', padding: '0 4px' },
  
  // Login Styles
  loginContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: '85vh' },
  brandHeader: { textAlign: 'center', marginBottom: '32px' },
  logoWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  logoIcon: { fontSize: '36px' },
  logoText: { fontSize: '32px', margin: 0, fontWeight: '800' },
  slogan: { color: '#00A859', margin: '6px 0 0 0', fontWeight: '500', letterSpacing: '1px', fontSize: '14px' },
  loginCard: { backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '380px', boxSizing: 'border-box' },
  cardTitle: { margin: '0 0 6px 0', fontSize: '24px', fontWeight: '700', textAlign: 'center' },
  cardSubtitle: { color: '#8E8E93', margin: '0 0 24px 0', fontSize: '13px', textAlign: 'center' },
  inputGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { color: '#00A859', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  inputField: { width: '100%', backgroundColor: '#161616', border: '1px solid #222222', borderRadius: '12px', padding: '14px', color: '#FFFFFF', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  rowUtilities: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', margin: '12px 0 20px 0' },
  checkboxLabel: { color: '#8E8E93', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  linkText: { color: '#00A859', cursor: 'pointer' },
  linkTextHighlight: { color: '#22B15B', fontWeight: '600', cursor: 'pointer' },
  btnPrimary: { width: '100%', backgroundColor: '#22B15B', color: '#FFFFFF', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' },
  dividerLine: { flex: 1, height: '1px', backgroundColor: '#222222' },
  dividerText: { color: '#8E8E93', fontSize: '12px' },
  socialButtonsRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  btnGoogle: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161616', color: '#FFFFFF', border: '1px solid #222222', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnFacebook: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161616', color: '#FFFFFF', border: '1px solid #222222', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { width: '100%', backgroundColor: 'transparent', color: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  registerText: { textAlign: 'center', fontSize: '13px', color: '#8E8E93', marginTop: '24px', marginHeight: 0 },
  securityFooter: { color: '#8E8E93', fontSize: '12px', marginTop: '30px', display: 'flex', gap: '6px', alignItems: 'center' },

  // Dashboard Styles
  pageTitle: { fontSize: '24px', fontWeight: '700', margin: 0 },
  kpiGrid: { display: 'flex', gap: '12px' },
  kpiCard: { backgroundColor: '#111111', border: '1px solid #1C1C1E', borderRadius: '16px', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiTitle: { fontSize: '12px', color: '#8E8E93' },
  kpiMainValue: { fontSize: '18px', fontWeight: '700' },
  trendUp: { color: '#22B15B', fontSize: '11px', fontWeight: '600' },
  statusStable: { color: '#8E8E93', fontSize: '11px' },
  achievementBanner: { backgroundColor: '#00A859', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  bannerIconBox: { fontSize: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannerTextBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  bannerTitle: { fontSize: '14px', fontWeight: '700' },
  bannerSub: { fontSize: '12px', opacity: 0.9 },
  bannerArrow: { fontSize: '16px', display: 'flex', alignItems: 'center' },
  sectionHeader: { fontSize: '16px', fontWeight: '600', margin: '10px 0 0 0' },
  chartWrapper: { backgroundColor: '#111111', borderRadius: '16px', padding: '20px', display: 'flex', gap: '15px', height: '150px' },
  chartYAxis: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#8E8E93', fontSize: '11px' },
  chartArea: { flex: 1, borderLeft: '1px solid #222', borderBottom: '1px solid #222', position: 'relative', overflow: 'hidden' },
  chartLineMock: { position: 'absolute', bottom: '30px', left: 0, right: 0, height: '4px', backgroundColor: '#00A859', boxShadow: '0 0 12px #00A859' },

  // Nueva Venta Styles
  mainScannerCard: { backgroundColor: '#00A859', borderRadius: '20px', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  scannerHeaderTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  scannerHeaderSub: { fontSize: '12px', opacity: 0.9, marginBottom: '20px' },
  scannerFrameTarget: { width: '80px', height: '80px', border: '2px dashed #FFFFFF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', position: 'relative' },
  scannerLaser: { position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#FF3B30', top: '50%' },
  searchBarContainer: { backgroundColor: '#111111', borderRadius: '12px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'center', color: '#8E8E93' },
  searchInput: { background: 'none', border: 'none', color: '#FFF', flex: 1, fontSize: '14px', outline: 'none' },
  cartList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  cartItem: { backgroundColor: '#111111', borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cartItemLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  productAvatar: { fontSize: '18px', backgroundColor: '#161616', border: '1px solid #222', padding: '8px', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: '14px', fontWeight: '600' },
  productPriceText: { fontSize: '12px', color: '#8E8E93', marginTop: '2px' },
  cartItemRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  qtyCounter: { backgroundColor: '#1C1C1E', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: '600' },
  itemTotalRow: { fontSize: '14px', fontWeight: '700' },
  checkoutSummaryCard: { borderTop: '1px solid #1C1C1E', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8E8E93' },
  greenText: { color: '#22B15B' },
  totalRowBlock: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', marginTop: '6px', borderTop: '1px dashed #222', paddingTop: '10px' },
  totalPriceValue: { color: '#22B15B' },
  btnPrimaryAction: { backgroundColor: '#22B15B', color: '#FFFFFF', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },

  // Navigation Bar Styles
  bottomTabNavigation: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', backgroundColor: '#111111', borderTop: '1px solid #1C1C1E', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 20, paddingBottom: '5px' },
  tabItem: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#8E8E93', fontSize: '11px', cursor: 'pointer', width: '60px' },
  tabItemActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#FFFFFF', fontSize: '11px', cursor: 'pointer', width: '60px' },
  tabItemActiveGreen: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#22B15B', fontSize: '11px', fontWeight: '600', cursor: 'pointer', width: '60px' },
  centerFloatingBtn: { width: '52px', height: '52px', backgroundColor: '#00A859', borderRadius: '50%', border: 'none', color: '#FFFFFF', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-24px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 168, 89, 0.4)' }
};
