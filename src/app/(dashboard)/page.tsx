"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  UsersThree,
  CurrencyCircleDollar,
  ClipboardText,
  CalendarBlank,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
  WarningCircle,
  Megaphone,
  CaretRight
} from "@phosphor-icons/react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({ totalLeads: 0, saldo: 0, demandasAbertas: 0, eventosHoje: 0 });
  const [agendaHoje, setAgendaHoje] = useState<any[]>([]);
  const [demandasCriticas, setDemandasCriticas] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [leads, financeiro, demandas, agenda] = await Promise.all([
          api.leads.getAll(),
          api.financeiro.getAll(),
          api.demandas.getAll(),
          api.agenda.getAll()
        ]);
        
        // Calculate KPIs from real data
        const totalLeads = leads.length;
        const receitas = financeiro.filter((f: any) => f.tipo === 'Receita').reduce((sum: number, f: any) => sum + (parseFloat(f.valor) || 0), 0);
        const despesas = financeiro.filter((f: any) => f.tipo === 'Despesa').reduce((sum: number, f: any) => sum + (parseFloat(f.valor) || 0), 0);
        const saldo = receitas - despesas;
        const demandasAbertas = demandas.filter((d: any) => d.status !== 'Resolvida').length;
        
        // Today's events
        const today = new Date().toISOString().split('T')[0];
        const eventosHoje = agenda.filter((e: any) => {
          const eventDate = e.data_inicio?.split('T')[0];
          return eventDate === today;
        });
        
        // Recent critical demandas (last 24h)
        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        const demandasRecentes = demandas.filter((d: any) => d.created_at > oneDayAgo).slice(0, 3);
        
        setKpiData({ totalLeads, saldo, demandasAbertas, eventosHoje: eventosHoje.length });
        setAgendaHoje(eventosHoje);
        setDemandasCriticas(demandasRecentes);
      } catch (err: any) {
        toast.error('Erro ao carregar dashboard: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Mock Data para o Dashboard
  const kpis = [
    {
      id: 1,
      title: "Leads Convertidos",
      value: kpiData.totalLeads.toString(),
      change: "+12%",
      isPositive: true,
      icon: UsersThree,
      color: "text-brand",
      bg: "bg-blue-50",
      border: "border-blue-100",
      href: "/leads"
    },
    {
      id: 2,
      title: "Saldo em Caixa",
      value: `R$ ${kpiData.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "-4%",
      isPositive: false,
      icon: CurrencyCircleDollar,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      href: "/financeiro"
    },
    {
      id: 3,
      title: "Demandas Abertas",
      value: kpiData.demandasAbertas.toString(),
      change: "Urgente",
      isPositive: false,
      icon: ClipboardText,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      href: "/demandas"
    },
    {
      id: 4,
      title: "Eventos Hoje",
      value: kpiData.eventosHoje.toString(),
      change: "Agendados",
      isPositive: true,
      icon: CalendarBlank,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      href: "/agenda"
    }
  ];

  const chartData = [
    { day: "Seg", value: 35 },
    { day: "Ter", value: 45 },
    { day: "Qua", value: 30 },
    { day: "Qui", value: 65 },
    { day: "Sex", value: 85 },
    { day: "Sáb", value: 120 },
    { day: "Dom", value: 90 },
  ];
  const maxChartValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-6 pb-12">
      
      {/* KPIs (Top Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.bg} ${kpi.color} ${kpi.border}`}>
                  <Icon size={24} weight="fill" />
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{kpi.value}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{kpi.title}</p>
              </div>

              <Link href={kpi.href} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-slate-50/80 to-transparent flex items-end justify-end p-4">
                <div className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:text-brand hover:border-blue-300 transition-colors">
                  <CaretRight size={16} weight="bold" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Crescimento da Base (Leads)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Novos contatos captados nos últimos 7 dias</p>
              </div>
              <Link href="/leads" className="text-sm font-bold text-brand hover:text-brand-hover hover:underline">Ver CRM completo</Link>
            </div>

            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-4">
              {chartData.map((d, i) => {
                const heightPercentage = (d.value / maxChartValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex justify-center relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                        {d.value} leads
                      </div>
                      
                      {/* Bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1), ease: "easeOut" }}
                        className="w-full max-w-[48px] bg-blue-100 border border-blue-200 group-hover:bg-blue-500 group-hover:border-brand rounded-t-md transition-colors relative overflow-hidden"
                      >
                        {/* Shimmer effect inside bar */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent"></div>
                      </motion.div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 dark:text-slate-200 transition-colors uppercase tracking-wider">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Demandas Críticas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <WarningCircle size={20} weight="fill" className="text-orange-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Demandas Críticas (Últimas 24h)</h2>
              </div>
              <Link href="/demandas" className="text-sm font-bold text-brand hover:text-brand-hover">Ver todas</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {demandasCriticas.length === 0 ? (
                <p className="p-5 text-sm text-slate-500 text-center">Nenhuma demanda crítica recente.</p>
              ) : (
                demandasCriticas.map((demanda, i) => (
                  <div key={demanda.id || i} className="p-5 hover:bg-slate-50 dark:bg-slate-800 transition-colors flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <MapPin size={20} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-500/20">{demanda.bairro || 'Sem Bairro'}</span>
                        <span className="text-xs font-bold text-slate-400">{demanda.categoria}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">{demanda.descricao}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Reportado por <span className="font-bold text-slate-700 dark:text-slate-200">{demanda.cidadao_nome || 'Desconhecido'}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (col-span-1) */}
        <div className="space-y-6">
          
          {/* Agenda Hoje */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarBlank size={20} className="text-purple-600" weight="fill" />
                Agenda de Hoje
              </h2>
            </div>
            <div className="p-5 space-y-6 relative">
              {/* Linha do tempo visual */}
              <div className="absolute left-[31px] top-8 bottom-8 w-0.5 bg-slate-100 z-0"></div>
              
              {agendaHoje.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum evento hoje.</p>
              ) : (
                agendaHoje.map((evento) => (
                  <div key={evento.id} className="relative z-10 flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white mb-1"></div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{evento.data_inicio ? new Date(evento.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-purple-300 transition-colors cursor-pointer group">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-purple-700 transition-colors">{evento.titulo}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin size={14} /> {evento.local || 'Local não informado'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl text-center">
              <Link href="/agenda" className="text-sm font-bold text-brand hover:text-brand-hover">Ver Calendário Completo</Link>
            </div>
          </motion.div>

          {/* Mural de Avisos */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden"
          >
            {/* Decoração bg */}
            <Megaphone size={120} weight="duotone" className="absolute -bottom-6 -right-6 text-white/10 rotate-[-15deg]" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-200 mb-2">
                <Megaphone size={20} weight="fill" />
                <span className="text-sm font-bold uppercase tracking-wider">Aviso da Coordenação</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Reunião de Alinhamento Semanal</h3>
              <p className="text-blue-100 text-sm mb-4">
                Lembrete a toda equipe: amanhã (Segunda) às 08h teremos nossa reunião de balanço da semana e definição de metas. Não atrasem.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-200 bg-black/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Clock size={14} /> Postado há 2 horas
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}



