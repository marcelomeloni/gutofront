"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
  MapPin,
  MagnifyingGlass,
  Funnel,
  Plus,
  Buildings,
  Users,
  Star,
  Target,
  User,
  Clock,
  ArrowRight,
  Trash,
  ChartBar,
  WarningCircle,
  CheckCircle,
  Table,
  SquaresFour,
  X
} from "@phosphor-icons/react";
import toast, { Toaster } from "react-hot-toast";

type BairroStatus = 'Não Iniciado' | 'Em Mapeamento' | 'Em Aproximação' | 'Ativo' | 'Consolidado' | 'Suspenso';
type Priority = 'Baixa' | 'Normal' | 'Alta';

interface Bairro {
  id: string;
  name: string;
  region: string;
  priority: Priority;
  status: BairroStatus;
  contacts: number;
  leaders: number;
  goal: number;
  responsible: string;
  lastAction: string;
}

// --- Schemas ---

const bairroSchema = z.object({
  nome: z.string().min(2, "Nome do bairro é obrigatório"),
  regiao: z.string().optional(),
  prioridade: z.enum(["Baixa", "Normal", "Alta"]),
  status: z.enum(["Não Iniciado", "Em Mapeamento", "Em Aproximação", "Ativo", "Consolidado", "Suspenso"]),
  meta: z.number().min(0).optional(),
  responsavel_id: z.string().optional(),
});

type BairroForm = z.infer<typeof bairroSchema>;

const municipioSchema = z.object({
  nome: z.string().min(2, "Nome do município é obrigatório"),
  regiao: z.string().optional(),
});

type MunicipioForm = z.infer<typeof municipioSchema>;

// Helper to normalize API response to frontend interface
function normalizeBairro(b: any): Bairro {
  return {
    id: b.id,
    name: b.nome || b.name || "",
    region: b.regiao || b.region || "",
    priority: (b.prioridade || b.priority || "Normal") as Priority,
    status: (b.status || "Não Iniciado") as BairroStatus,
    contacts: b.contatos_base || b.contacts || 0,
    leaders: b.lideres || b.leaders || 0,
    goal: b.meta || b.goal || 0,
    responsible: b.responsavel_id || b.responsible || "Não definido",
    lastAction: b.ultima_acao || b.lastAction || "Sem registro",
  };
}

export default function BairrosPage() {
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalBairro, setModalBairro] = useState(false);
  const [modalMunicipio, setModalMunicipio] = useState(false);

  const formBairro = useForm<BairroForm>({
    resolver: zodResolver(bairroSchema),
    defaultValues: { prioridade: "Normal", status: "Não Iniciado", meta: 0 },
  });

  const formMunicipio = useForm<MunicipioForm>({
    resolver: zodResolver(municipioSchema),
  });

  const stats = {
    total: bairros.length,
    notStarted: bairros.filter(b => b.status === "Não Iniciado").length,
    active: bairros.filter(b => b.status === "Ativo" || b.status === "Consolidado").length,
    pendingReturn: 0,
  };

  const getStatusColor = (status: BairroStatus) => {
    switch (status) {
      case 'Não Iniciado': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Em Mapeamento': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50';
      case 'Em Aproximação': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'Ativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Consolidado': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50';
      case 'Suspenso': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      case 'Normal': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'Baixa': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  const fetchBairros = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/bairros');
      setBairros(Array.isArray(data) ? data.map(normalizeBairro) : []);
    } catch (error) {
      toast.error("Erro ao carregar bairros.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBairros();
  }, []);

  const deleteBairro = async (id: string) => {
    try {
      await api.delete(`/bairros/${id}`);
      setBairros(bairros.filter(b => b.id !== id));
      toast.success("Bairro removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover bairro.");
    }
  };

  const onAddBairro = async (data: BairroForm) => {
    try {
      const payload = {
        nome: data.nome,
        regiao: data.regiao || null,
        prioridade: data.prioridade,
        status: data.status,
        meta: data.meta || 0,
        contatos_base: 0,
        lideres: 0,
      };
      const result = await api.post('/bairros', payload);
      setBairros(prev => [normalizeBairro(result), ...prev]);
      toast.success("Bairro cadastrado com sucesso!");
      setModalBairro(false);
      formBairro.reset();
    } catch (error) {
      toast.error("Erro ao cadastrar bairro.");
    }
  };

  const onAddMunicipio = async (data: MunicipioForm) => {
    try {
      // Município is registered as a bairro with a special region marker
      const payload = {
        nome: data.nome,
        regiao: data.regiao || "Município",
        prioridade: "Normal",
        status: "Não Iniciado",
        meta: 0,
        contatos_base: 0,
        lideres: 0,
      };
      const result = await api.post('/bairros', payload);
      setBairros(prev => [normalizeBairro(result), ...prev]);
      toast.success("Município cadastrado com sucesso!");
      setModalMunicipio(false);
      formMunicipio.reset();
    } catch (error) {
      toast.error("Erro ao cadastrar município.");
    }
  };

  const filteredBairros = bairros.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster position="top-right" />
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-brand rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={24} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Bairros</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center shrink-0">
            <ChartBar size={24} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Não Iniciados</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.notStarted}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle size={24} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bairros Ativos</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg flex items-center justify-center shrink-0">
            <WarningCircle size={24} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Retornos Pendentes</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingReturn}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar bairro..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 border rounded-lg transition-colors flex items-center justify-center shrink-0 ${isFilterOpen ? 'bg-blue-50 text-brand border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
          >
            <Funnel size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
            >
              <SquaresFour size={18} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
            >
              <Table size={18} />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setModalMunicipio(true)}
              className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Buildings size={18} />
              Novo Município
            </button>
            <button 
              onClick={() => setModalBairro(true)}
              className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              Novo Bairro
            </button>
          </div>
        </div>
      </div>

      {/* Filters Expansion */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Operacional</label>
                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand">
                  <option>Qualquer Status</option>
                  <option>Não Iniciado</option>
                  <option>Em Mapeamento</option>
                  <option>Ativo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridade</label>
                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand">
                  <option>Qualquer Prioridade</option>
                  <option>Alta</option>
                  <option>Normal</option>
                  <option>Baixa</option>
                </select>
              </div>
              <div className="space-y-3 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4" />
                  Apenas c/ Lideranças
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4" />
                  Ação Vencida
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-white pb-2">
        <Buildings size={24} className="text-blue-500" />
        Territórios Mapeados
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">Carregando bairros...</div>
      ) : filteredBairros.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <MapPin size={48} weight="duotone" className="text-slate-300 mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum bairro encontrado.</p>
          <p className="text-sm text-slate-400">Clique em "Novo Bairro" para começar o mapeamento.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredBairros.map(bairro => {
              const percent = bairro.goal > 0 ? Math.round((bairro.contacts / bairro.goal) * 100) : 0;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={bairro.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{bairro.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={14} /> Região: {bairro.region || "Não definida"}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(bairro.status)}`}>
                        {bairro.status}
                      </span>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getPriorityColor(bairro.priority)} border-current/20`}>
                        Prioridade {bairro.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Users size={14}/> Contatos</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{bairro.contacts}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Star size={14} className="text-yellow-500"/> Líderes</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{bairro.leaders}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1"><Target size={16}/> Meta</span>
                        <span className="font-bold text-slate-800 dark:text-white">{percent}% ({bairro.contacts}/{bairro.goal})</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${percent > 70 ? 'bg-green-500' : percent > 30 ? 'bg-blue-500' : 'bg-slate-400'}`} 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 space-y-3">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 mb-1">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium truncate">{bairro.responsible}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate text-xs">{bairro.lastAction}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 hover:border-blue-400 hover:text-brand text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                        <MagnifyingGlass size={16} /> Ficha
                      </button>
                      <button 
                        onClick={() => deleteBairro(bairro.id)}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800/50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors shadow-sm"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Bairro e Região</th>
                  <th className="px-6 py-4">Status e Prioridade</th>
                  <th className="px-6 py-4">Líderes e Contatos</th>
                  <th className="px-6 py-4">Meta</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBairros.map(bairro => {
                  const percent = bairro.goal > 0 ? Math.round((bairro.contacts / bairro.goal) * 100) : 0;
                  return (
                    <motion.tr layout key={bairro.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-white">{bairro.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{bairro.region}</p>
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(bairro.status)}`}>
                            {bairro.status}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(bairro.priority).split(' ')[0]}`}>
                            Prior. {bairro.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5" title="Líderes">
                            <Star size={16} className="text-yellow-500" weight="fill" />
                            <span className="font-semibold">{bairro.leaders}</span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Contatos Base">
                            <Users size={16} className="text-blue-500" />
                            <span className="font-semibold">{bairro.contacts}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{percent}%</span>
                          <span className="text-slate-500 dark:text-slate-400">{bairro.contacts}/{bairro.goal}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percent > 70 ? 'bg-green-500' : percent > 30 ? 'bg-blue-500' : 'bg-slate-400'}`} 
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-xs">{bairro.responsible}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[150px]" title={bairro.lastAction}>{bairro.lastAction}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-brand hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50">
                            <ArrowRight size={18} />
                          </button>
                          <button 
                            onClick={() => deleteBairro(bairro.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800/50"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== MODALS ======================== */}
      <AnimatePresence>

        {/* Modal: Novo Bairro */}
        {modalBairro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalBairro(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/20 text-brand rounded-lg flex items-center justify-center">
                    <MapPin size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Bairro</h2>
                </div>
                <button onClick={() => setModalBairro(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2"><X size={24} /></button>
              </div>

              <form onSubmit={formBairro.handleSubmit(onAddBairro)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Bairro*</label>
                  <input
                    {...formBairro.register("nome")}
                    placeholder="Ex: Centro, Vila Nova..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                  {formBairro.formState.errors.nome && <p className="text-red-500 text-xs">{formBairro.formState.errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Região / Zona</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <input
                    {...formBairro.register("regiao")}
                    placeholder="Ex: Zona Norte, Centro-Oeste..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Prioridade*</label>
                    <select {...formBairro.register("prioridade")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white">
                      <option value="Baixa">Baixa</option>
                      <option value="Normal">Normal</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Status*</label>
                    <select {...formBairro.register("status")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white">
                      <option value="Não Iniciado">Não Iniciado</option>
                      <option value="Em Mapeamento">Em Mapeamento</option>
                      <option value="Em Aproximação">Em Aproximação</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Consolidado">Consolidado</option>
                      <option value="Suspenso">Suspenso</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Meta de Contatos</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <input
                    {...formBairro.register("meta", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="Ex: 500"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalBairro(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">Salvar Bairro</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Novo Município */}
        {modalMunicipio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalMunicipio(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Buildings size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Município</h2>
                </div>
                <button onClick={() => setModalMunicipio(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2"><X size={24} /></button>
              </div>

              <form onSubmit={formMunicipio.handleSubmit(onAddMunicipio)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Município*</label>
                  <input
                    {...formMunicipio.register("nome")}
                    placeholder="Ex: Limeira, Americana..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                  {formMunicipio.formState.errors.nome && <p className="text-red-500 text-xs">{formMunicipio.formState.errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Estado / UF</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <input
                    {...formMunicipio.register("regiao")}
                    placeholder="Ex: SP, MG..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalMunicipio(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm">Salvar Município</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
