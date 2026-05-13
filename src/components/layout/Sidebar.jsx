 import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  BarChart,
  Image,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/ventas', icon: ShoppingCart, label: 'Vender' },
  { to: '/pedidos', icon: Calendar, label: 'Pedidos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/reportes', icon: BarChart, label: 'Reportes' }
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-rosa/20 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 text-center border-b border-rosa/20">
        <span className="text-4xl">🎈</span>
        <h2 className="text-lg font-bold text-texto-suave mt-2">La Casa del Globo</h2>
        <p className="text-xs text-rosa-oscuro italic mt-1">Inflamos sonrisas</p>
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${
                isActive
                  ? 'bg-rosa/30 text-rosa-oscuro font-medium'
                  : 'text-texto-suave hover:bg-rosa/10'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-rosa/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-texto-suave hover:bg-red-50 hover:text-red-400 transition-colors w-full text-sm"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}