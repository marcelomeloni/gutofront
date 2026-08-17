"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  UsersThree,
  Plus,
  X,
  Trash,
  MagnifyingGlass,
  WhatsappLogo,
  UserPlus,
  Megaphone,
  MapPin,
  Funnel,
  Star,
  Fire,
  UserFocus,
  Handshake,
  CaretUp,
  CaretDown,
  ArrowRight,
  Eye,
  LockKey
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// --- Schemas ---

const leadSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  telefone: z.string().min(10, "Telefone inválido"),
  bairro: z.string().optional(),
  origem: z.string().min(1, "Selecione a origem"),
  engajamento: z.enum(["Frio", "Simpatizante", "Apoiador"]),
  observacoes: z.string().optional()
});

type LeadForm = z.infer<typeof leadSchema>;

interface LeadItem extends LeadForm {
  id: string;
  created_at: string;
}

const ENGAJAMENTO_PIPELINE: ("Frio" | "Simpatizante" | "Apoiador")[] = ["Frio", "Simpatizante", "Apoiador"];

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<LeadItem | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      origem: "WhatsApp",
      engajamento: "Frio"
    }
  });

  if (user && user.role !== "admin" && user.role !== "operacional") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
          <LockKey size={40} weight="duotone" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Acesso Negado</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Sua função atual (<span className="font-bold text-slate-700 dark:text-slate-300">{user.role}</span>) não permite acessar a base de Leads. O acesso é restrito apenas para as funções Admin e Operacional.
        </p>
      </div>
    );
  }

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/leads');
      setLeads(data || []);
    } catch (error) {
      toast.error("Erro ao carregar contatos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onSubmit = async (data: LeadForm) => {
    try {
      const payload = {
        ...data,
        captado_por: user?.id
      };
      const response = await api.post('/leads', payload);
      setLeads([response, ...leads]);
      toast.success("Contato cadastrado com sucesso!");
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Erro ao salvar contato.");
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await api.delete(`/leads/${id}`);
      setLeads(leads.filter(l => l.id !== id));
      setDetailLead(null);
      toast.success("Contato removido da base");
    } catch (error) {
      toast.error("Erro ao remover contato.");
    }
  };

  const changeEngajamento = async (id: string, newEngajamento: "Frio" | "Simpatizante" | "Apoiador") => {
    try {
      // Assumindo que a API aceita atualizações com o mesmo formato
      await api.put(`/leads/${id}/engajamento`, { engajamento: newEngajamento });
      setLeads(leads.map(l => l.id === id ? { ...l, engajamento: newEngajamento } : l));
      const labels: Record<string, string> = {
        "Frio": "❄️ Frio",
        "Simpatizante": "⭐ Simpatizante",
        "Apoiador": "🤝 Apoiador"
      };
      toast.success(`Status alterado para ${labels[newEngajamento]}`);
      if (detailLead?.id === id) {
        setDetailLead(prev => prev ? { ...prev, engajamento: newEngajamento } : null);
      }
    } catch (error) {
      toast.error("Erro ao atualizar engajamento.");
    }
  };

  const promoteEngajamento = (lead: LeadItem) => {
    const currentIndex = ENGAJAMENTO_PIPELINE.indexOf(lead.engajamento);
    if (currentIndex < ENGAJAMENTO_PIPELINE.length - 1) {
      changeEngajamento(lead.id, ENGAJAMENTO_PIPELINE[currentIndex + 1]);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.nome?.toLowerCase().includes(search.toLowerCase()) || 
    l.telefone?.includes(search) || 
    l.bairro?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: leads.length,
    frios: leads.filter(l => l.engajamento === "Frio").length,
    simpatizantes: leads.filter(l => l.engajamento === "Simpatizante").length,
    apoiadores: leads.filter(l => l.engajamento === "Apoiador").length,
  };

  const getEngajamentoConfig = (eng: string) => {
    switch (eng) {
      case "Apoiador": return { icon: Handshake, color: "text-green-700 bg-green-100 border-green-200", btnColor: "bg-green-500 hover:bg-green-600 text-white" };
      case "Simpatizante": return { icon: Star, color: "text-yellow-700 bg-yellow-100 border-yellow-200", btnColor: "bg-yellow-500 hover:bg-yellow-600 text-black" };
      case "Frio": return { icon: Fire, color: "text-blue-700 bg-blue-100 border-blue-200", btnColor: "bg-blue-500 hover:bg-blue-600 text-white" };
      default: return { icon: Fire, color: "text-slate-600 bg-slate-100 border-slate-200", btnColor: "bg-slate-500 hover:bg-slate-600 text-white" };
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Novo Contato
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold mb-1">
            <UsersThree size={18} />
            <span className="text-xs">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-blue-500 font-bold mb-1">
            <Fire size={18} weight="fill" />
            <span className="text-xs">Frios</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.frios}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-brand font-bold mb-1">
            <Star size={18} weight="fill" />
            <span className="text-xs">Simpatizantes</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.simpatizantes}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-5 border border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-1">
            <Handshake size={18} weight="fill" />
            <span className="text-xs">Apoiadores</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.apoiadores}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou bairro..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand text-sm"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Engajamento</th>
                <th className="px-6 py-4">Localização / Origem</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence>
                {isLoading ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="py-16 text-center text-slate-500 dark:text-slate-400">
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Carregando...</p>
                    </td>
                  </motion.tr>
                ) : filteredLeads.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="py-16 text-center text-slate-500 dark:text-slate-400">
                      <UsersThree size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum contato encontrado.</p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const { icon: EngIcon, color: engColor } = getEngajamentoConfig(lead.engajamento);
                    const canPromote = ENGAJAMENTO_PIPELINE.indexOf(lead.engajamento) < ENGAJAMENTO_PIPELINE.length - 1;
                    const nextStatus = canPromote ? ENGAJAMENTO_PIPELINE[ENGAJAMENTO_PIPELINE.indexOf(lead.engajamento) + 1] : null;
                    
                    return (
                      <motion.tr 
                        layout 
                        key={lead.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-white text-base">{lead.nome}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <WhatsappLogo size={14} className="text-green-500" />
                            {lead.telefone}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <select 
                            value={lead.engajamento}
                            onChange={(e) => changeEngajamento(lead.id, e.target.value as "Frio" | "Simpatizante" | "Apoiador")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer appearance-none ${engColor}`}
                          >
                            <option value="Frio">❄️ Frio</option>
                            <option value="Simpatizante">⭐ Simpatizante</option>
                            <option value="Apoiador">🤝 Apoiador</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {lead.bairro ? (
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                                <MapPin size={14} className="text-slate-400" />
                                {lead.bairro}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Bairro não informado</span>
                            )}
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                              Via {lead.origem}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            {canPromote && (
                              <button 
                                onClick={() => promoteEngajamento(lead)}
                                className="px-3 py-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand hover:text-black rounded-lg border border-brand/20 hover:border-brand transition-all flex items-center gap-1"
                                title={`Promover para ${nextStatus}`}
                              >
                                <ArrowRight size={14} weight="bold" />
                                {nextStatus}
                              </button>
                            )}
                            <button 
                              onClick={() => setDetailLead(lead)}
                              className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => deleteLead(lead.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remover Contato"
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

      {/* Detail / CRM Side Panel */}
      <AnimatePresence>
        {detailLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailLead(null)}
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
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detalhes do Lead</h2>
                <button onClick={() => setDetailLead(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Nome e contato */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{detailLead.nome}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <WhatsappLogo size={16} className="text-green-500" />
                    {detailLead.telefone}
                  </div>
                  {detailLead.bairro && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin size={16} className="text-slate-400" />
                      {detailLead.bairro}
                    </div>
                  )}
                </div>

                {/* Pipeline Visual */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">Pipeline de Engajamento</label>
                  <div className="flex gap-2">
                    {ENGAJAMENTO_PIPELINE.map((stage) => {
                      const isActive = detailLead.engajamento === stage;
                      const isPast = ENGAJAMENTO_PIPELINE.indexOf(stage) < ENGAJAMENTO_PIPELINE.indexOf(detailLead.engajamento);
                      const config = getEngajamentoConfig(stage);
                      
                      return (
                        <button 
                          key={stage}
                          onClick={() => changeEngajamento(detailLead.id, stage)}
                          className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold text-center border-2 transition-all ${
                            isActive 
                              ? `${config.btnColor} border-transparent shadow-md scale-105` 
                              : isPast 
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand hover:text-brand"
                          }`}
                        >
                          <config.icon size={20} weight={isActive ? "fill" : "regular"} className="mx-auto mb-1" />
                          {stage}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Origem</span>
                    <span className="font-medium text-slate-800 dark:text-white">{detailLead.origem}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Data de Cadastro</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {detailLead.created_at ? new Date(detailLead.created_at).toLocaleDateString("pt-BR") : '-'}
                    </span>
                  </div>
                </div>

                {/* Observações */}
                {detailLead.observacoes && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Observações</label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      {detailLead.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <a 
                  href={`https://wa.me/55${detailLead.telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(detailLead.nome.split(' ')[0])},%20tudo%20bem?`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  Chamar no WhatsApp
                </a>
                
                <div className="flex gap-3">
                  {ENGAJAMENTO_PIPELINE.indexOf(detailLead.engajamento) < ENGAJAMENTO_PIPELINE.length - 1 && (
                    <button 
                      onClick={() => promoteEngajamento(detailLead)}
                      className="flex-1 bg-brand hover:bg-brand-hover text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowRight size={18} weight="bold" />
                      Promover para {ENGAJAMENTO_PIPELINE[ENGAJAMENTO_PIPELINE.indexOf(detailLead.engajamento) + 1]}
                    </button>
                  )}
                  <button 
                    onClick={() => deleteLead(detailLead.id)}
                    className="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Lead Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/20 text-brand-hover rounded-lg flex items-center justify-center">
                    <UserPlus size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Contato</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Contato*</label>
                    <input 
                      {...form.register("nome")}
                      type="text" 
                      placeholder="Ex: Maria Oliveira"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {form.formState.errors.nome && <p className="text-red-500 text-xs">{form.formState.errors.nome.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Telefone / WhatsApp*</label>
                    <input 
                      {...form.register("telefone")}
                      type="text" 
                      placeholder="(DD) 90000-0000"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {form.formState.errors.telefone && <p className="text-red-500 text-xs">{form.formState.errors.telefone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Bairro / Região</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <input 
                    {...form.register("bairro")}
                    type="text" 
                    placeholder="Ex: Centro"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Origem da Captação*</label>
                    <select 
                      {...form.register("origem")}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white font-medium"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Rua">Rua</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Site">Site</option>
                      <option value="Indicação">Indicação</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Grau de Engajamento*</label>
                    <select 
                      {...form.register("engajamento")}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white font-medium"
                    >
                      <option value="Frio">❄️ Frio</option>
                      <option value="Simpatizante">⭐ Simpatizante</option>
                      <option value="Apoiador">🤝 Apoiador</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Observações</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <textarea 
                    {...form.register("observacoes")}
                    rows={2}
                    placeholder="Informações adicionais..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white resize-none"
                  />
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
                    Salvar Contato
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
