"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  CheckSquareOffset,
  Plus,
  X,
  Trash,
  CalendarBlank,
  UserCircle,
  WarningCircle,
  Clock,
  DotsThree,
  ArrowRight,
  ArrowLeft
} from "@phosphor-icons/react";

interface Usuario {
  id: string;
  nome: string;
  role: string;
}

// --- Schemas ---

const tarefaSchema = z.object({
  titulo: z.string().min(2, "O título é obrigatório"),
  descricao: z.string().optional(),
  responsavel: z.string().min(1, "Selecione o responsável"),
  prazo: z.string().min(1, "Defina o prazo limite"),
  prioridade: z.enum(["Alta", "Normal", "Baixa"]),
  status: z.enum(["A Fazer", "Em Progresso", "Em Revisão", "Concluída"]),
});

type TarefaForm = z.infer<typeof tarefaSchema>;

interface TarefaItem extends TarefaForm {
  id: string;
}

const COLUNAS = ["A Fazer", "Em Progresso", "Em Revisão", "Concluída"] as const;
type Coluna = typeof COLUNAS[number];

export default function TarefasPage() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaItem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTarefas = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/tarefas');
      setTarefas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const data = await api.get('/usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  useEffect(() => {
    fetchTarefas();
    fetchUsuarios();
  }, []);

  const form = useForm<TarefaForm>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      status: "A Fazer",
      prioridade: "Normal"
    }
  });

  const onSubmit = async (data: TarefaForm) => {
    try {
      const newTarefa = await api.post('/tarefas', data);
      setTarefas(prev => [newTarefa, ...prev]);
      toast.success("Tarefa criada com sucesso!");
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Erro ao criar tarefa");
    }
  };

  const deleteTarefa = async (id: string) => {
    try {
      await api.delete(`/tarefas/${id}`);
      setTarefas(tarefas.filter(t => t.id !== id));
      toast.success("Tarefa excluída");
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const moverTarefa = async (id: string, novoStatus: Coluna) => {
    try {
      await api.put(`/tarefas/${id}`, { status: novoStatus });
      setTarefas(tarefas.map(t => t.id === id ? { ...t, status: novoStatus } : t));
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao mover tarefa");
    }
  };

  const getPrioridadeColor = (prio: string) => {
    switch (prio) {
      case "Alta": return "bg-red-100 text-red-700 border-red-200";
      case "Normal": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Baixa": return "bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700";
      default: return "";
    }
  };

  const getPrazoConfig = (prazoStr: string, status: string) => {
    if (status === "Concluída") return { text: "Concluído", color: "text-slate-500 dark:text-slate-400", icon: CheckSquareOffset };
    
    const prazoDate = parseISO(prazoStr);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    const dataPrazo = new Date(prazoDate);
    dataPrazo.setHours(0,0,0,0);

    if (dataPrazo < hoje) {
      return { text: `Venceu ${format(prazoDate, 'dd/MM')}`, color: "text-red-600 font-bold", icon: WarningCircle };
    } else if (dataPrazo.getTime() === hoje.getTime()) {
      return { text: "Vence Hoje", color: "text-orange-600 font-bold", icon: Clock };
    } else {
      return { text: format(prazoDate, 'dd/MM'), color: "text-slate-500 dark:text-slate-400", icon: CalendarBlank };
    }
  };

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-6 pb-12 h-[calc(100vh-2rem)] flex flex-col">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div></div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} weight="bold" />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-5 overflow-x-auto pb-4 custom-scrollbar items-start">
        {COLUNAS.map(coluna => {
          const tarefasColuna = tarefas.filter(t => t.status === coluna);
          
          return (
            <div key={coluna} className="w-[320px] shrink-0 flex flex-col bg-slate-100/70 border border-slate-200 dark:border-slate-700 rounded-xl max-h-full">
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-100/50 rounded-t-xl sticky top-0 z-10">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{coluna}</h3>
                <span className="bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {tarefasColuna.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                <AnimatePresence>
                  {tarefasColuna.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium text-slate-400">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    tarefasColuna.map((tarefa, idx) => {
                      const prazoConf = getPrazoConfig(tarefa.prazo, tarefa.status);
                      const PrazoIcon = prazoConf.icon;
                      const nextColIndex = COLUNAS.indexOf(coluna) + 1;
                      const prevColIndex = COLUNAS.indexOf(coluna) - 1;
                      
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={tarefa.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                        >
                          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPrioridadeColor(tarefa.prioridade)}`}>
                                {tarefa.prioridade}
                              </span>
                              
                              {/* Card Actions (Hover) */}
                              {user?.role === 'admin' && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => deleteTarefa(tarefa.id)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-1">{tarefa.titulo}</h4>
                            {tarefa.descricao && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{tarefa.descricao}</p>
                            )}
                          </div>
                          
                          <div className="p-3 bg-slate-50/50 rounded-b-lg flex flex-col gap-2.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <UserCircle size={16} className="text-blue-500" weight="fill" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{tarefa.responsavel}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className={`flex items-center gap-1 text-[11px] ${prazoConf.color}`}>
                                <PrazoIcon size={14} />
                                {prazoConf.text}
                              </div>
                              
                              <div className="flex gap-1">
                                {prevColIndex >= 0 && (
                                  <button 
                                    onClick={() => moverTarefa(tarefa.id, COLUNAS[prevColIndex])}
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 rounded px-2 py-1 border border-slate-200 dark:border-slate-700 transition-colors flex items-center opacity-0 group-hover:opacity-100 shadow-sm"
                                    title="Voltar etapa"
                                  >
                                    <ArrowLeft size={12} weight="bold" />
                                  </button>
                                )}
                                
                                {nextColIndex < COLUNAS.length && (
                                  <button 
                                    onClick={() => moverTarefa(tarefa.id, COLUNAS[nextColIndex])}
                                    className="text-brand hover:text-white hover:bg-brand bg-blue-50 rounded px-2 py-1 text-[10px] font-bold border border-blue-200 hover:border-brand transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 shadow-sm"
                                  >
                                    Avançar <ArrowRight size={10} weight="bold" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Nova Tarefa */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <CheckSquareOffset size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nova Tarefa</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">O que precisa ser feito?*</label>
                  <input 
                    {...form.register("titulo")}
                    placeholder="Ex: Aprovar arte do panfleto"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm font-medium"
                  />
                  {form.formState.errors.titulo && <p className="text-red-500 text-xs">{form.formState.errors.titulo.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Descrição Detalhada</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <textarea 
                    {...form.register("descricao")}
                    rows={2}
                    placeholder="Orientações adicionais..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Responsável*</label>
                    <select 
                      {...form.register("responsavel")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm"
                    >
                      <option value="">Selecione um responsável...</option>
                      {usuarios.length > 0 ? (
                        usuarios.map(u => (
                          <option key={u.id} value={u.nome}>{u.nome} — {u.role}</option>
                        ))
                      ) : (
                        <option disabled>Carregando usuários...</option>
                      )}
                    </select>
                    {form.formState.errors.responsavel && <p className="text-red-500 text-xs">{form.formState.errors.responsavel.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Prazo Limite*</label>
                    <input 
                      {...form.register("prazo")}
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm"
                    />
                    {form.formState.errors.prazo && <p className="text-red-500 text-xs">{form.formState.errors.prazo.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nível de Prioridade*</label>
                    <select 
                      {...form.register("prioridade")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Normal">Normal</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Status Inicial*</label>
                    <select 
                      {...form.register("status")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white text-sm"
                    >
                      <option value="A Fazer">A Fazer</option>
                      <option value="Em Progresso">Em Progresso</option>
                      <option value="Em Revisão">Em Revisão</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </div>
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
                    Salvar Tarefa
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




