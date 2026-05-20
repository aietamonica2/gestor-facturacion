import { NavLink } from 'react-router-dom';
import { useApp, ROLES } from '../../context/AppContext.jsx';
import { countCriticalAlerts } from '../../services/alertService.js';
import { APP_VERSION } from '../../version.js';

var ROLE_NAV = {};
ROLE_NAV[ROLES.director] = ['dashboard', 'clientes', 'contratos', 'alcance', 'facturacion', 'licencias', 'alertas', 'proyeccion'];
ROLE_NAV[ROLES.lider]    = ['dashboard', 'clientes', 'alcance', 'facturacion', 'alertas'];
ROLE_NAV[ROLES.admin]    = ['dashboard', 'facturacion', 'licencias', 'alertas', 'proyeccion'];

var ALL_NAV = [
  { id: 'dashboard',   to: '/dashboard',           icon: '📊', label: 'Dashboard' },
  { id: 'clientes',    to: '/clientes',             icon: '🏢', label: 'Clientes' },
  { id: 'contratos',   to: '/contratos',            icon: '📄', label: 'Contratos' },
  { id: 'alcance',     to: '/cambios-de-alcance',   icon: '🔄', label: 'Cambios de Alcance' },
  { id: 'facturacion', to: '/facturacion',          icon: '💰', label: 'Facturacion' },
  { id: 'licencias',   to: '/licenciamiento',       icon: '🔑', label: 'Licenciamiento' },
  { id: 'alertas',     to: '/alertas',              icon: '🔔', label: 'Alertas' },
  { id: 'proyeccion',  to: '/proyeccion-cobranzas', icon: '📈', label: 'Proyeccion' },
];

export default function Sidebar({ collapsed, onToggle }) {
  var appCtx = useApp();
  var alerts = appCtx.alerts;
  var currentRole = appCtx.currentRole;
  var criticalCount = countCriticalAlerts(alerts);
  var allowed = ROLE_NAV[currentRole] || ROLE_NAV[ROLES.director];
  var navItems = ALL_NAV.filter(function(item) { return allowed.indexOf(item.id) !== -1; });

  return (
    <nav className={'app-sidebar' + (collapsed ? ' collapsed' : '')}>
      <div className="sidebar-brand">
        {!collapsed && (
          <div className="sidebar-brand-text">
            <h1>CBT</h1>
            <p>Contract Billing Tracker</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="sidebar-toggle-btn"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <div className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">Navegacion</div>}
        {navItems.map(function(item) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={function(p) { return 'nav-item' + (p.isActive ? ' active' : ''); }}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {item.id === 'alertas' && criticalCount > 0 && (
                <span className={'nav-badge' + (collapsed ? ' nav-badge-collapsed' : '')}>{criticalCount}</span>
              )}
            </NavLink>
          );
        })}
      </div>
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {APP_VERSION}
        </div>
      )}
    </nav>
  );
}
