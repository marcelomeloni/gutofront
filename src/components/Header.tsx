"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";
import { Sun, Moon, List } from "@phosphor-icons/react";

const routeData: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Visão Geral", subtitle: "Acompanhe os principais indicadores da sua campanha." },
  "/agenda": { title: "Agenda e Eventos", subtitle: "Gerencie os próximos compromissos da campanha." },
  "/arquivos": { title: "Biblioteca de Arquivos", subtitle: "Organize e gerencie os links do Google Drive da campanha." },
  "/bairros": { title: "Mapeamento de Bairros", subtitle: "Visão territorial da sua campanha." },
  "/demandas": { title: "Mapa de Demandas", subtitle: "Monitore e atue sobre os problemas da cidade relatados pela população." },
  "/estoque": { title: "Estoque de Materiais", subtitle: "Controle de insumos físicos, impressos e kits de rua da campanha." },
  "/financeiro": { title: "Financeiro & Contábil", subtitle: "Gestão de recursos, conciliação e documentação de campanha." },
  "/imprensa": { title: "Imprensa & Mídia", subtitle: "Gerencie a agenda de entrevistas e sua base de veículos de comunicação." },
  "/leads": { title: "Leads & Apoiadores", subtitle: "Gerencie potenciais eleitores captados e seu funil de conversão." },
  "/marketing": { title: "Marketing & Editorial", subtitle: "Gerencie publicações, pautas e acompanhe a distribuição." },
  "/tarefas": { title: "Quadro de Tarefas", subtitle: "Organize as atividades internas da equipe de forma visual." },
  "/usuarios": { title: "Equipe & Acessos", subtitle: "Gerencie os usuários e defina quem tem permissão de acessar cada área." },
};

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useMobileSidebar();
  
  const data = routeData[pathname] || { title: "Painel", subtitle: "Bem-vindo ao sistema." };

  return (
    <header className="h-16 sm:h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-10 transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger - mobile only */}
        <button
          onClick={toggle}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
        >
          <List size={24} weight="bold" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">{data.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 truncate hidden sm:block">{data.subtitle}</p>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand/40 shrink-0"
        title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      >
        <Sun size={14} weight="fill" className="absolute left-1.5 top-1/2 -translate-y-1/2 text-amber-500 transition-opacity duration-300 opacity-100 dark:opacity-30" />
        <Moon size={14} weight="fill" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity duration-300 opacity-30 dark:opacity-100 dark:text-blue-300" />
        
        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${theme === "dark" ? "translate-x-7" : "translate-x-0"}`}>
          {theme === "light" 
            ? <Sun size={14} weight="fill" className="text-amber-500" /> 
            : <Moon size={14} weight="fill" className="text-indigo-500" />
          }
        </div>
      </button>
    </header>
  );
}
