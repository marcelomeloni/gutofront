"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  CurrencyDollar,
  Warning,
  Plus,
  X,
  Trash,
  MagnifyingGlass,
  Funnel,
  ArrowUpRight,
  ArrowDownRight,
  WarningCircle,
  FileText,
  UploadSimple,
  Wallet,
  Receipt,
  Bank,
  CheckCircle
} from "@phosphor-icons/react";
import { api } from "@/lib/api";

// --- Schemas ---

const financeiroSchema = z.object({
  tipo: z.enum(["Receita (Entrada)", "Despesa (Saída)"]),
  categoria: z.string().min(1, "Selecione a categoria"),
  valor: z.coerce.number().min(0.01, "Valor inválido"),
  data: z.string().min(1, "Data obrigatória"),
  nome: z.string().min(2, "Nome obrigatório"),
  cpfCnpj: z.string().min(11, "Documento inválido").regex(/^\d+$/, "Apenas números"),
  meio: z.string().min(1, "Obrigatório"),
  observacoes: z.string().optional()
});

type FinanceiroForm = z.infer<typeof financeiroSchema>;

interface FinanceiroItem extends FinanceiroForm {
  id: string;
  status: "Pendente" | "Conferido" | "Divergência";
}

export default function FinanceiroPage() {
  const [registros, setRegistros] = useState<FinanceiroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const fetchFinanceiro = async () => {
      try {
        const data = await api.financeiro.getAll();
        setRegistros(data.map((r: any) => ({
          id: r.id,
          tipo: r.tipo || 'Receita (Entrada)',
          categoria: r.categoria || '',
          valor: typeof r.valor === 'number' ? r.valor : parseFloat(r.valor) || 0,
          data: r.data_transacao ? r.data_transacao.split('T')[0] : '',
          nome: r.descricao || '',
          cpfCnpj: r.cpfCnpj || '00000000000',
          meio: r.meio || 'Pix',
          observacoes: r.observacoes || '',
          status: r.status || 'Pendente'
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar financeiro: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceiro();
  }, []);

  const form = useForm<FinanceiroForm>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: {
      tipo: "Receita (Entrada)",
      categoria: "Doação financeira de pessoa física",
      meio: "Pix",
      data: new Date().toISOString().split('T')[0]
    }
  });

  const watchTipo = form.watch("tipo");

  const onSubmit = async (data: FinanceiroForm) => {
    try {
      const payload = {
        tipo: data.tipo,
        categoria: data.categoria,
        valor: data.valor,
        descricao: data.nome,
        data_transacao: data.data,
        status: 'Pendente',
      };
      const created = await api.financeiro.create(payload);
      
      const newItem: FinanceiroItem = {
        ...data,
        id: created.id,
        status: "Pendente"
      };
      
      setRegistros([newItem, ...registros]);
      toast.success("Registro adicionado com sucesso!");
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error('Erro ao criar registro: ' + err.message);
    }
  };

  const deleteRegistro = async (id: string) => {
    try {
      await api.financeiro.remove(id);
      setRegistros(registros.filter(r => r.id !== id));
      toast.success("Registro excluído");
    } catch (err: any) {
      toast.error('Erro ao excluir registro: ' + err.message);
    }
  };

  const updateStatus = async (id: string, status: FinanceiroItem["status"]) => {
    try {
      // Assuming updateStatus exists on api.financeiro
      await api.financeiro.update(id, { status });
      setRegistros(registros.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Status atualizado para ${status}`);
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totais = {
    arrecadado: registros.filter(r => r.tipo.includes("Receita") && r.status === "Conferido").reduce((a, b) => a + b.valor, 0),
    despesas: registros.filter(r => r.tipo.includes("Despesa") && r.status === "Conferido").reduce((a, b) => a + b.valor, 0),
    aPagar: registros.filter(r => r.tipo.includes("Despesa") && r.status === "Pendente").reduce((a, b) => a + b.valor, 0),
  };
  const saldo = totais.arrecadado - totais.despesas - totais.aPagar;

  const filteredRegistros = registros.filter(r => {
    const matchSearch = r.nome.toLowerCase().includes(search.toLowerCase()) || r.cpfCnpj.includes(search) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo ? r.tipo === filterTipo : true;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchSearch && matchTipo && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Novo Registro Interno
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
            <ArrowUpRight size={20} />
            <span className="text-sm">Total Arrecadado</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totais.arrecadado)}</p>
          <p className="text-xs text-slate-400 mt-1">Apenas registros conferidos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
            <ArrowDownRight size={20} />
            <span className="text-sm">Despesas Contratadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totais.despesas)}</p>
          <p className="text-xs text-slate-400 mt-1">Apenas registros conferidos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
            <Receipt size={20} />
            <span className="text-sm">Contas a Pagar</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totais.aPagar)}</p>
          <p className="text-xs text-slate-400 mt-1">Despesas pendentes</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-center gap-2 text-blue-300 font-bold mb-2">
            <Wallet size={20} />
            <span className="text-sm">Saldo Caixa Interno</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(saldo)}</p>
          <p className="text-xs text-slate-400 mt-1">Estimativa de fluxo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Content */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-500" /> Registros Financeiros Cadastrados
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nome, CPF ou CNPJ..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand text-sm"
              />
            </div>
            <select 
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand"
            >
              <option value="">-- Todos os Tipos --</option>
              <option value="Receita (Entrada)">Receitas</option>
              <option value="Despesa (Saída)">Despesas</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand"
            >
              <option value="">-- Status --</option>
              <option value="Pendente">Pendente</option>
              <option value="Conferido">Conferido</option>
              <option value="Divergência">Divergência</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[300px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Identificação / Protocolo</th>
                    <th className="px-6 py-4">Tipo / Categoria</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredRegistros.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <Bank size={40} weight="duotone" className="mx-auto mb-3 text-slate-300" />
                          Nenhum registro financeiro encontrado.
                        </td>
                      </motion.tr>
                    ) : (
                      filteredRegistros.map((item) => (
                        <motion.tr 
                          layout 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-white">{item.nome}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">CPF/CNPJ: {item.cpfCnpj}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">PROT: {item.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-semibold flex items-center gap-1 ${item.tipo.includes('Receita') ? 'text-green-600' : 'text-red-500'}`}>
                              {item.tipo.includes('Receita') ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                              {item.tipo}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" title={item.categoria}>{item.categoria}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                            {formatCurrency(item.valor)}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                              item.status === 'Conferido' ? 'bg-green-50 text-green-700 border-green-200' : 
                              item.status === 'Divergência' ? 'bg-red-50 text-red-700 border-red-200' : 
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {item.status}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              {item.status === 'Pendente' && (
                                <button onClick={() => updateStatus(item.id, 'Conferido')} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded border border-transparent transition-colors" title="Marcar como Conferido">
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              <button onClick={() => deleteRegistro(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent transition-colors" title="Excluir Registro">
                                <Trash size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <WarningCircle size={20} className="text-red-500" /> Alertas e Pendências
          </h2>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Aguardando Classificação</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">0 receitas</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Sem Exigência de Recibo</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">0 receitas</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Recibos Oficiais TSE Pendentes</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded">0</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Lançamentos sob Conferência</span>
              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold rounded">{registros.filter(r => r.status === 'Pendente').length} pendentes</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Divergências de Conciliação</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded">{registros.filter(r => r.status === 'Divergência').length} ocorrências</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Despesas Sem Comprovante</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">0 registros</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Retificações Solicitadas</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">0 pendentes</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Modal Novo Registro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <CurrencyDollar size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Registro Interno</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Tipo da Movimentação*</label>
                  <select 
                    {...form.register("tipo")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Receita (Entrada)">Receita (Entrada)</option>
                    <option value="Despesa (Saída)">Despesa (Saída)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Classificação Contábil / Categoria*</label>
                  <select 
                    {...form.register("categoria")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  >
                    {watchTipo.includes("Receita") ? (
                      <>
                        <option value="Doação financeira de pessoa física">Doação financeira de pessoa física</option>
                        <option value="Doação estimável em dinheiro">Doação estimável em dinheiro</option>
                        <option value="Recursos próprios do candidato">Recursos próprios do candidato</option>
                        <option value="Repasse de Partido">Repasse de Partido</option>
                      </>
                    ) : (
                      <>
                        <option value="Serviços de Marketing e Comunicação">Serviços de Marketing e Comunicação</option>
                        <option value="Materiais Impressos">Materiais Impressos</option>
                        <option value="Produção de Vídeo e Rádio">Produção de Vídeo e Rádio</option>
                        <option value="Aluguel de Imóveis/Comitê">Aluguel de Imóveis/Comitê</option>
                        <option value="Contabilidade e Jurídico">Contabilidade e Jurídico</option>
                        <option value="Combustível">Combustível</option>
                        <option value="Outras despesas">Outras despesas</option>
                      </>
                    )}
                  </select>
                  {watchTipo.includes("Receita") && (
                    <p className="text-[11px] text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1 mt-1">
                      <WarningCircle size={14} /> A classificação, documentação e admissibilidade da receita devem ser validadas pela contabilidade eleitoral.
                    </p>
                  )}
                  {form.formState.errors.categoria && <p className="text-red-500 text-xs">{form.formState.errors.categoria.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Valor (R$)*</label>
                    <input 
                      {...form.register("valor")}
                      type="number" step="0.01"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white font-bold"
                    />
                    {form.formState.errors.valor && <p className="text-red-500 text-xs">{form.formState.errors.valor.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Data*</label>
                    <input 
                      {...form.register("data")}
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                    />
                    {form.formState.errors.data && <p className="text-red-500 text-xs">{form.formState.errors.data.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{watchTipo.includes("Receita") ? "Nome do Doador*" : "Nome do Fornecedor/Prestador*"}</label>
                    <input 
                      {...form.register("nome")}
                      placeholder="Nome completo ou Razão Social"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                    />
                    {form.formState.errors.nome && <p className="text-red-500 text-xs">{form.formState.errors.nome.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">CPF / CNPJ*</label>
                    <input 
                      {...form.register("cpfCnpj")}
                      placeholder="Somente números"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                    />
                    {form.formState.errors.cpfCnpj && <p className="text-red-500 text-xs">{form.formState.errors.cpfCnpj.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Meio de Movimentação*</label>
                  <select 
                    {...form.register("meio")}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Transferência Bancária (TED/DOC)">Transferência Bancária (TED/DOC)</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Comprovante de Operação</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
                      <UploadSimple size={16} />
                      Escolher Arquivo
                      <input type="file" className="hidden" />
                    </label>
                    <span className="text-xs text-slate-400">Nenhum arquivo escolhido</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Observações Internas</label>
                  <textarea 
                    {...form.register("observacoes")}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Registrar Lançamento
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




