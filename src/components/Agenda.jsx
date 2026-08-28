import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

/** Devuelve la cadena YYYY-MM-DD de una fecha local (sin conversión UTC) */
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Devuelve el número de días del mes de una fecha */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Devuelve el índice de día de la semana (0=Dom) del primer día del mes */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Agenda() {
  const { agenda, clientes, obras, tecnicos, createAgendaEvent, removeAgendaEvent } = useApp();

  const today = new Date();

  // viewDate controla qué mes está visible en el calendario
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  // selectedDate controla el día seleccionado en vista diaria
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState('Month');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stockError, setStockError] = useState('');

  const defaultNewEvent = () => ({
    title: '',
    clienteId: clientes[0]?.id || '',
    obraId: '',
    tecnicoId: tecnicos[0]?.id || '',
    fecha: toLocalDateString(today),
    hora: '09:00',
    duracion: '2 hs',
    direccion: '',
    notes: ''
  });

  const [newEvent, setNewEvent] = useState(defaultNewEvent);

  // ─── Navegación de mes ──────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(t);
    setViewMode('Day');
  };

  // ─── Datos del mes visible ──────────────────────────────────────────────────

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDayOffset = getFirstDayOfMonth(viewYear, viewMonth);

  const todayStr = toLocalDateString(today);

  /** Filtra eventos del agenda que corresponden a un día dado */
  const getEventsForDay = (dayNum) => {
    const y = String(viewYear);
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const prefix = `${y}-${m}-${d}`;
    return agenda.filter(ev => ev.start && ev.start.startsWith(prefix));
  };

  /** Filtra eventos de la vista diaria */
  const getEventsForSelectedDay = () => {
    const prefix = toLocalDateString(selectedDate);
    return agenda.filter(ev => ev.start && ev.start.startsWith(prefix));
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleDayClick = (dayNum) => {
    const clicked = new Date(viewYear, viewMonth, dayNum);
    setSelectedDate(clicked);
    setViewMode('Day');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title?.trim() || !newEvent.clienteId) return;

    const cli = clientes.find(c => c.id === newEvent.clienteId);
    const tech = tecnicos.find(t => t.id === newEvent.tecnicoId);

    try {
      await createAgendaEvent({
        title: newEvent.title.trim(),
        start: `${newEvent.fecha}T${newEvent.hora}:00`,
        clienteId: newEvent.clienteId,
        clienteNombre: cli ? cli.nombre : 'Particular',
        obraId: newEvent.obraId || '',
        tecnicoId: newEvent.tecnicoId || '',
        tecnicoNombre: tech ? `${tech.nombre} ${tech.apellido}` : 'Sin asignar',
        direccion: newEvent.direccion || (cli ? cli.direccion : '') || '',
        notes: newEvent.notes || ''
      });
      setNewEvent(defaultNewEvent());
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'No se pudo crear el evento.');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('¿Desea cancelar esta visita agendada?')) return;
    try {
      await removeAgendaEvent(id);
      setSelectedEvent(null);
    } catch (err) {
      alert(err.message || 'No se pudo cancelar la visita.');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Agenda</h2>
          <p className="text-gray-400 text-sm">Organiza las visitas de presupuestación, relevamiento y jornadas de obra.</p>
        </div>
        <button
          onClick={() => {
            setNewEvent(defaultNewEvent());
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          Nueva Visita
        </button>
      </div>

      {/* NAVIGATION BAR */}
      <div className="flex items-center justify-between bg-[#1E293B] border border-[#334155] p-4 rounded-xl flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Prev / Next */}
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-[#334155] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base min-w-[160px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-[#334155] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleGoToToday}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* View toggle */}
        <div className="flex bg-[#0F1729] p-1 rounded-lg border border-[#334155]">
          {['Month', 'Day'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'Month' ? 'Mensual' : 'Diario'}
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTHLY VIEW ── */}
      {viewMode === 'Month' && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-lg p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-4">
            {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2" style={{ minHeight: '340px' }}>
            {/* Empty cells before first day */}
            {Array.from({ length: startDayOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="bg-[#111827]/20 rounded-lg border border-transparent" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dayStr === todayStr;
              const dayEvents = getEventsForDay(dayNum);

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`bg-[#111827]/40 hover:bg-[#16223F]/40 border rounded-lg p-2 flex flex-col gap-1 transition-colors cursor-pointer ${
                    isToday
                      ? 'border-blue-500 shadow-md shadow-blue-900/10 bg-[#16223F]/20'
                      : 'border-[#334155]'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                    {dayNum}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        className="text-[9px] bg-blue-600/20 border border-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-semibold truncate hover:bg-blue-600/30"
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-gray-500 text-center font-bold">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAILY VIEW ── */}
      {viewMode === 'Day' && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between border-b border-[#334155] pb-4 mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Day navigation */}
              <button
                onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))}
                className="p-1.5 hover:bg-[#334155] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-white text-sm">
                {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))}
                className="p-1.5 hover:bg-[#334155] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleGoToToday}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Ir a hoy
            </button>
          </div>

          <div className="space-y-3">
            {getEventsForSelectedDay().length === 0 ? (
              <p className="text-gray-500 text-xs py-8 text-center">
                No hay visitas o trabajos planificados para este día.
              </p>
            ) : (
              getEventsForSelectedDay().map((ev) => {
                const evTime = ev.start?.split('T')[1]?.slice(0, 5) || '09:00';
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 bg-[#111827]/60 hover:bg-[#16223F]/30 rounded-xl border border-[#334155] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600/10 text-blue-400 px-3 py-2 rounded-lg font-bold text-xs shrink-0 flex flex-col items-center justify-center">
                        <Clock className="w-4 h-4 mb-0.5" />
                        {evTime} hs
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                          {ev.clienteNombre}
                        </p>
                        {ev.direccion && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            {ev.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#1E293B] text-gray-300 px-2.5 py-1 rounded-full border border-[#475569] font-medium self-end md:self-center">
                      Téc: {ev.tecnicoNombre || 'Sin asignar'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <h3 className="font-bold text-white text-base">Ficha de Visita</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-gray-300">
              <div>
                <h4 className="text-base font-bold text-white">{selectedEvent.title}</h4>
                <p className="text-blue-400 font-semibold mt-1">
                  Horario: {new Date(selectedEvent.start).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="space-y-2 border-t border-[#334155] pt-4">
                <p><span className="font-semibold text-gray-500">Cliente:</span> {selectedEvent.clienteNombre}</p>
                <p><span className="font-semibold text-gray-500">Técnico Asignado:</span> {selectedEvent.tecnicoNombre || 'Sin asignar'}</p>
                {selectedEvent.direccion && (
                  <p><span className="font-semibold text-gray-500">Dirección:</span> {selectedEvent.direccion}</p>
                )}
                {selectedEvent.notes && (
                  <p className="border-t border-[#334155] pt-2 text-gray-400 italic">
                    <span className="font-bold text-gray-500 block not-italic">Notas internas:</span>
                    "{selectedEvent.notes}"
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  Cancelar Visita
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 bg-[#111827] hover:bg-[#16223F] border border-[#334155] text-white font-bold py-2 rounded-lg text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE EVENT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]/40">
              <div>
                <h3 className="font-bold text-white text-base">Programar Nueva Visita</h3>
                <p className="text-xs text-gray-400">Registra una visita para presupuesto o inicio de obra</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Título de Visita *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Visita de Presupuestación Durlock"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cliente *</label>
                  <select
                    required
                    value={newEvent.clienteId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, clienteId: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Vincular a Obra (Opcional)</label>
                  <select
                    value={newEvent.obraId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, obraId: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Ninguna</option>
                    {obras.map(o => (
                      <option key={o.id} value={o.id}>Obra #{o.numero}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Asignar Técnico</label>
                  <select
                    value={newEvent.tecnicoId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, tecnicoId: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Ninguno / Alexis</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newEvent.fecha}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={newEvent.hora}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-400 font-semibold mb-1">Dirección de Visita</label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para usar dir. del cliente"
                    value={newEvent.direccion}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo que debe llevar el técnico..."
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-[#0F1729] border border-[#334155] rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-6"
              >
                Agendar Visita
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
