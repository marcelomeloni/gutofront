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
  Fire,
  ArrowsClockwise,
  ListDashes,
  Lightbulb,
  Plus,
  X,
  Megaphone,
  VideoCamera,
  Image as ImageIcon,
  TextAa,
  Trash,
  CheckCircle,
  CalendarBlank,
  User,
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  WhatsappLogo,
  Globe,
  ShareNetwork,
  Eye
} from "@phosphor-icons/react";

const channelsList = [
  { id: "instagram", name: "Instagram", icon: InstagramLogo, color: "text-pink-600 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-900/20 dark:border-pink-800/50" },
  { id: "tiktok", name: "TikTok", icon: TiktokLogo, color: "text-slate-900 bg-slate-100 border-slate-300 dark:text-slate-100 dark:bg-slate-800 dark:border-slate-700" },
  { id: "youtube", name: "YouTube", icon: YoutubeLogo, color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50" },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsappLogo, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800/50" },
  { id: "site", name: "Site Oficial", icon: Globe, color: "text-brand bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50" },
];

const contentSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  type: z.string().min(1, "Selecione o formato"),
  priority: z.enum(["Baixa", "Normal", "Alta", "Urgente"]),
  channels: z.array(z.string()).min(1, "Selecione pelo menos um canal"),
  script: z.string().optional(),
  creationDate: z.string().min(1, "Obrigatório"),
  deadlineDate: z.string().optional(),
  responsible: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentSchema>;

interface ContentItem extends ContentFormValues {
  id: string;
  status: "Planejamento" | "Em Produção" | "Aprovação" | "Publicado";
}

export default function MarketingPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fila' | 'pautas'>('fila');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/marketing');
      setContents(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar conteúdos');
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      priority: "Normal",
      channels: [],
      creationDate: new Date().toISOString().split('T')[0],
      type: "Vídeo Curto",
      responsible: ""
    },
  });

  const selectedChannels = watch("channels") || [];

  const toggleChannel = (channelId: string) => {
    if (selectedChannels.includes(channelId)) {
      setValue("channels", selectedChannels.filter(c => c !== channelId), { shouldValidate: true });
    } else {
      setValue("channels", [...selectedChannels, channelId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ContentFormValues) => {
    try {
      const newItem = {
        ...data,
        status: "Planejamento",
      };
      
      const savedItem = await api.post('/marketing', newItem);
      setContents((prev) => [savedItem, ...prev]);
      toast.success("Conteúdo adicionado à fila editorial!");
      closeModal();
    } catch (error) {
      toast.error("Erro ao adicionar conteúdo");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const deleteContent = async (id: string) => {
    try {
      await api.delete(`/marketing/${id}`);
      setContents(contents.filter(c => c.id !== id));
      toast.success("Conteúdo excluído");
    } catch (error) {
      toast.error("Erro ao excluir conteúdo");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planejamento": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Em Produção": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Aprovação": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Publicado": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Title */}
      <div></div>

      {/* Top Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold mb-1">
              <Fire size={24} weight="fill" />
              <span>Mais Populares</span>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-300">Visualizações em Alta</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/80 mt-3 font-medium">Reel "Propostas de Saúde" (+45k)</p>
          </div>
          <div className="w-12 h-12 bg-white/60 dark:bg-slate-900/60 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
            <Eye size={24} weight="duotone" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-2 text-brand font-bold mb-1">
              <ArrowsClockwise size={24} weight="bold" />
              <span>Mais Compartilhados</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300">Engajamento Direto</p>
            <p className="text-xs text-brand/70 dark:text-brand/80 mt-3 font-medium">Card "Agenda do Fim de Semana" (+1.2k)</p>
          </div>
          <div className="w-12 h-12 bg-white/60 dark:bg-slate-900/60 rounded-full flex items-center justify-center text-blue-500 dark:text-brand group-hover:scale-110 transition-transform">
            <ShareNetwork size={24} weight="duotone" />
          </div>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('fila')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'fila' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-white'}`}
          >
            <ListDashes size={18} />
            Fila Editorial
          </button>
          <button 
            onClick={() => setActiveTab('pautas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'pautas' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-white'}`}
          >
            <Lightbulb size={18} />
            Banco de Pautas
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto px-2 md:px-0">
          <button className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Lightbulb size={18} weight="fill" />
            Nova Ideia de Pauta
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} weight="bold" />
            Novo Conteúdo
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'fila' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 w-[30%]">Conteúdo</th>
                  <th className="px-6 py-4">Tipo e Canais</th>
                  <th className="px-6 py-4 w-[25%]">Conteúdo Escrito</th>
                  <th className="px-6 py-4">Situação e Prazos</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {contents.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center text-slate-400">
                          <Megaphone size={48} weight="duotone" className="mb-4 text-slate-300" />
                          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum conteúdo na fila editorial.</p>
                          <p className="text-sm">Clique em "Novo Conteúdo" para iniciar o planejamento.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    contents.map((item) => (
                      <motion.tr 
                        layout 
                        key={item.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-slate-800 dark:text-white text-base mb-1">{item.title}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <User size={14} /> {item.responsible || 'Sem responsável'}
                          </div>
                          <div className={`mt-2 inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            item.priority === 'Urgente' ? 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800/50 dark:bg-red-900/20' :
                            item.priority === 'Alta' ? 'text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800/50 dark:bg-orange-900/20' :
                            'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                          }`}>
                            Prioridade {item.priority}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 mb-2">
                            {item.type.toLowerCase().includes('reel') || item.type.toLowerCase().includes('video') ? (
                              <VideoCamera size={16} className="text-blue-500 dark:text-blue-400" />
                            ) : item.type.toLowerCase().includes('texto') ? (
                              <TextAa size={16} className="text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <ImageIcon size={16} className="text-purple-500 dark:text-purple-400" />
                            )}
                            {item.type}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.channels.map(chan => {
                              const channelData = channelsList.find(c => c.id === chan);
                              if (!channelData) return null;
                              const Icon = channelData.icon;
                              return (
                                <div key={chan} className={`p-1 rounded border ${channelData.color}`} title={channelData.name}>
                                  <Icon size={14} weight="fill" />
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-800 italic">
                            {item.script || "Nenhum roteiro ou legenda definido..."}
                          </p>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <CalendarBlank size={14} className="text-slate-400" />
                              Criado: {format(new Date(item.creationDate), "dd/MM/yy")}
                            </div>
                            {item.deadlineDate && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                <CheckCircle size={14} className="text-green-500" />
                                Prazo: {format(new Date(item.deadlineDate), "dd/MM/yy")}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top text-right">
                          <button 
                            onClick={() => deleteContent(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Excluir"
                          >
                            <Trash size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <Lightbulb size={48} weight="duotone" className="text-yellow-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Banco de Pautas</h2>
            <p className="text-slate-500 dark:text-slate-400">Este repositório está vazio no momento. Guarde ideias soltas para publicações futuras aqui.</p>
          </div>
        )}
      </div>

      {/* Create Content Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <Megaphone size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Criar Novo Conteúdo na Fila</h2>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Row 1 */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Título do Conteúdo*</label>
                    <input 
                      {...register("title")}
                      type="text" 
                      placeholder="Ex: Panfletagem na Praça, Propostas de Saúde"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Formato do Conteúdo*</label>
                    <input 
                      {...register("type")}
                      type="text" 
                      placeholder="Ex: Vídeo Curto, Card Feed, Texto"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Prioridade*</label>
                    <select 
                      {...register("priority")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Normal">Normal</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente 🔥</option>
                    </select>
                  </div>

                  {/* Channels Selection */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Canais de Distribuição (Selecione Vários)*</label>
                    <div className="flex flex-wrap gap-2">
                      {channelsList.map(channel => {
                        const Icon = channel.icon;
                        const isSelected = selectedChannels.includes(channel.id);
                        return (
                          <button
                            type="button"
                            key={channel.id}
                            onClick={() => toggleChannel(channel.id)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                              isSelected 
                                ? channel.color + ' ring-2 ring-offset-1 ring-' + channel.color.split('-')[1] + '-300' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            <Icon size={18} weight={isSelected ? "fill" : "regular"} />
                            {channel.name}
                          </button>
                        )
                      })}
                    </div>
                    {errors.channels && <p className="text-red-500 text-xs mt-1">{errors.channels.message}</p>}
                  </div>

                  {/* Script / Legenda */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                      <span>Texto Base do Conteúdo</span>
                      <span className="text-slate-400 font-normal text-xs">Opcional</span>
                    </label>
                    <textarea 
                      {...register("script")}
                      rows={4}
                      placeholder="Escreva o roteiro do vídeo ou a legenda do post..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Data de Criação*</label>
                    <input 
                      {...register("creationDate")}
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.creationDate && <p className="text-red-500 text-xs mt-1">{errors.creationDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex justify-between">
                      <span>Prazo Publicação</span>
                      <span className="text-slate-400 font-normal text-xs">Opcional</span>
                    </label>
                    <input 
                      {...register("deadlineDate")}
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Responsible */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Responsável</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        {...register("responsible")}
                        type="text" 
                        placeholder="Sem responsável"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm hover:shadow flex items-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Salvar Conteúdo
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




