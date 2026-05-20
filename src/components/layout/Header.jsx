import { useApp, ROLES } from '../../context/AppContext.jsx';

var ROLE_META = {};
ROLE_META[ROLES.director] = { label: 'Director de Proyecto', description: 'Vista completa - todas las secciones', color: 'var(--color-primary)' };
ROLE_META[ROLES.lider]    = { label: 'Lider de Proyecto',    description: 'Clientes - Facturacion - Cambios de alcance', color: '#f59e0b' };
ROLE_META[ROLES.admin]    = { label: 'Administrativo',       description: 'Facturacion - Licencias - Proyeccion', color: '#8b5cf6' };

export default function Header({ title }) {
  const { currentRole, setCurrentRole } = useApp();
  const meta = ROLE_META[currentRole] || ROLE_META[ROLES.director];

  return (
    <header className="app-header">
      <div>
        <span className="header-title">{title || 'Gestor de Facturacion Contractual'}</span>
      </div>
      <div className="header-role-selector">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <select
            value={currentRole}
            onChange={function(e) { setCurrentRole(e.target.value); }}
            style={{
              background: 'var(--color-bg-elevated)',
              color: meta.color,
              border: '1px solid ' + meta.color + '44',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
            title="Cambiar rol (modo demo)"
          >
            {Object.values(ROLES).map(function(role) {
              return (
                <option key={role} value={role}>
                  {ROLE_META[role] ? ROLE_META[role].label : role}
                </option>
              );
            })}
          </select>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {meta.description}
          </span>
        </div>
      </div>
    </header>
  );
}
