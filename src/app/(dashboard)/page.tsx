"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { format, isToday, parseISO, subDays, isAfter } from "date-fns";
import {
  UsersThree,
  CurrencyCircleDollar,
  ClipboardText,
  CalendarBlank,
  MapPin,
  Clock,
  WarningCircle,
  Megaphone,
  CaretRight
} from "@phosphor-icons/react";
import Link from "next/link";

export default function Home() {
  const [metrics, setMetrics] = useState({
    leadsCount: "0",
    saldo: "R$ 0,00",
    demandasAbertas: "0",
    eventosHoje: "0"
  });

  const [chartData, setChartData] = useState([
    { day: "Seg", value: 0 },
    { day: "Ter", value: 0 },
    { day: "Qua", value: 0 },
    { day: "Qui", value: 0 },
    { day: "Sex", value: 0 },
    { day: "Sáb", value: 0 },
    { day: "Dom", value: 0 },
  ]);

  const [agendaHoje, setAgendaHoje] = useState<any[]>([]);
  const [demandasCriticas, setDemandasCriticas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [leads, financas, demandas, agenda] = await Promise.all([
          api.get('/leads').catch(() => []),
          api.get('/financeiro').catch(() => []),
          api.get('/demandas').catch(() => []),
          api.get('/agenda').catch(() => [])
        ]);

        // 1. Leads Convertidos
        const leadsArray = Array.isArray(leads) ? leads : [];
        const leadsCount = leadsArray.length;

        // Chart Data (Last 7 days leads)
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = subDays(new Date(), 6 - i);
          return { day: days[d.getDay()], value: 0, date: d };
        });

        leadsArray.forEach(lead => {
          if (!lead.created_at) return;
          const leadDate = new Date(lead.created_at);
          const sevenDaysAgo = subDays(new Date(), 7);
          if (isAfter(leadDate, sevenDaysAgo)) {
            const dayName = days[leadDate.getDay()];
            const bucket = last7Days.find(d => d.day === dayName);
            if (bucket) bucket.value++;
          }
        });
        setChartData(last7Days);

        // 2. Saldo
        const financasArray = Array.isArray(financas) ? financas : [];
        const saldo = financasArray.reduce((acc, curr) => {
          if (curr.tipo === "Receita (Entrada)" || curr.tipo === "Entrada") return acc + Number(curr.valor || 0);
          return acc - Number(curr.valor || 0);
        }, 0);

        // 3. Demandas
        const demandasArray = Array.isArray(demandas) ? demandas : [];
        const abertas = demandasArray.filter(d => d.status !== "Resolvida").length;
        setDemandasCriticas(demandasArray.slice(0, 3)); // Pegar últimas 3

        // 4. Agenda
        const agendaArray = Array.isArray(agenda) ? agenda : [];
        const hojeEvents = agendaArray.filter(a => a.data_inicio && isToday(parseISO(a.data_inicio)));
        setAgendaHoje(hojeEvents);

        setMetrics({
          leadsCount: leadsCount.toString(),
          saldo: `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          demandasAbertas: abertas.toString(),
          eventosHoje: hojeEvents.length.toString()
        });

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const kpis = [
    {
      id: 1,
      title: "Leads Convertidos",
      value: metrics.leadsCount,
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
      value: metrics.saldo,
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
      value: metrics.demandasAbertas,
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
      value: metrics.eventosHoje,
      change: "Agendados",
      isPositive: true,
      icon: CalendarBlank,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      href: "/agenda"
    }
  ];

  const maxChartValue = Math.max(...chartData.map(d => d.value), 10); // Minimum 10 to avoid dividing by zero

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Carregando painel dinâmico...</div>;
  }

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
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <WarningCircle size={20} weight="fill" className="text-orange-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Últimas Demandas Registradas</h2>
              </div>
              <Link href="/demandas" className="text-sm font-bold text-brand hover:text-brand-hover">Ver todas</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {demandasCriticas.length === 0 && <div className="p-5 text-slate-500 text-sm">Nenhuma demanda registrada ainda.</div>}
              {demandasCriticas.map((demanda, i) => (
                <div key={i} className="p-5 hover:bg-slate-50 dark:bg-slate-800 transition-colors flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} weight="fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{demanda.bairro || 'Sem Bairro'}</span>
                      <span className="text-xs font-bold text-slate-400">{demanda.categoria}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">{demanda.descricao}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Reportado por <span className="font-bold text-slate-700 dark:text-slate-200">{demanda.cidadao_nome || 'Anônimo'}</span></p>
                  </div>
                </div>
              ))}
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
              {agendaHoje.length === 0 && <div className="text-slate-500 text-sm">Sem eventos programados para hoje.</div>}
              {agendaHoje.length > 0 && <div className="absolute left-[31px] top-8 bottom-8 w-0.5 bg-slate-100 z-0"></div>}
              
              {agendaHoje.map((evento) => (
                <div key={evento.id} className="relative z-10 flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white mb-1"></div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{format(parseISO(evento.data_inicio), "HH:mm")}</span>
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-purple-300 transition-colors cursor-pointer group">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-purple-700 transition-colors">{evento.titulo}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin size={14} /> {evento.localizacao}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 rounded-b-xl text-center">
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
              <h3 className="text-lg font-bold mb-2">Sistema Atualizado</h3>
              <p className="text-blue-100 text-sm mb-4">
                Agora o dashboard carrega todos os dados em tempo real diretamente do banco de dados!
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-200 bg-black/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Clock size={14} /> Agora
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
