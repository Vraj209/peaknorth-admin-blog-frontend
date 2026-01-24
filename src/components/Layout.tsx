import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Lock,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleChangePassword = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    navigate('/change-password');
  };

  return (
    <div className="min-h-screen bg-white transition-colors">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <span className="ml-2 text-xl font-bold text-gray-900">
              PeakNorth
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation - flex-1 allows it to grow */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section - flex-shrink-0 keeps it at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || currentUser?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser?.email}
                </p>
              </div>
              <ChevronDown 
                className={clsx(
                  "w-4 h-4 text-gray-400 transition-transform",
                  userMenuOpen && "rotate-180"
                )} 
              />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
                <div className="border-t border-gray-200" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center ml-3">
          <span className="ml-2 text-xl font-bold text-gray-900">
            Blog Automation
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <main className="py-6 lg:py-8 h-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
