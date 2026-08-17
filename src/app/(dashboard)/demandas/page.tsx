"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  ClipboardText,
  Plus,
  X,
  Trash,
  MagnifyingGlass,
  MapPin,
  CheckCircle,
  WarningCircle,
  Clock,
  Megaphone,
  ChartBar,
  WhatsappLogo,
  User,
  Funnel
} from "@phosphor-icons/react";

// --- Schemas ---

const demandaSchema = z.object({
  cidadaoNome: z.string().min(2, "Nome é obrigatório"),
  cidadaoTelefone: z.string().min(10, "Telefone inválido"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  categoria: z.string().min(1, "Selecione a categoria"),
  descricao: z.string().min(5, "Descreva a demanda (min. 5 caracteres)"),
  status: z.enum(["Nova", "Em Análise", "Oficiada", "Resolvida"]),
});

type DemandaForm = z.infer<typeof demandaSchema>;

interface DemandaItem extends DemandaForm {
  id: string;
  dataCriacao: string;
  origem: "Site/Gabinete Virtual" | "Inserção Manual";
}

const STATUS_PIPELINE: ("Nova" | "Em Análise" | "Oficiada" | "Resolvida")[] = ["Nova", "Em Análise", "Oficiada", "Resolvida"];

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<DemandaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemandas = async () => {
      try {
        const data = await api.demandas.getAll();
        setDemandas(data.map((d: any) => ({
          id: d.id,
          cidadaoNome: d.cidadao_nome || d.leads?.nome || '',
          cidadaoTelefone: d.cidadao_telefone || d.leads?.telefone || '',
          bairro: d.bairro || '',
          categoria: d.categoria || '',
          descricao: d.descricao || '',
          status: d.status || 'Nova',
          origem: d.origem || 'Inserção Manual',
          dataCriacao: d.created_at
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar demandas: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDemandas();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailDemanda, setDetailDemanda] = useState<DemandaItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const form = useForm<DemandaForm>({
    resolver: zodResolver(demandaSchema),
    defaultValues: {
      status: "Nova"
    }
  });

  const onSubmit = async (data: DemandaForm) => {
    try {
      const payload = {
        cidadao_nome: data.cidadaoNome,
        cidadao_telefone: data.cidadaoTelefone,
        bairro: data.bairro,
        categoria: data.categoria,
        descricao: data.descricao,
        status: data.status,
        origem: 'Inserção Manual'
      };
      const created = await api.demandas.create(payload);
      const newItem: DemandaItem = {
        id: created.id,
        cidadaoNome: created.cidadao_nome,
        cidadaoTelefone: created.cidadao_telefone,
        bairro: created.bairro,
        categoria: created.categoria,
        descricao: created.descricao,
        status: created.status || 'Nova',
        origem: 'Inserção Manual',
        dataCriacao: created.created_at
      };
      setDemandas([newItem, ...demandas]);
      toast.success('Demanda registrada!');
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const deleteDemanda = async (id: string) => {
    try {
      await api.demandas.remove(id);
      setDemandas(demandas.filter(d => d.id !== id));
      setDetailDemanda(null);
      toast.success('Demanda excluída.');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const changeStatus = async (id: string, newStatus: "Nova" | "Em Análise" | "Oficiada" | "Resolvida") => {
    try {
      await api.demandas.updateStatus(id, newStatus);
      setDemandas(demandas.map(d => d.id === id ? { ...d, status: newStatus } : d));
      toast.success(`Status alterado para ${newStatus}`);
      if (detailDemanda?.id === id) {
        setDetailDemanda(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  const filteredDemandas = demandas.filter(d => {
    const matchSearch = 
      d.cidadaoNome.toLowerCase().includes(search.toLowerCase()) || 
      d.descricao.toLowerCase().includes(search.toLowerCase()) ||
      d.bairro.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? d.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const stats = {
    total: demandas.length,
    resolvidas: demandas.filter(d => d.status === "Resolvida").length,
    oficiadas: demandas.filter(d => d.status === "Oficiada").length,
    topBairro: "Centro", // Mock calculated
    topCategoria: "Infraestrutura" // Mock calculated
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Resolvida": return { icon: CheckCircle, color: "text-green-700 bg-green-100 border-green-200" };
      case "Oficiada": return { icon: Megaphone, color: "text-orange-700 bg-orange-100 border-orange-200" };
      case "Em Análise": return { icon: Clock, color: "text-yellow-700 bg-yellow-100 border-yellow-200" };
      case "Nova": return { icon: WarningCircle, color: "text-blue-700 bg-blue-100 border-blue-200" };
      default: return { icon: ClipboardText, color: "text-slate-700 dark:text-slate-200 bg-slate-100 border-slate-200 dark:border-slate-700" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Registrar Demanda Manual
        </button>
      </div>

      {/* Dashboard de Inteligência */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold mb-1">
              <ClipboardText size={18} />
              <span className="text-sm">Total Registrado</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-orange-600 font-bold mb-1">
              <Megaphone size={18} weight="fill" />
              <span className="text-sm">Ações em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.oficiadas}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-red-500 font-bold mb-1">
            <ChartBar size={18} />
            <span className="text-sm">Bairro Crítico</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{stats.topBairro}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-blue-500 font-bold mb-1">
            <WarningCircle size={18} />
            <span className="text-sm">Categoria Mais Pedida</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{stats.topCategoria}</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cidadão, bairro ou descrição..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand text-sm"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:border-brand text-slate-600 dark:text-slate-300"
        >
          <option value="">Todos os Status</option>
          <option value="Nova">Novas</option>
          <option value="Em Análise">Em Análise</option>
          <option value="Oficiada">Oficiada</option>
          <option value="Resolvida">Resolvida</option>
        </select>
      </div>

      {/* Tabela de Demandas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Demanda & Localização</th>
                <th className="px-6 py-4">Cidadão (Lead)</th>
                <th className="px-6 py-4">Status da Ação</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {filteredDemandas.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="py-16 text-center text-slate-500 dark:text-slate-400">
                      <ClipboardText size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhuma demanda encontrada.</p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredDemandas.map((demanda) => {
                    const { icon: StatusIcon, color: statusColor } = getStatusConfig(demanda.status);
                    
                    return (
                      <motion.tr 
                        layout 
                        key={demanda.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4 max-w-sm">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand mb-1 uppercase tracking-wider">
                            {demanda.categoria}
                          </div>
                          <p className="text-slate-800 dark:text-white font-medium mb-2 line-clamp-2" title={demanda.descricao}>
                            {demanda.descricao}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              <MapPin size={14} className="text-slate-400" /> {demanda.bairro}
                            </span>
                            <span className="text-slate-400">&bull; {format(new Date(demanda.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <User size={16} weight="fill" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white group-hover:text-brand transition-colors cursor-pointer">{demanda.cidadaoNome}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <WhatsappLogo size={12} className="text-green-500" /> {demanda.cidadaoTelefone}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <select 
                            value={demanda.status}
                            onChange={(e) => changeStatus(demanda.id, e.target.value as "Nova" | "Em Análise" | "Oficiada" | "Resolvida")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer appearance-none ${statusColor}`}
                          >
                            <option value="Nova">🔵 Nova</option>
                            <option value="Em Análise">⏳ Em Análise</option>
                            <option value="Oficiada">📢 Oficiada</option>
                            <option value="Resolvida">✅ Resolvida</option>
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            <button 
                              onClick={() => setDetailDemanda(demanda)}
                              className="px-3 py-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand hover:text-black rounded-lg border border-brand/20 hover:border-brand transition-all flex items-center gap-1"
                            >
                              Ver / Agir
                            </button>
                            <button 
                              onClick={() => deleteDemanda(demanda.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-transparent transition-colors"
                              title="Excluir"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Action Side Panel */}
      <AnimatePresence>
        {detailDemanda && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailDemanda(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl flex flex-col h-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detalhes da Demanda</h2>
                <button onClick={() => setDetailDemanda(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Categoria */}
                <div>
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">{detailDemanda.categoria}</span>
                  <p className="text-base text-slate-800 dark:text-white font-medium mt-2">{detailDemanda.descricao}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-3">
                    <MapPin size={16} className="text-slate-400" />
                    {detailDemanda.bairro}
                    <span className="text-slate-400">&bull;</span>
                    {format(new Date(detailDemanda.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>

                {/* Cidadão */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Cidadão</label>
                  <div className="font-bold text-slate-800 dark:text-white">{detailDemanda.cidadaoNome}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <WhatsappLogo size={14} className="text-green-500" /> {detailDemanda.cidadaoTelefone}
                  </div>
                </div>

                {/* Pipeline de Status */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">Pipeline de Status</label>
                  <div className="flex gap-2">
                    {STATUS_PIPELINE.map((stage) => {
                      const isActive = detailDemanda.status === stage;
                      const isPast = STATUS_PIPELINE.indexOf(stage) < STATUS_PIPELINE.indexOf(detailDemanda.status);
                      const config = getStatusConfig(stage);
                      const StIcon = config.icon;
                      
                      return (
                        <button 
                          key={stage}
                          onClick={() => changeStatus(detailDemanda.id, stage)}
                          className={`flex-1 py-3 px-1 rounded-lg text-[10px] font-bold text-center border-2 transition-all ${
                            isActive 
                              ? `${config.color} border-current shadow-md scale-105` 
                              : isPast 
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand hover:text-brand"
                          }`}
                        >
                          <StIcon size={18} weight={isActive ? "fill" : "regular"} className="mx-auto mb-1" />
                          {stage}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                {STATUS_PIPELINE.indexOf(detailDemanda.status) < STATUS_PIPELINE.length - 1 && (
                  <button 
                    onClick={() => {
                      const nextIdx = STATUS_PIPELINE.indexOf(detailDemanda.status) + 1;
                      changeStatus(detailDemanda.id, STATUS_PIPELINE[nextIdx]);
                    }}
                    className="flex-1 bg-brand hover:bg-brand-hover text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Avançar para {STATUS_PIPELINE[STATUS_PIPELINE.indexOf(detailDemanda.status) + 1]}
                  </button>
                )}
                <button 
                  onClick={() => { deleteDemanda(detailDemanda.id); setDetailDemanda(null); }}
                  className="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                >
                  <Trash size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Registrar Demanda */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <ClipboardText size={20} weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Demanda</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Isso criará automaticamente um Lead no sistema.</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dados do Cidadão (Lead)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Solicitante*</label>
                      <input 
                        {...form.register("cidadaoNome")}
                        placeholder="Ex: João da Silva"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm"
                      />
                      {form.formState.errors.cidadaoNome && <p className="text-red-500 text-xs">{form.formState.errors.cidadaoNome.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200">WhatsApp de Contato*</label>
                      <input 
                        {...form.register("cidadaoTelefone")}
                        placeholder="(DD) 90000-0000"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm"
                      />
                      {form.formState.errors.cidadaoTelefone && <p className="text-red-500 text-xs">{form.formState.errors.cidadaoTelefone.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Bairro / Local da Demanda*</label>
                  <input 
                    {...form.register("bairro")}
                    placeholder="Ex: Jardim Primavera"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm"
                  />
                  {form.formState.errors.bairro && <p className="text-red-500 text-xs">{form.formState.errors.bairro.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Categoria Principal*</label>
                    <select 
                      {...form.register("categoria")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm"
                    >
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Segurança Pública">Segurança Pública</option>
                      <option value="Educação">Educação</option>
                      <option value="Iluminação e Limpeza">Iluminação e Limpeza</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Status Interno Inicial*</label>
                    <select 
                      {...form.register("status")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm font-medium"
                    >
                      <option value="Nova">Nova</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Oficiada">Oficiada</option>
                      <option value="Resolvida">Resolvida</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Descrição do Problema*</label>
                  <textarea 
                    {...form.register("descricao")}
                    rows={3}
                    placeholder="Descreva o que o cidadão está solicitando..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm resize-none"
                  />
                  {form.formState.errors.descricao && <p className="text-red-500 text-xs">{form.formState.errors.descricao.message}</p>}
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm"
                  >
                    Registrar e Criar Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




