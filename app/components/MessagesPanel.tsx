"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";

type Contact = {
  businessId: number;
  clientId?: number;
  name: string;
  imageUrl?: string;
  unreadCount: number;
};

type Message = {
  id: number;
  content: string;
  createdAt: string;
  mine: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
};

export default function MessagesPanel({ mode }: { mode: "client" | "business" }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const attachmentRef = useRef<HTMLInputElement | null>(null);

  const loadContacts = useCallback(async () => {
    const data = await apiFetch<Contact[]>(`/messages/contacts?mode=${mode}`);
    setContacts(Array.isArray(data) ? data : []);
  }, []);

  const loadConversation = useCallback(async (contact: Contact, silent = false) => {
    try {
      const params = new URLSearchParams({ businessId: String(contact.businessId) });
      params.set("mode", mode);
      if (mode === "business" && contact.clientId) params.set("clientId", String(contact.clientId));
      const data = await apiFetch<Message[]>(`/messages/conversation?${params.toString()}`);
      setMessages(Array.isArray(data) ? data : []);
      if (!silent) await loadContacts();
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "No se pudo cargar la conversación");
    }
  }, [loadContacts, mode]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadContacts()
      .catch(err => active && setError(err instanceof Error ? err.message : "No se pudieron cargar los contactos"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [loadContacts]);

  useEffect(() => {
    if (!selected) return;
    void loadConversation(selected);
    const timer = window.setInterval(() => void loadConversation(selected, true), 3000);
    return () => window.clearInterval(timer);
  }, [selected, loadConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chooseContact = (contact: Contact) => {
    setError(null);
    setSelected(contact);
    setMessages([]);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !text.trim() || sending) return;
    try {
      setSending(true);
      await apiFetch(`/messages?mode=${mode}`, {
        method: "POST",
        body: JSON.stringify({
          businessId: selected.businessId,
          ...(mode === "business" ? { clientId: selected.clientId } : {}),
          content: text.trim(),
        }),
      });
      setText("");
      await Promise.all([loadConversation(selected, true), loadContacts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (file: File) => {
    if (!selected || sending) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Solo puedes enviar imágenes o archivos PDF."); return;
    }
    try {
      setSending(true); setError(null);
      const form = new FormData();
      form.append("file", file); form.append("businessId", String(selected.businessId));
      if (mode === "business" && selected.clientId) form.append("clientId", String(selected.clientId));
      form.append("content", text.trim());
      await apiFetch(`/messages/attachment?mode=${mode}`, { method: "POST", body: form });
      setText("");
      await Promise.all([loadConversation(selected, true), loadContacts()]);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo enviar el archivo."); }
    finally { setSending(false); }
  };

  const contactLabel = mode === "client" ? "negocios" : "clientes";
  const emptyText = mode === "client"
    ? "Aún no tienes compras ni reservas para iniciar una conversación."
    : "Aún no tienes clientes con compras o reservas.";

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mensajes</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "client" ? "Consulta directamente con los negocios donde compraste o reservaste." : "Responde las consultas de tus clientes en un solo lugar."}
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-800">
            Tus {contactLabel}
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-400">Cargando...</p>
          ) : contacts.length === 0 ? (
            <p className="p-5 text-sm leading-6 text-slate-500">{emptyText}</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto md:max-h-[500px]">
              {contacts.map(contact => (
                <button key={`${contact.businessId}-${contact.clientId ?? "me"}`} onClick={() => chooseContact(contact)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${selected?.businessId === contact.businessId && selected?.clientId === contact.clientId ? "bg-orange-50" : ""}`}>
                  {contact.imageUrl ? (
                    <img src={contact.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{contact.name?.[0]?.toUpperCase() ?? "?"}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{contact.name}</span>
                    <span className="block text-xs text-slate-400">Abrir conversación</span>
                  </span>
                  {contact.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{contact.unreadCount > 99 ? "99+" : contact.unreadCount}</span>}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[440px] flex-col">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-500">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">💬</div>
              <p className="font-semibold text-slate-700">Selecciona un contacto</p>
              <p className="mt-1 text-sm">Aquí podrás iniciar y continuar la conversación.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                {selected.imageUrl ? <img src={selected.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{selected.name?.[0]?.toUpperCase()}</span>}
                <div><p className="font-semibold text-slate-900">{selected.name}</p><p className="text-xs text-emerald-600">Conversación activa</p></div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
                {messages.length === 0 ? <p className="mt-16 text-center text-sm text-slate-400">Todavía no hay mensajes. Escribe el primero.</p> : messages.map(message => (
                  <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${message.mine ? "rounded-br-md bg-orange-500 text-white" : "rounded-bl-md bg-blue-500 text-white"}`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {message.attachmentUrl && (message.attachmentType?.startsWith("image/") ? <a href={message.attachmentUrl} target="_blank" rel="noreferrer"><img src={message.attachmentUrl} alt={message.attachmentName || "Imagen adjunta"} className="mt-2 max-h-56 rounded-xl object-cover" /></a> : <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold underline">📄 {message.attachmentName || "Abrir PDF"}</a>)}
                      <p className={`mt-1 text-[10px] ${message.mine ? "text-orange-100" : "text-blue-100"}`}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-3 border-t border-slate-100 p-4">
                <input ref={attachmentRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void sendAttachment(file); event.currentTarget.value = ""; }} />
                <button type="button" disabled={sending} onClick={() => attachmentRef.current?.click()} title="Adjuntar foto o PDF" className="rounded-xl border border-slate-200 px-3 text-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50">📎</button>
                <input value={text} onChange={event => setText(event.target.value)} maxLength={2000} placeholder="Escribe un mensaje..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                <button disabled={!text.trim() || sending} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
