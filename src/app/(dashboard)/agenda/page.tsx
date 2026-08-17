"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, compareAsc } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarPlus,
  X,
  CheckCircle,
  WarningCircle,
  Trash,
  Plus,
  CalendarBlank,
  User,
  Flag,
  ListChecks
} from "@phosphor-icons/react";
import { api } from "@/lib/api";

const eventSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  priority: z.enum(["Baixa", "Média", "Alta"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  responsible: z.string().min(1, "Responsável é obrigatório"),
  checklist: z.array(z.object({ text: z.string().min(1, "Item não pode ser vazio") })).optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventItem extends EventFormValues {
  id: string;
  status: "Pendente" | "Realizado" | "Cancelado";
  checklist: { id: string; text: string; done: boolean }[];
}

export default function AgendaPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.agenda.getAll();
        setEvents(data.map((e: any) => ({
          id: e.id,
          name: e.titulo || '',
          description: e.descricao || '',
          startDate: e.data_inicio ? e.data_inicio.split('T')[0] : '',
          endDate: e.data_fim ? e.data_fim.split('T')[0] : '',
          responsible: e.responsavel || '',
          priority: e.prioridade || 'Média',
          status: e.status || 'Pendente',
          checklist: []
        })));
      } catch (err: any) {
        toast.error('Erro ao carregar agenda: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      priority: "Média",
      checklist: [{ text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "checklist",
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = {
        titulo: data.name,
        descricao: data.description,
        data_inicio: data.startDate,
        data_fim: data.endDate || null,
        responsavel: data.responsible,
        prioridade: data.priority,
        status: 'Pendente'
      };
      const created = await api.agenda.create(payload);

      const newEvent: EventItem = {
        ...data,
        id: created.id,
        status: "Pendente",
        checklist: (data.checklist || []).map((item, index) => ({
          id: `chk-${index}-${Math.random()}`,
          text: item.text,
          done: false,
        })),
      };
      
      setEvents((prev) => [...prev, newEvent]);
      toast.success("Evento criado com sucesso!");
      closeModal();
    } catch (err: any) {
      toast.error('Erro ao criar evento: ' + err.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset({
      name: "",
      priority: "Média",
      description: "",
      startDate: "",
      endDate: "",
      responsible: "",
      checklist: [{ text: "" }],
    });
  };

  const updateEventStatus = async (id: string, status: "Realizado" | "Cancelado") => {
    try {
      await api.agenda.update(id, { status });
      setEvents(events.map(ev => ev.id === id ? { ...ev, status } : ev));
      if (status === "Realizado") toast.success("Evento marcado como realizado!");
      if (status === "Cancelado") toast("Evento cancelado", { icon: "⚠️" });
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.agenda.remove(id);
      setEvents(events.filter(ev => ev.id !== id));
      toast.success("Evento excluído!");
    } catch (err: any) {
      toast.error('Erro ao excluir evento: ' + err.message);
    }
  };

  const toggleChecklistItem = (eventId: string, checklistId: string) => {
    setEvents(events.map(ev => {
      if (ev.id !== eventId) return ev;
      return {
        ...ev,
        checklist: ev.checklist.map(item => 
          item.id === checklistId ? { ...item, done: !item.done } : item
        )
      };
    }));
  };

  const sortedEvents = [...events].sort((a, b) => {
    return compareAsc(new Date(a.startDate), new Date(b.startDate));
  });

  const priorityColors = {
    Baixa: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50",
    Média: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50",
    Alta: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50",
  };

  return (
    <div className="max-w-5xl w-full mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <div></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-black px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <CalendarPlus size={20} />
          Novo Evento
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {sortedEvents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300"
            >
              <CalendarBlank size={48} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Nenhum evento agendado</h3>
              <p className="text-slate-500 dark:text-slate-400">Clique em "Novo Evento" para começar.</p>
            </motion.div>
          ) : (
            sortedEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 transition-shadow hover:shadow-md ${
                  event.status === "Realizado" ? "border-green-300 bg-green-50/30" :
                  event.status === "Cancelado" ? "border-slate-200 dark:border-slate-700 opacity-60 grayscale" : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-semibold ${event.status === 'Cancelado' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                        {event.name}
                      </h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityColors[event.priority]}`}>
                        {event.priority}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-5">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
                        <CalendarBlank size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {format(new Date(event.startDate), "dd 'de' MMMM", { locale: ptBR })}
                          {event.endDate && event.endDate !== event.startDate && ` até ${format(new Date(event.endDate), "dd 'de' MMMM", { locale: ptBR })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
                        <User size={16} className="text-slate-400" />
                        <span>{event.responsible}</span>
                      </div>
                    </div>

                    {/* Logistics Checklist */}
                    {event.checklist && event.checklist.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                          <ListChecks size={16} />
                          Checklist Logístico
                        </h4>
                        <ul className="space-y-2">
                          {event.checklist.map((item) => (
                            <li key={item.id} className="flex items-start gap-3 group">
                              <button 
                                onClick={() => toggleChecklistItem(event.id, item.id)}
                                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                  item.done 
                                    ? "bg-blue-500 border-blue-500 text-white" 
                                    : "border-slate-300 bg-white dark:bg-slate-900 group-hover:border-blue-400"
                                }`}
                              >
                                {item.done && <CheckCircle size={14} weight="bold" />}
                              </button>
                              <span className={`text-sm transition-all ${item.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                                {item.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex lg:flex-col items-center justify-start lg:items-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                    {event.status === "Pendente" ? (
                      <>
                        <button 
                          onClick={() => updateEventStatus(event.id, "Realizado")}
                          className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium text-sm transition-colors border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 dark:border-green-800/50"
                        >
                          <CheckCircle size={18} /> Realizado
                        </button>
                        <button 
                          onClick={() => updateEventStatus(event.id, "Cancelado")}
                          className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          <WarningCircle size={18} /> Cancelar
                        </button>
                      </>
                    ) : (
                      <div className={`px-4 py-2 rounded-lg text-sm font-medium border mb-2 text-center w-full ${
                        event.status === "Realizado" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" : "bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                      }`}>
                        {event.status}
                      </div>
                    )}
                    
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="flex items-center gap-2 w-full justify-center px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-colors mt-auto"
                    >
                      <Trash size={18} /> Excluir
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Event Modal */}
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
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Cadastrar Novo Evento</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome do Evento</label>
                    <input 
                      {...register("name")}
                      type="text" 
                      placeholder="Ex: Comício no Bairro X"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1"><CalendarBlank size={16}/> Início</label>
                    <input 
                      {...register("startDate")}
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1"><CalendarBlank size={16}/> Fim (Opcional)</label>
                    <input 
                      {...register("endDate")}
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1"><Flag size={16}/> Prioridade</label>
                    <select 
                      {...register("priority")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1"><User size={16}/> Responsável Interno</label>
                    <input 
                      {...register("responsible")}
                      type="text" 
                      placeholder="Nome do responsável"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800 dark:text-white"
                    />
                    {errors.responsible && <p className="text-red-500 text-xs mt-1">{errors.responsible.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Descrição</label>
                  <textarea 
                    {...register("description")}
                    rows={3}
                    placeholder="Detalhes sobre o evento..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none text-slate-800 dark:text-white"
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                {/* Checklist Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <ListChecks size={18} className="text-blue-500" /> 
                      Checklist Logístico
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-3">
                        <input
                          {...register(`checklist.${index}.text` as const)}
                          type="text"
                          placeholder={`Item ${index + 1}`}
                          className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm text-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => append({ text: "" })}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-brand hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar item de checklist
                    </button>
                  </div>
                </div>

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
                    className="px-6 py-2.5 rounded-lg font-medium text-black bg-brand hover:bg-brand-hover transition-colors shadow-sm hover:shadow"
                  >
                    Salvar Evento
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




