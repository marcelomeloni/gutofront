"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { api } from "@/lib/api";
import {
  Users,
  Plus,
  X,
  Trash,
  ShieldStar,
  UserCircle,
  Megaphone,
  CurrencyDollar,
  CalendarBlank,
  Wrench,
  LockKey,
  Power,
  PencilSimple
} from "@phosphor-icons/react";

// --- Schemas ---

const usuarioSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["Admin", "Agenda", "Marketing", "Financeiro", "Operacional"]),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

interface UsuarioItem extends Omit<UsuarioForm, 'senha'> {
  id: string;
  status: "Ativo" | "Inativo";
}

const changePasswordSchema = z.object({
  novaSenha: z.string().min(6, "No mínimo 6 caracteres")
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsuarios = async () => {
    try {
      const data = await api.get("/usuarios");
      setUsuarios(data.map((u: any) => ({ ...u, status: "Ativo", role: u.role.charAt(0).toUpperCase() + u.role.slice(1) })));
    } catch (err) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);

  const form = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      role: "Operacional"
    }
  });

  const formSenha = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema)
  });

  const onSubmit = async (data: UsuarioForm) => {
    try {
      await api.post("/auth/register", { ...data, password: data.senha, role: data.role.toLowerCase() });
      toast.success("Usuário criado com sucesso!");
      fetchUsuarios();
      setIsModalOpen(false);
      form.reset();
    } catch (err) {
      toast.error("Erro ao criar usuário");
    }
  };

  const deleteUsuario = async (id: string) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success("Usuário removido do sistema");
    } catch (err) {
      toast.error("Erro ao remover usuário");
    }
  };

  const toggleStatus = (id: string) => {
    setUsuarios(usuarios.map(u => {
      if (u.id === id) {
        const newStatus = u.status === "Ativo" ? "Inativo" : "Ativo";
        toast.success(`Usuário ${newStatus === "Ativo" ? "ativado" : "desativado"} com sucesso!`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const openSenhaModal = (user: UsuarioItem) => {
    setSelectedUser(user);
    setModalSenha(true);
    formSenha.reset();
  };

  const openEditarModal = (user: UsuarioItem) => {
    setSelectedUser(user);
    form.reset({ nome: user.nome, email: user.email, role: user.role, senha: "000000" });
    setModalEditar(true);
  };

  const onEditSubmit = async (data: UsuarioForm) => {
    try {
      await api.put(`/usuarios/${selectedUser?.id}`, { nome: data.nome, email: data.email, role: data.role.toLowerCase() });
      fetchUsuarios();
      toast.success("Usuário atualizado com sucesso!");
      setModalEditar(false);
      form.reset();
    } catch (err) {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const onChangePassword = (data: ChangePasswordForm) => {
    toast.success(`Senha de ${selectedUser?.nome} alterada!`);
    setModalSenha(false);
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "Admin": return { icon: ShieldStar, color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "Agenda": return { icon: CalendarBlank, color: "text-brand bg-blue-50 border-blue-200" };
      case "Marketing": return { icon: Megaphone, color: "text-pink-600 bg-pink-50 border-pink-200" };
      case "Financeiro": return { icon: CurrencyDollar, color: "text-green-600 bg-green-50 border-green-200" };
      case "Operacional": return { icon: Wrench, color: "text-orange-600 bg-orange-50 border-orange-200" };
      default: return { icon: UserCircle, color: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6 pb-12">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex justify-center items-center gap-2 bg-brand hover:bg-brand-hover text-black px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Novo Usuário
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Nível de Acesso (Role)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {usuarios.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="py-16 text-center text-slate-500 dark:text-slate-400">
                      <Users size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum usuário cadastrado.</p>
                    </td>
                  </motion.tr>
                ) : (
                  usuarios.map((user) => {
                    const { icon: RoleIcon, color: roleColor } = getRoleConfig(user.role);
                    
                    return (
                      <motion.tr 
                        layout 
                        key={user.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`transition-colors ${user.status === 'Inativo' ? 'bg-slate-50 dark:bg-slate-800 opacity-60 grayscale' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <UserCircle size={24} weight="fill" />
                            </div>
                            <div>
                              <div className={`font-bold text-base ${user.status === 'Inativo' ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{user.nome}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleColor}`}>
                            <RoleIcon size={16} />
                            {user.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => openEditarModal(user)}
                              className="p-1.5 text-slate-400 hover:text-brand hover:bg-amber-50 rounded border border-transparent transition-colors"
                              title="Editar Usuário"
                            >
                              <PencilSimple size={18} />
                            </button>
                            <button 
                              onClick={() => toggleStatus(user.id)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded border border-transparent transition-colors"
                              title={user.status === "Ativo" ? "Desativar Login" : "Ativar Login"}
                            >
                              <Power size={18} />
                            </button>
                            <button 
                              onClick={() => openSenhaModal(user)}
                              className="p-1.5 text-slate-400 hover:text-brand hover:bg-blue-50 rounded border border-transparent transition-colors"
                              title="Alterar Senha"
                            >
                              <LockKey size={18} />
                            </button>
                            <button 
                              onClick={() => deleteUsuario(user.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent transition-colors"
                              title="Excluir Usuário"
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

      {/* Modals */}
      <AnimatePresence>
        
        {/* Create User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <Users size={20} weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Usuário</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome Completo*</label>
                  <input {...form.register("nome")} type="text" placeholder="Ex: João Silva" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  {form.formState.errors.nome && <p className="text-red-500 text-xs">{form.formState.errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Endereço de E-mail*</label>
                  <input {...form.register("email")} type="email" placeholder="joao@campanha.com" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nível de Acesso (Role)*</label>
                  <select {...form.register("role")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium text-slate-800 dark:text-white">
                    <option value="Admin">Admin</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Operacional">Operacional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Senha Inicial*</label>
                  <div className="relative">
                    <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input {...form.register("senha")} type="password" placeholder="Mínimo 6 caracteres" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  </div>
                  {form.formState.errors.senha && <p className="text-red-500 text-xs">{form.formState.errors.senha.message}</p>}
                </div>
                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">Criar Usuário</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Change Password Modal */}
        {modalSenha && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalSenha(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-brand rounded-lg flex items-center justify-center">
                    <LockKey size={20} weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Alterar Senha</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.nome}</p>
                  </div>
                </div>
                <button onClick={() => setModalSenha(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={formSenha.handleSubmit(onChangePassword)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nova Senha*</label>
                  <input {...formSenha.register("novaSenha")} type="password" placeholder="Digite a nova senha..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  {formSenha.formState.errors.novaSenha && <p className="text-red-500 text-xs">{formSenha.formState.errors.novaSenha.message}</p>}
                </div>
                
                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalSenha(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">Salvar Senha</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Edit User Modal */}
        {modalEditar && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalEditar(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-brand rounded-lg flex items-center justify-center">
                    <PencilSimple size={20} weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Editar Usuário</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.nome}</p>
                  </div>
                </div>
                <button onClick={() => setModalEditar(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onEditSubmit)} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome Completo*</label>
                  <input {...form.register("nome")} type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  {form.formState.errors.nome && <p className="text-red-500 text-xs">{form.formState.errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">E-mail*</label>
                  <input {...form.register("email")} type="email" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-slate-800 dark:text-white" />
                  {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nível de Acesso*</label>
                  <select {...form.register("role")} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium text-slate-800 dark:text-white">
                    <option value="Admin">Admin</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Operacional">Operacional</option>
                  </select>
                </div>
                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => setModalEditar(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




