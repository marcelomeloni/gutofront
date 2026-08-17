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
  FolderOpen,
  Plus,
  X,
  Trash,
  MagnifyingGlass,
  GoogleDriveLogo,
  Link as LinkIcon,
  FolderStar,
  Image as ImageIcon,
  FileText,
  LockKey,
  Globe,
  Users
} from "@phosphor-icons/react";

// --- Schemas ---

const arquivoSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório"),
  url: z.string().url("Deve ser um link válido (https://...)"),
  categoria: z.string().min(1, "Selecione a categoria"),
  acesso: z.enum(["Público", "Interno", "Confidencial"]),
});

type ArquivoForm = z.infer<typeof arquivoSchema>;

interface ArquivoItem extends ArquivoForm {
  id: string;
  dataAdicao: string;
}

export default function ArquivosPage() {
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArquivos = async () => {
      try {
        const data = await api.arquivos.getAll();
        setArquivos(data.map((a: any) => ({
          id: a.id,
          titulo: a.titulo,
          url: a.url,
          categoria: a.categoria || 'Documentos Gerais',
          acesso: a.acesso || 'Interno',
          dataAdicao: a.created_at
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar arquivos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArquivos();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const form = useForm<ArquivoForm>({
    resolver: zodResolver(arquivoSchema),
    defaultValues: {
      categoria: "Documentos Gerais",
      acesso: "Interno"
    }
  });

  const onSubmit = async (data: ArquivoForm) => {
    try {
      const created = await api.arquivos.create(data);
      const newItem: ArquivoItem = {
        id: created.id,
        titulo: created.titulo,
        url: created.url,
        categoria: created.categoria,
        acesso: created.acesso,
        dataAdicao: created.created_at
      };
      setArquivos([newItem, ...arquivos]);
      toast.success('Link do Google Drive salvo!');
      setIsModalOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error('Erro ao salvar link: ' + err.message);
    }
  };

  const deleteArquivo = async (id: string) => {
    try {
      await api.arquivos.remove(id);
      setArquivos(arquivos.filter(a => a.id !== id));
      toast.success('Link removido da biblioteca');
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  const filteredArquivos = arquivos.filter(a => {
    const matchSearch = a.titulo.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? a.categoria === filterCat : true;
    return matchSearch && matchCat;
  });

  const getAcessoConfig = (acesso: string) => {
    switch (acesso) {
      case "Público": return { icon: Globe, color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/20" };
      case "Interno": return { icon: Users, color: "text-brand bg-blue-50 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/20" };
      case "Confidencial": return { icon: LockKey, color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/20" };
      default: return { icon: Globe, color: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    if (categoria.includes("Fotos")) return <ImageIcon size={24} weight="duotone" className="text-pink-500" />;
    if (categoria.includes("Design")) return <FolderStar size={24} weight="duotone" className="text-orange-500" />;
    if (categoria.includes("Jurídico")) return <FileText size={24} weight="duotone" className="text-slate-700 dark:text-slate-200" />;
    return <FolderOpen size={24} weight="duotone" className="text-blue-500" />;
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <GoogleDriveLogo size={18} weight="bold" />
          Adicionar Link do Drive
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por título da pasta ou arquivo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand text-sm"
          />
        </div>
        <select 
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-brand"
        >
          <option value="">Todas as Categorias</option>
          <option value="Fotos e Vídeos">Fotos e Vídeos</option>
          <option value="Design e Peças Gráficas">Design e Peças Gráficas</option>
          <option value="Jurídico e Contábil">Jurídico e Contábil</option>
          <option value="Planilhas e Controles">Planilhas e Controles</option>
          <option value="Documentos Gerais">Documentos Gerais</option>
        </select>
      </div>

      {/* Grid of Links */}
      {filteredArquivos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center flex flex-col items-center">
          <GoogleDriveLogo size={56} weight="duotone" className="text-slate-300 mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum link do Drive cadastrado.</p>
          <p className="text-sm text-slate-400 mt-1">Organize seus links clicando no botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredArquivos.map(arquivo => {
              const { icon: AcessoIcon, color: acessoColor } = getAcessoConfig(arquivo.acesso);
              return (
                <motion.div
                  layout
                  key={arquivo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                      {getCategoriaIcon(arquivo.categoria)}
                    </div>
                    <button 
                      onClick={() => deleteArquivo(arquivo.id)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Excluir"
                    >
                      <Trash size={18} />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2 leading-tight mb-1" title={arquivo.titulo}>
                    {arquivo.titulo}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">{arquivo.categoria}</p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${acessoColor}`}>
                      <AcessoIcon size={12} weight="bold" />
                      {arquivo.acesso}
                    </span>

                    <a 
                      href={arquivo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <LinkIcon size={16} weight="bold" />
                      Acessar
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Add Link */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <GoogleDriveLogo size={24} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Adicionar Link do Drive</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Título / Nome da Pasta*</label>
                  <input 
                    {...form.register("titulo")}
                    placeholder="Ex: Fotos Caminhada Centro 15/08"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                  {form.formState.errors.titulo && <p className="text-red-500 text-xs">{form.formState.errors.titulo.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">URL do Google Drive*</label>
                  <input 
                    {...form.register("url")}
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                  />
                  {form.formState.errors.url && <p className="text-red-500 text-xs">{form.formState.errors.url.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Categoria*</label>
                    <select 
                      {...form.register("categoria")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    >
                      <option value="Fotos e Vídeos">Fotos e Vídeos</option>
                      <option value="Design e Peças Gráficas">Design e Peças Gráficas</option>
                      <option value="Jurídico e Contábil">Jurídico e Contábil</option>
                      <option value="Planilhas e Controles">Planilhas e Controles</option>
                      <option value="Documentos Gerais">Documentos Gerais</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nível de Acesso*</label>
                    <select 
                      {...form.register("acesso")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white font-medium"
                    >
                      <option value="Público">Público</option>
                      <option value="Interno">Interno</option>
                      <option value="Confidencial">Confidencial</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">
                    Salvar Link
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




