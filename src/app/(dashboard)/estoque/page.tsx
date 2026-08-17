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
  Package,
  Toolbox,
  ClockCounterClockwise,
  Plus,
  X,
  Trash,
  WarningCircle,
  CheckCircle,
  Archive,
  TrendDown,
  TrendUp,
  ArrowsLeftRight
} from "@phosphor-icons/react";

// --- Schemas ---

const itemSchema = z.object({
  nome: z.string().min(2, "Nome do item é obrigatório"),
  categoria: z.string().min(1, "Selecione a categoria"),
  qtdAtual: z.coerce.number().min(0, "Mínimo 0"),
  qtdMin: z.coerce.number().min(0, "Mínimo 0"),
  unidade: z.string().min(1, "Obrigatório"),
  estado: z.string().min(1, "Selecione o estado"),
  valor: z.coerce.number().min(0).optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface EstoqueItem extends ItemForm {
  id: string;
}

const kitSchema = z.object({
  nome: z.string().min(2, "Nome do kit é obrigatório"),
  descricao: z.string().optional(),
});

type KitForm = z.infer<typeof kitSchema>;

interface KitItem extends KitForm {
  id: string;
  materiais: { itemId: string; qtd: number }[];
}

interface Movimentacao {
  id: string;
  itemId: string;
  nomeItem: string;
  tipo: "Entrada" | "Saída";
  qtd: number;
  data: string;
}

const movimentacaoSchema = z.object({
  tipo: z.enum(["Entrada", "Saída"]),
  qtd: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
  observacao: z.string().optional()
});

type MovimentacaoForm = z.infer<typeof movimentacaoSchema>;

// --- Component ---

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState<'fisico' | 'kits'>('fisico');
  
  const [items, setItems] = useState<EstoqueItem[]>([]);

  const [kits, setKits] = useState<KitItem[]>([
    {
      id: "k1",
      nome: "Kit Caminhada Padrão",
      descricao: "Material básico para caminhadas matinais",
      materiais: []
    }
  ]);

  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, movData] = await Promise.all([
          api.estoque.getAll(),
          api.estoque.movimentacoes.getAll()
        ]);
        setItems(itemsData.map((i: any) => ({
          id: i.id,
          nome: i.nome,
          categoria: i.tipo || i.categoria || 'Outros',
          qtdAtual: i.quantidade_atual || 0,
          qtdMin: i.quantidade_minima || 0,
          unidade: i.unidade || 'un',
          estado: i.estado || 'Novo',
          valor: i.valor || 0
        })));
        setHistorico(movData.map((m: any) => ({
          id: m.id,
          itemId: m.item_id,
          nomeItem: m.estoque_itens?.nome || 'Item',
          tipo: m.tipo_movimentacao === 'Entrada' ? 'Entrada' : 'Saída',
          qtd: m.quantidade,
          data: m.created_at,
          obs: m.observacao || ''
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar estoque: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [modalItem, setModalItem] = useState(false);
  const [modalKit, setModalKit] = useState(false);
  
  // States for Movimentação
  const [modalMov, setModalMov] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  
  // State for selecting materials in Kit creation
  const [kitMateriais, setKitMateriais] = useState<{itemId: string; qtd: number}[]>([]);

  const formItem = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { qtdAtual: 0, qtdMin: 0, unidade: "un", estado: "Novo", valor: 0.00 }
  });

  const formKit = useForm<KitForm>({
    resolver: zodResolver(kitSchema),
  });

  const formMov = useForm<MovimentacaoForm>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: { tipo: "Saída", qtd: 1 }
  });

  const onAddItem = async (data: ItemForm) => {
    try {
      const res = await api.estoque.create({
        nome: data.nome,
        tipo: data.categoria, // mapped to tipo in DB per instructions (or categoria)
        categoria: data.categoria,
        quantidade_atual: data.qtdAtual,
        quantidade_minima: data.qtdMin,
        unidade: data.unidade,
        estado: data.estado,
        valor: data.valor || 0
      });

      const newItem = {
        ...data,
        id: res.id
      };
      setItems(prev => [...prev, newItem]);
      
      // If we add initial history on frontend only to reflect creation
      if (data.qtdAtual > 0) {
        setHistorico(prev => [{ id: Math.random().toString(), itemId: newItem.id, nomeItem: newItem.nome, tipo: "Entrada", qtd: data.qtdAtual, data: new Date().toISOString() }, ...prev]);
      }
      
      toast.success("Item cadastrado no estoque!");
      setModalItem(false);
      formItem.reset();
    } catch (err: any) {
      toast.error('Erro ao cadastrar item: ' + err.message);
    }
  };

  const onAddKit = (data: KitForm) => {
    if (kitMateriais.length === 0) {
      toast.error("Adicione pelo menos um material ao kit");
      return;
    }
    setKits(prev => [...prev, { ...data, id: Math.random().toString(), materiais: kitMateriais }]);
    toast.success("Kit de materiais criado!");
    setModalKit(false);
    formKit.reset();
    setKitMateriais([]);
  };

  const openMovModal = (item: EstoqueItem) => {
    setSelectedItem(item);
    setModalMov(true);
    formMov.reset({ tipo: "Saída", qtd: 1 });
  };

  const onMovimentar = async (data: MovimentacaoForm) => {
    if (!selectedItem) return;
    
    if (data.tipo === "Saída" && data.qtd > selectedItem.qtdAtual) {
      toast.error("Quantidade de saída maior que o estoque atual!");
      return;
    }

    try {
      const res = await api.estoque.movimentar(selectedItem.id, {
        tipo_movimentacao: data.tipo,
        quantidade: data.qtd,
        observacao: data.observacao
      });

      const newQtd = data.tipo === "Entrada" 
        ? selectedItem.qtdAtual + data.qtd 
        : selectedItem.qtdAtual - data.qtd;

      setItems(items.map(i => i.id === selectedItem.id ? { ...i, qtdAtual: newQtd } : i));

      setHistorico(prev => [{
        id: res.id || Math.random().toString(),
        itemId: selectedItem.id,
        nomeItem: selectedItem.nome,
        tipo: data.tipo,
        qtd: data.qtd,
        data: new Date().toISOString()
      }, ...prev]);

      toast.success(`Movimentação de ${data.tipo.toLowerCase()} registrada com sucesso!`);
      setModalMov(false);
    } catch (err: any) {
      toast.error('Erro ao movimentar estoque: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.estoque.remove(id);
      setItems(items.filter(i => i.id !== id));
      toast.success("Item excluído do estoque");
    } catch (err: any) {
      toast.error('Erro ao excluir item: ' + err.message);
    }
  };

  const deleteKit = (id: string) => {
    setKits(kits.filter(k => k.id !== id));
    toast.success("Kit excluído");
  };

  const toggleMaterialToKit = (itemId: string) => {
    if (kitMateriais.some(m => m.itemId === itemId)) {
      setKitMateriais(kitMateriais.filter(m => m.itemId !== itemId));
    } else {
      setKitMateriais([...kitMateriais, { itemId, qtd: 1 }]);
    }
  };

  const updateMaterialQtdInKit = (itemId: string, qtd: number) => {
    setKitMateriais(kitMateriais.map(m => m.itemId === itemId ? { ...m, qtd } : m));
  };

  const getStatusSaldo = (atual: number, min: number) => {
    if (atual === 0) return { label: "Esgotado", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/20", icon: WarningCircle };
    if (atual <= min) return { label: "Estoque Baixo", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/20", icon: WarningCircle };
    return { label: "Saudável", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/20", icon: CheckCircle };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div></div>

      {/* Tabs & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('fisico')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'fisico' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white'}`}
          >
            <Archive size={18} />
            Estoque Físico
          </button>
          <button 
            onClick={() => setActiveTab('kits')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'kits' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white'}`}
          >
            <Toolbox size={18} />
            Kits de Eventos
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto px-2 md:px-0">
          {activeTab === 'fisico' && (
            <button 
              onClick={() => setModalItem(true)}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} weight="bold" />
              Cadastrar Novo Item
            </button>
          )}
          {activeTab === 'kits' && (
            <button 
              onClick={() => { setModalKit(true); setKitMateriais([]); }}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} weight="bold" />
              Criar Kit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
            {activeTab === 'fisico' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4">Nome do Item e Categoria</th>
                      <th className="px-6 py-4">Qtd. Atual</th>
                      <th className="px-6 py-4">Min. Config</th>
                      <th className="px-6 py-4">Status de Saldo</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {items.length === 0 ? (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={5} className="py-16 text-center">
                            <Archive size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum item cadastrado no estoque físico.</p>
                          </td>
                        </motion.tr>
                      ) : (
                        items.map((item) => {
                          const status = getStatusSaldo(item.qtdAtual, item.qtdMin);
                          const StatusIcon = status.icon;
                          
                          return (
                            <motion.tr 
                              layout 
                              key={item.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800 dark:text-white text-base">{item.nome}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.categoria} &bull; {item.estado}</div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className="font-bold text-lg text-slate-800 dark:text-white">{item.qtdAtual}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{item.unidade}</span>
                              </td>

                              <td className="px-6 py-4">
                                <span className="font-medium text-slate-600 dark:text-slate-300">{item.qtdMin} {item.unidade}</span>
                              </td>

                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                  <StatusIcon size={14} weight="bold" />
                                  {status.label}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button 
                                    onClick={() => openMovModal(item)}
                                    className="flex items-center gap-1 p-1.5 px-3 font-semibold text-brand bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                                    title="Registrar Entrada ou Saída"
                                  >
                                    <ArrowsLeftRight size={16} /> Movimentar
                                  </button>
                                  <button 
                                    onClick={() => deleteItem(item.id)}
                                    className="p-1.5 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent transition-colors"
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
            ) : (
              <div className="p-6">
                <AnimatePresence>
                  {kits.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center">
                      <Toolbox size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum kit cadastrado.</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {kits.map(kit => (
                        <motion.div 
                          layout 
                          key={kit.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-800 flex flex-col hover:border-blue-200 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                              <Toolbox size={20} className="text-blue-500" weight="fill" />
                              {kit.nome}
                            </h3>
                            <button onClick={() => deleteKit(kit.id)} className="text-slate-400 hover:text-red-500">
                              <Trash size={16} />
                            </button>
                          </div>
                          {kit.descricao && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{kit.descricao}</p>}
                          
                          <div className="mt-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Itens Inclusos</div>
                            <ul className="divide-y divide-slate-100">
                              {kit.materiais.map(m => {
                                const itemRef = items.find(i => i.id === m.itemId);
                                return (
                                  <li key={m.itemId} className="flex justify-between items-center p-3 text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{itemRef?.nome || "Item excluído"}</span>
                                    <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded shrink-0">{m.qtd} {itemRef?.unidade || "un"}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Historico */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-max sticky top-[88px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <ClockCounterClockwise size={20} className="text-blue-500" />
            Histórico Recente
          </h2>
          
          <div className="space-y-4">
            {historico.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Sem movimentações recentes.</p>
            ) : (
              historico.map(hist => (
                <div key={hist.id} className="flex gap-3 items-start group">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    hist.tipo === 'Entrada' ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/20' : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/20'
                  }`}>
                    {hist.tipo === 'Entrada' ? <TrendUp size={16} weight="bold" /> : <TrendDown size={16} weight="bold" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight group-hover:text-brand transition-colors">
                      {hist.tipo === 'Entrada' ? '+' : '-'}{hist.qtd} {hist.nomeItem}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <ClockCounterClockwise size={12} /> {format(new Date(hist.data), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        
        {/* Modal: Item */}
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalItem(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <Package size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Cadastrar Novo Item</h2>
                </div>
                <button onClick={() => setModalItem(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formItem.handleSubmit(onAddItem)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Item*</label>
                  <input 
                    {...formItem.register("nome")}
                    placeholder="Ex: Santinhos Guto 45123, Tripé Grande"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  />
                  {formItem.formState.errors.nome && <p className="text-red-500 text-xs">{formItem.formState.errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Categoria*</label>
                  <select 
                    {...formItem.register("categoria")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Impressos">Impressos / Panfletos</option>
                    <option value="Estruturas">Estruturas / Bandeiras / Tripés</option>
                    <option value="Vestuário">Vestuário / Adesivos</option>
                    <option value="Eletrônicos">Eletrônicos / Som</option>
                    <option value="Outros">Outros</option>
                  </select>
                  {formItem.formState.errors.categoria && <p className="text-red-500 text-xs">{formItem.formState.errors.categoria.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Estoque Inicial*</label>
                    <input 
                      {...formItem.register("qtdAtual")}
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Estoque Mínimo*</label>
                    <input 
                      {...formItem.register("qtdMin")}
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Unidade*</label>
                    <select {...formItem.register("unidade")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white">
                      <option value="un">un (Unidade)</option>
                      <option value="cx">cx (Caixa)</option>
                      <option value="pct">pct (Pacote)</option>
                      <option value="milheiro">mil (Milheiro)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Estado*</label>
                    <select {...formItem.register("estado")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white">
                      <option value="Novo">Novo</option>
                      <option value="Usado">Usado</option>
                      <option value="Danificado">Danificado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Valor (R$)</label>
                    <input 
                      {...formItem.register("valor")}
                      type="number" step="0.01"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalItem(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Salvar Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Kit */}
        {modalKit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalKit(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <Toolbox size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Criar Kit de Eventos</h2>
                </div>
                <button onClick={() => setModalKit(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formKit.handleSubmit(onAddKit)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome do Kit*</label>
                  <input 
                    {...formKit.register("nome")}
                    placeholder="Ex: Kit Caminhada Limeira"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white"
                  />
                  {formKit.formState.errors.nome && <p className="text-red-500 text-xs">{formKit.formState.errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Descrição</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <textarea 
                    {...formKit.register("descricao")}
                    rows={2}
                    placeholder="Ex: Panfletos e tripés de apoio..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 block">Selecione os Materiais</label>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <ul className="divide-y divide-slate-200">
                      {items.map(item => {
                        const isInKit = kitMateriais.find(m => m.itemId === item.id);
                        return (
                          <li key={item.id} className={`p-3 flex items-center justify-between transition-colors ${isInKit ? 'bg-blue-50/50' : ''}`}>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input 
                                type="checkbox"
                                checked={!!isInKit}
                                onChange={() => toggleMaterialToKit(item.id)}
                                className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                              />
                              <div>
                                <span className={`block font-medium ${isInKit ? 'text-blue-900' : 'text-slate-700 dark:text-slate-200'}`}>{item.nome}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{item.qtdAtual} {item.unidade} em estoque</span>
                              </div>
                            </label>
                            
                            {isInKit && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Qtd:</span>
                                <input 
                                  type="number"
                                  min="1"
                                  value={isInKit.qtd}
                                  onChange={(e) => updateMaterialQtdInKit(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 px-2 py-1 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 rounded focus:outline-none focus:border-brand"
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{item.unidade}</span>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalKit(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Criar Kit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Registrar Movimentação (Entrada/Saída) */}
        {modalMov && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalMov(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <ArrowsLeftRight size={20} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Movimentar Estoque</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedItem.nome}</p>
                  </div>
                </div>
                <button onClick={() => setModalMov(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formMov.handleSubmit(onMovimentar)} className="p-6 space-y-5">
                
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Estoque Atual:</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-white">{selectedItem.qtdAtual} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{selectedItem.unidade}</span></span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Tipo de Movimentação*</label>
                  <select 
                    {...formMov.register("tipo")}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white font-medium"
                  >
                    <option value="Entrada">Entrada (+) Adicionar itens</option>
                    <option value="Saída">Saída (-) Retirar itens</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Quantidade*</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      {...formMov.register("qtd")}
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white font-bold"
                    />
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{selectedItem.unidade}</span>
                  </div>
                  {formMov.formState.errors.qtd && <p className="text-red-500 text-xs">{formMov.formState.errors.qtd.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Observação</span>
                    <span className="text-slate-400 font-normal text-xs">Opcional</span>
                  </label>
                  <textarea 
                    {...formMov.register("observacao")}
                    rows={2}
                    placeholder="Ex: Material para panfletagem no centro..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white resize-none text-sm"
                  />
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalMov(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Confirmar
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




