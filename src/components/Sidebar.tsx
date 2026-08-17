"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import {
  SquaresFour,
  CalendarBlank,
  MapPin,
  ClipboardText,
  CheckSquareOffset,
  Megaphone,
  Newspaper,
  Package,
  CurrencyCircleDollar,
  FolderOpen,
  Users,
  UsersThree,
  SignOut,
  UserCircle,
  X
} from "@phosphor-icons/react";

import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: SquaresFour, roles: ["admin", "operacional", "agenda", "marketing", "financeiro"] },
  { name: "Leads", href: "/leads", icon: UsersThree, roles: ["admin", "operacional"] },
  { name: "Agenda e Eventos", href: "/agenda", icon: CalendarBlank, roles: ["admin", "agenda"] },
  { name: "Bairros", href: "/bairros", icon: MapPin, roles: ["admin", "operacional"] },
  { name: "Demandas", href: "/demandas", icon: ClipboardText, roles: ["admin", "operacional"] },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquareOffset, roles: ["admin", "operacional", "agenda", "marketing", "financeiro"] },
  { name: "Marketing", href: "/marketing", icon: Megaphone, roles: ["admin", "marketing"] },
  { name: "Imprensa", href: "/imprensa", icon: Newspaper, roles: ["admin", "marketing"] },
  { name: "Estoque", href: "/estoque", icon: Package, roles: ["admin", "operacional", "marketing"] },
  { name: "Financeiro", href: "/financeiro", icon: CurrencyCircleDollar, roles: ["admin", "financeiro"] },
  { name: "Arquivos", href: "/arquivos", icon: FolderOpen, roles: ["admin", "operacional", "agenda", "marketing", "financeiro"] },
  { name: "Usuários", href: "/usuarios", icon: Users, roles: ["admin"] },
];

function SidebarContent() {
  const pathname = usePathname();
  const { close } = useMobileSidebar();
  const { user, logout } = useAuth();
  
  const userRole = user?.role?.toLowerCase() || 'militante';
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Guto <span className="text-brand">Schiavetto</span></h2>
          {/* Close button - mobile only */}
          <button onClick={close} className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={22} weight="bold" />
          </button>
        </div>
        
        <nav className="px-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-brand/15 text-brand font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} className={isActive ? "text-brand" : "text-slate-400 dark:text-slate-500"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <UserCircle size={32} weight="fill" className="text-slate-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{user?.nome || 'Convidado'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{user?.role || ''}</span>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200">
          <SignOut size={20} />
          Sair da conta
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {/* Desktop Sidebar - always visible */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-black text-slate-600 dark:text-slate-300 flex-col h-full border-r border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - overlay drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-black text-slate-600 dark:text-slate-300 flex flex-col z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
