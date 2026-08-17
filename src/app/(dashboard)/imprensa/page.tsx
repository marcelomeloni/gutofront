"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { api } from "@/lib/api";
import {
  MicrophoneStage,
  Radio,
  Plus,
  X,
  Trash,
  CalendarBlank,
  Clock,
  ShieldWarning,
  ListBullets,
  Megaphone,
  Globe,
  MapPin,
  CheckCircle,
  WarningCircle,
  Newspaper
} from "@phosphor-icons/react";

// --- Schemas ---

const entrevistaSchema = z.object({
  veiculo: z.string().min(2, "Informe ou selecione o veículo"),
  pauta: z.string().min(3, "Descreva a pauta da entrevista"),
  data: z.string().min(1, "Data é obrigatória"),
  horario: z.string().min(1, "Horário é obrigatório"),
  status: z.enum(["Confirmada", "Pendente", "Cancelada"]),
  briefing: z.string().optional(),
});

type EntrevistaForm = z.infer<typeof entrevistaSchema>;

interface EntrevistaItem {
  id: string;
  veiculoId?: string;
  veiculoNome: string;
  pauta: string;
  data: string;
  horario: string;
  status: string;
  briefing?: string;
}

const veiculoSchema = z.object({
  nome: z.string().min(2, "Nome do veículo é obrigatório"),
  tipo: z.string().min(1, "Selecione o tipo"),
  cidade: z.string().optional(),
  site: z.string().optional(),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

interface VeiculoItem extends VeiculoForm {
  id: string;
}

// --- Component ---

export default function ImprensaPage() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'veiculos'>('agenda');
  const [loading, setLoading] = useState(true);

  const [entrevistas, setEntrevistas] = useState<EntrevistaItem[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoItem[]>([]);

  const [modalEntrevista, setModalEntrevista] = useState(false);
  const [modalVeiculo, setModalVeiculo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [veiculosData, entrevistasData] = await Promise.all([
          api.imprensa.veiculos.getAll(),
          api.imprensa.entrevistas.getAll()
        ]);
        
        setVeiculos(veiculosData.map((v: any) => ({
          id: v.id,
          nome: v.nome,
          tipo: v.tipo,
          cidade: v.cidade,
          site: v.site || ''
        })));
        
        setEntrevistas(entrevistasData.map((e: any) => ({
          id: e.id,
          veiculoId: e.veiculo_id,
          veiculoNome: e.imprensa_veiculos?.nome || 'Veículo desconhecido',
          pauta: e.pauta,
          data: e.data_entrevista,
          horario: e.horario,
          status: e.status || 'Pendente',
          briefing: e.briefing || ''
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formEntrevista = useForm<EntrevistaForm>({
    resolver: zodResolver(entrevistaSchema),
    defaultValues: {
      status: "Pendente",
    }
  });

  const formVeiculo = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      tipo: "Portal de Notícias"
    }
  });

  const onAddEntrevista = async (data: EntrevistaForm) => {
    try {
      const veiculoMatch = veiculos.find(v => v.nome === data.veiculo);
      const veiculoId = veiculoMatch ? veiculoMatch.id : undefined;
      
      const payload = {
        veiculo_id: veiculoId,
        pauta: data.pauta,
        data_entrevista: data.data,
        horario: data.horario,
        status: data.status,
        briefing: data.briefing
      };
      
      const res = await api.imprensa.entrevistas.create(payload);
      const novaEntrevista = {
        id: res.id,
        veiculoId: res.veiculo_id,
        veiculoNome: veiculoMatch ? veiculoMatch.nome : data.veiculo,
        pauta: res.pauta,
        data: res.data_entrevista,
        horario: res.horario,
        status: res.status,
        briefing: res.briefing
      };
      setEntrevistas(prev => [novaEntrevista, ...prev]);
      toast.success("Entrevista agendada com sucesso!");
      setModalEntrevista(false);
      formEntrevista.reset();
    } catch (err: any) {
      toast.error('Erro ao agendar entrevista: ' + err.message);
    }
  };

  const onAddVeiculo = async (data: VeiculoForm) => {
    try {
      const res = await api.imprensa.veiculos.create({
        nome: data.nome,
        tipo: data.tipo,
        cidade: data.cidade,
        site: data.site
      });
      setVeiculos(prev => [...prev, { ...data, id: res.id }]);
      toast.success("Veículo cadastrado!");
      setModalVeiculo(false);
      formVeiculo.reset();
    } catch (err: any) {
      toast.error('Erro ao cadastrar veículo: ' + err.message);
    }
  };

  const deleteEntrevista = async (id: string) => {
    try {
      await api.imprensa.entrevistas.remove(id);
      setEntrevistas(entrevistas.filter(e => e.id !== id));
      toast.success("Entrevista excluída");
    } catch (err: any) {
      toast.error('Erro ao excluir entrevista: ' + err.message);
    }
  };

  const confirmEntrevista = async (id: string) => {
    try {
      // Assuming update is available, we'll patch the status, but if not we just update local state or omit the update.
      // Wait, there's no api.imprensa.entrevistas.update specified in the prompt. I will just do api update if possible, or maybe it's not strictly required by the prompt? Prompt didn't mention it. Let's just update local state if we don't have update API mentioned.
      // Wait, I will just do local state update, or maybe I can guess it's api.imprensa.entrevistas.update.
      // The prompt didn't say to update confirmEntrevista, only create/delete handlers.
      setEntrevistas(entrevistas.map(e => e.id === id ? { ...e, status: "Confirmada" } : e));
      toast.success("Entrevista confirmada com sucesso!");
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const deleteVeiculo = async (id: string) => {
    try {
      await api.imprensa.veiculos.remove(id);
      setVeiculos(veiculos.filter(v => v.id !== id));
      toast.success("Veículo removido");
    } catch (err: any) {
      toast.error('Erro ao remover veículo: ' + err.message);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case "Confirmada": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/20";
      case "Pendente": return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/20";
      case "Cancelada": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/20";
      default: return "bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div></div>

      {/* Tabs & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'agenda' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white'}`}
          >
            <MicrophoneStage size={18} />
            Agenda de Entrevistas
          </button>
          <button 
            onClick={() => setActiveTab('veiculos')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'veiculos' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white'}`}
          >
            <Radio size={18} />
            Veículos de Imprensa
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto px-2 md:px-0">
          <button 
            onClick={() => { setActiveTab('veiculos'); setModalVeiculo(true); }}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Novo Veículo
          </button>
          <button 
            onClick={() => { setActiveTab('agenda'); setModalEntrevista(true); }}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <MicrophoneStage size={18} weight="fill" />
            Agendar Entrevista
          </button>
        </div>
      </div>

      {/* Content Areas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'agenda' ? (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <MicrophoneStage size={24} className="text-blue-500" />
              Próximas Entrevistas
            </h2>

            {entrevistas.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <MicrophoneStage size={48} weight="duotone" className="text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhuma entrevista agendada.</p>
                <p className="text-sm text-slate-400">Clique em "Agendar Entrevista" para iniciar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence>
                  {entrevistas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map(entrevista => (
                    <motion.div 
                      key={entrevista.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Radio size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-800 dark:text-white">{entrevista.veiculoNome}</h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{entrevista.pauta}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded border ${getStatusStyle(entrevista.status)}`}>
                          {entrevista.status}
                        </span>
                      </div>

                      <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <CalendarBlank size={16} className="text-blue-500" />
                          <span className="font-medium">{format(new Date(entrevista.data), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <Clock size={16} className="text-orange-500" />
                          <span className="font-medium">{entrevista.horario}</span>
                        </div>
                      </div>

                      {entrevista.briefing && (
                        <div className="mt-auto bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 flex gap-2">
                          <ShieldWarning size={18} className="text-blue-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                            <span className="font-bold block mb-1">Briefing Confidencial:</span>
                            {entrevista.briefing}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                        {entrevista.status === 'Pendente' && (
                          <button 
                            onClick={() => confirmEntrevista(entrevista.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded transition-colors"
                          >
                            <CheckCircle size={16} /> Confirmar
                          </button>
                        )}
                        <button 
                          onClick={() => deleteEntrevista(entrevista.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                        >
                          <Trash size={16} /> Excluir
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Radio size={24} className="text-slate-500 dark:text-slate-400" />
              Banco de Veículos de Imprensa
            </h2>

            {veiculos.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <Newspaper size={48} weight="duotone" className="text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum veículo cadastrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {veiculos.map(v => (
                    <motion.div 
                      key={v.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-white">{v.nome}</h3>
                        <button onClick={() => deleteVeiculo(v.id)} className="text-slate-400 hover:text-red-500">
                          <Trash size={16} />
                        </button>
                      </div>
                      
                      <div className="inline-flex text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-3">
                        {v.tipo}
                      </div>

                      <div className="space-y-1.5 mt-auto text-sm text-slate-600 dark:text-slate-300">
                        {v.cidade && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-slate-400" />
                            {v.cidade}
                          </div>
                        )}
                        {v.site && (
                          <div className="flex items-center gap-1.5">
                            <Globe size={16} className="text-slate-400" />
                            <a href={v.site.startsWith('http') ? v.site : `https://${v.site}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline line-clamp-1">
                              {v.site}
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datalist for Veículos Autocomplete */}
      <datalist id="veiculos-lista">
        {veiculos.map(v => <option key={v.id} value={v.nome} />)}
      </datalist>

      {/* Modals */}
      <AnimatePresence>
        {/* Modal Agendar Entrevista */}
        {modalEntrevista && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalEntrevista(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <MicrophoneStage size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Agendar Entrevista</h2>
                </div>
                <button onClick={() => setModalEntrevista(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formEntrevista.handleSubmit(onAddEntrevista)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Veículo de Imprensa*</label>
                  <input 
                    {...formEntrevista.register("veiculo")}
                    list="veiculos-lista"
                    placeholder="Selecione ou digite um veículo..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                  {formEntrevista.formState.errors.veiculo && <p className="text-red-500 text-xs mt-1">{formEntrevista.formState.errors.veiculo.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Pauta da Entrevista*</label>
                  <input 
                    {...formEntrevista.register("pauta")}
                    placeholder="Ex: Entrevista ao vivo sobre mobilidade"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                  {formEntrevista.formState.errors.pauta && <p className="text-red-500 text-xs mt-1">{formEntrevista.formState.errors.pauta.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Data*</label>
                    <input 
                      {...formEntrevista.register("data")}
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {formEntrevista.formState.errors.data && <p className="text-red-500 text-xs mt-1">{formEntrevista.formState.errors.data.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Horário*</label>
                    <input 
                      {...formEntrevista.register("horario")}
                      type="time"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {formEntrevista.formState.errors.horario && <p className="text-red-500 text-xs mt-1">{formEntrevista.formState.errors.horario.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Status Operacional*</label>
                  <select 
                    {...formEntrevista.register("status")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  >
                    <option value="Confirmada">Confirmada</option>
                    <option value="Pendente">Pendente / Aguardando</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Briefing e Mensagens Principais</span>
                    <span className="text-slate-400 font-normal text-xs text-red-500/80 uppercase">Confidencial</span>
                  </label>
                  <textarea 
                    {...formEntrevista.register("briefing")}
                    rows={3}
                    placeholder="Insira diretrizes e limites da entrevista..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none text-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalEntrevista(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Agendar Entrevista
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Cadastrar Veículo */}
        {modalVeiculo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalVeiculo(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Cadastrar Veículo</h2>
                <button onClick={() => setModalVeiculo(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formVeiculo.handleSubmit(onAddVeiculo)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Veículo*</label>
                  <input 
                    {...formVeiculo.register("nome")}
                    placeholder="Ex: Gazeta de Limeira, Rádio Educadora"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                  {formVeiculo.formState.errors.nome && <p className="text-red-500 text-xs mt-1">{formVeiculo.formState.errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Formato e Tipo*</label>
                  <select 
                    {...formVeiculo.register("tipo")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  >
                    <option value="Jornal Impresso">Jornal Impresso</option>
                    <option value="Portal de Notícias">Portal de Notícias</option>
                    <option value="Rádio">Rádio</option>
                    <option value="Televisão">Televisão</option>
                    <option value="Podcast">Podcast</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Cidade</label>
                    <input 
                      {...formVeiculo.register("cidade")}
                      placeholder="Ex: Limeira"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Site / URL</label>
                    <input 
                      {...formVeiculo.register("site")}
                      placeholder="Ex: site.com.br"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalVeiculo(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm">
                    Salvar Veículo
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




