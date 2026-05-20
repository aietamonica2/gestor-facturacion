import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Header from '../components/layout/Header.jsx';
import { useApp, ROLES } from '../context/AppContext.jsx';

var pageTitles = {
  '/dashboard':            'Dashboard',
  '/clientes':             'Clientes',
  '/contratos':            'Contratos',
  '/cambios-de-alcance':   'Cambios de Alcance',
  '/facturacion':          'Facturacion',
  '/licenciamiento':       'Licenciamiento',
  '/alertas':              'Alertas',
  '/proyeccion-cobranzas': 'Proyeccion de Cobranzas',
};

var ROLE_PAGES = {};
ROLE_PAGES[ROLES.director] = ['/dashboard', '/clientes', '/contratos', '/cambios-de-alcance', '/facturacion', '/licenciamiento', '/alertas', '/proyeccion-cobranzas'];
ROLE_PAGES[ROLES.lider]    = ['/dashboard', '/clientes', '/cambios-de-alcance', '/facturacion', '/alertas'];
ROLE_PAGES[ROLES.admin]    = ['/dashboard', '/facturacion', '/licenciamiento', '/alertas', '/proyeccion-cobranzas'];

var ROLE_WELCOME = {};
ROLE_WELCOME[ROLES.director] = { icon: '👔', text: 'Modo Director — acceso completo a todas las secciones.' };
ROLE_WELCOME[ROLES.lider]    = { icon: '🎯', text: 'Modo Lider — ves tus clientes, facturacion pendiente y cambios de alcance.' };
ROLE_WELCOME[ROLES.admin]    = { icon: '📋', text: 'Modo Administrativo — gestionas emision, cobros y proyeccion de cobranzas.' };

export default function MainLayout() {
  var location = useLocation();
  var navigate = useNavigate();
  var app = useApp();
  var currentRole = app.currentRole;

  // Sidebar collapsed state — persiste en localStorage
  var storedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  var [sidebarCollapsed, setSidebarCollapsed] = useState(storedCollapsed);

  function toggleSidebar() {
    setSidebarCollapsed(function(prev) {
      localStorage.setItem('sidebarCollapsed', String(!prev));
      return !prev;
    });
  }

  var title = pageTitles[location.pathname] || 'Gestor de Facturacion Contractual';
  var welcome = ROLE_WELCOME[currentRole] || ROLE_WELCOME[ROLES.director];

  useEffect(function() {
    var allowed = ROLE_PAGES[currentRole] || [];
    var basePath = '/' + location.pathname.split('/')[1];
    if (!allowed.includes(basePath)) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentRole, location.pathname, navigate]);

  return (
    <div className={'app-layout' + (sidebarCollapsed ? ' sidebar-collapsed' : '')}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="app-main">
        <Header title={title} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <div className="role-context-banner" data-role={currentRole}>
          <span className="role-banner-icon">{welcome.icon}</span>
          <span className="role-banner-text">{welcome.text}</span>
        </div>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
