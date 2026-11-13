import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  eachDayOfInterval, eachMonthOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { agendaAPI } from "../../lib/api";
import { dateKey, getCalendarRange, moveCalendar } from "../../lib/calendar";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const VIEWS = [["month", "Mês"], ["week", "Semana"], ["year", "Ano"]];
const formatDate = (date, pattern) => format(date, pattern, { locale: ptBR });
const itemKey = item => `${item.source}:${item.id}`;

export default function AgendaPage() {
  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", date: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const dialogRef = useRef(null);
  const today = new Date();
  const range = getCalendarRange(anchor, view);
  const startDate = dateKey(range.start);
  const endDate = dateKey(range.end);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    agendaAPI.getAll({ startDate, endDate })
      .then(response => {
        if (active) setItems(response.data.data.items);
      })
      .catch(error => {
        if (active) {
          setItems([]);
          setLoadError(error.response?.data?.message || "Erro ao carregar a agenda");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [startDate, endDate, refresh]);

  useEffect(() => {
    if (modal) dialogRef.current.showModal();
  }, [modal]);

  const byDate = new Map();
  for (const item of items) {
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date).push(item);
  }
  const days = eachDayOfInterval(range);
  const title = view === "year"
    ? formatDate(anchor, "yyyy")
    : view === "week"
      ? `${formatDate(range.start, "dd/MM/yyyy")} – ${formatDate(range.end, "dd/MM/yyyy")}`
      : formatDate(anchor, "MMMM 'de' yyyy");

  function selectDay(day) {
    setSelectedDate(day);
    setAnchor(day);
    if (view === "year") setView("month");
  }

  function openCreate(date = selectedDate) {
    setForm({ title: "", date: dateKey(date), description: "" });
    setFormError("");
    setModal({ type: "create" });
  }

  async function createEntry(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setFormError("Informe o título do evento");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await agendaAPI.create({ ...form, title: form.title.trim() });
      const date = parseISO(response.data.data.item.date);
      setAnchor(date);
      setSelectedDate(date);
      setRefresh(value => value + 1);
      setModal(null);
      toast.success("Evento adicionado à agenda!");
    } catch (error) {
      setFormError(error.response?.data?.errors?.[0]?.message
        || error.response?.data?.message || "Erro ao criar evento");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(item) {
    if (!window.confirm(`Remover o compromisso "${item.title}"? Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    setDeleteError("");
    try {
      await agendaAPI.delete(item.id);
      setItems(current => current.filter(entry => itemKey(entry) !== itemKey(item)));
      setModal(null);
      toast.success("Compromisso removido com sucesso!");
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Erro ao remover compromisso");
    } finally {
      setSaving(false);
    }
  }

  function renderItem(item) {
    return (
      <button
        key={itemKey(item)}
        type="button"
        onClick={() => { setDeleteError(""); setModal({ type: "detail", item }); }}
        className={`w-full rounded-lg px-2 py-1 text-left text-xs break-words focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${
          item.source === "event" ? "bg-teal/10 text-teal" : "bg-lime/10 text-lime"
        }`}
      >
        {item.title}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sora">Agenda</h1>
          <p className="text-muted mt-1">Seus eventos e compromissos em um só lugar.</p>
        </div>
        <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => openCreate()}>
          <Plus className="h-5 w-5" /> Novo evento
        </button>
      </div>

      <div className="card">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
              const date = new Date();
              setAnchor(date);
              setSelectedDate(date);
            }}>Hoje</button>
            <button type="button" className="rounded-lg p-2 hover:bg-white/10" aria-label="Período anterior"
              onClick={() => { const date = moveCalendar(anchor, view, -1); setAnchor(date); setSelectedDate(date); }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-white/10" aria-label="Próximo período"
              onClick={() => { const date = moveCalendar(anchor, view, 1); setAnchor(date); setSelectedDate(date); }}>
              <ChevronRight className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold capitalize" aria-live="polite">{title}</h2>
          </div>
          <div className="flex gap-1 rounded-xl border p-1" role="group" aria-label="Visualização do calendário">
            {VIEWS.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}
                className={`btn btn-sm ${view === value ? "btn-primary" : "text-muted hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
          <span><span className="text-lime">●</span> Compromissos pessoais</span>
          <span><span className="text-teal">●</span> Eventos de fotos</span>
        </div>

        {loading ? (
          <div role="status" className="flex items-center justify-center gap-3 py-24 text-muted">
            <Loader2 className="h-7 w-7 animate-spin text-lime" /> Carregando agenda...
          </div>
        ) : loadError ? (
          <div role="alert" className="py-16 text-center">
            <p className="mb-4 text-red-400">{loadError}</p>
            <button type="button" className="btn btn-secondary" onClick={() => setRefresh(value => value + 1)}>
              Tentar novamente
            </button>
          </div>
        ) : view === "year" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {eachMonthOfInterval(range).map(month => {
              const monthDays = eachDayOfInterval({
                start: startOfWeek(startOfMonth(month)),
                end: endOfWeek(endOfMonth(month)),
              });
              const count = items.filter(item => item.date.startsWith(format(month, "yyyy-MM"))).length;
              return (
                <section key={dateKey(month)} className="rounded-xl border p-4">
                  <button type="button" className="mb-3 w-full text-left font-semibold capitalize text-lime"
                    onClick={() => { setAnchor(month); setSelectedDate(month); setView("month"); }}>
                    {formatDate(month, "MMMM")} <span className="text-xs font-normal text-muted">({count} eventos)</span>
                  </button>
                  <div className="grid grid-cols-7 text-center text-xs">
                    {WEEKDAYS.map(day => <span key={day} className="pb-2 text-muted">{day.charAt(0)}</span>)}
                    {monthDays.map(day => {
                      if (!isSameMonth(day, month)) return <span key={dateKey(day)} />;
                      const count = byDate.get(dateKey(day))?.length || 0;
                      return (
                        <button key={dateKey(day)} type="button" onClick={() => selectDay(day)}
                          aria-label={`${formatDate(day, "dd 'de' MMMM 'de' yyyy")}, ${count} eventos`}
                          aria-current={isSameDay(day, today) ? "date" : undefined}
                          className={`relative rounded-lg py-2 hover:bg-white/10 ${isSameDay(day, today) ? "text-lime font-bold" : ""}`}>
                          {format(day, "d")}
                          {count > 0 && <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-lime" />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[630px]">
              <div className="grid grid-cols-7 text-center text-sm text-muted">
                {WEEKDAYS.map(day => <div key={day} className="pb-3">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 border-l border-t">
                {days.map(day => (
                  <div key={dateKey(day)} className={`min-w-0 border-b border-r p-2 ${
                    view === "week" ? "min-h-[320px]" : "min-h-[125px]"
                  } ${isSameDay(day, selectedDate) ? "bg-white/5" : ""}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <button type="button" onClick={() => selectDay(day)}
                        aria-label={formatDate(day, "dd 'de' MMMM 'de' yyyy")}
                        aria-current={isSameDay(day, today) ? "date" : undefined}
                        className={`h-8 w-8 rounded-full text-sm ${
                          isSameDay(day, today) ? "bg-lime text-dark font-bold"
                            : !isSameMonth(day, anchor) && view === "month" ? "text-muted" : "hover:bg-white/10"
                        }`}>
                        {format(day, "d")}
                      </button>
                      <button type="button" onClick={() => openCreate(day)} className="rounded p-1 text-muted hover:text-lime"
                        aria-label={`Criar evento em ${formatDate(day, "dd/MM/yyyy")}`}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="max-h-60 space-y-1 overflow-y-auto">
                      {(byDate.get(dateKey(day)) || []).map(renderItem)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <dialog ref={dialogRef} aria-labelledby="agenda-dialog-title"
          className="m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-dark-surface p-6 text-white backdrop:bg-black/70"
          onCancel={event => { event.preventDefault(); if (!saving) setModal(null); }}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 id="agenda-dialog-title" className="text-xl font-semibold break-words min-w-0">
              {modal.type === "create" ? "Novo evento na agenda" : modal.item.title}
            </h2>
            <button type="button" aria-label="Fechar" disabled={saving} onClick={() => setModal(null)} className="p-1 text-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          {modal.type === "create" ? (
            <form onSubmit={createEntry} className="space-y-4">
              <p className="text-sm text-muted">Crie um compromisso pessoal. Ele não cria um evento de venda de fotos.</p>
              <div>
                <label htmlFor="agenda-title" className="mb-1 block text-sm">Título</label>
                <input id="agenda-title" autoFocus required maxLength={255} className="input" value={form.title}
                  onChange={event => setForm({ ...form, title: event.target.value })} disabled={saving} />
              </div>
              <div>
                <label htmlFor="agenda-date" className="mb-1 block text-sm">Data</label>
                <input id="agenda-date" type="date" required className="input [color-scheme:dark]" value={form.date}
                  onChange={event => setForm({ ...form, date: event.target.value })} disabled={saving} />
              </div>
              <div>
                <label htmlFor="agenda-description" className="mb-1 block text-sm">Descrição</label>
                <textarea id="agenda-description" maxLength={5000} rows={4} className="input" value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })} disabled={saving} />
              </div>
              {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Salvando..." : "Salvar evento"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-lime">{formatDate(parseISO(modal.item.date), "dd 'de' MMMM 'de' yyyy")}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-muted">{modal.item.description || "Sem descrição."}</p>
              {modal.item.source === "event" && (
                <Link to={`/admin/events/${modal.item.id}`} className="btn btn-secondary inline-block">Ver evento de fotos</Link>
              )}
              {modal.item.source === "agenda" && (
                <div>
                  {deleteError && <p role="alert" className="mb-3 text-sm text-red-400">{deleteError}</p>}
                  <button type="button" className="btn btn-danger flex items-center gap-2 disabled:opacity-50"
                    disabled={saving} onClick={() => deleteEntry(modal.item)}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {saving ? "Removendo..." : "Remover compromisso"}
                  </button>
                </div>
              )}
            </div>
          )}
        </dialog>
      )}
    </div>
  );
}
