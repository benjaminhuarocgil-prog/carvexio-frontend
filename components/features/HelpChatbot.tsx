"use client";

import { FormEvent, useState } from "react";
import { answer, ChatContext } from "../../lib/chatbot/engine";

type Message = { from: "bot" | "user"; text: string; options?: { label: string; value: string }[] };
export default function HelpChatbot() {
  const [open, setOpen] = useState(false); const [input, setInput] = useState(""); const [context, setContext] = useState<ChatContext>({});
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: "¡Hola! Soy el asistente de ayuda de Carvexio. Puedo orientarte sobre productos, talleres, compras, citas y mensajes." }]);
  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages(prev => [...prev, { from: "user", text: question }]);
    setInput(""); setLoading(true);
    try {
      const reply = await answer(question, context);
      setContext(reply.context ?? {});
      setMessages(prev => [...prev, { from: "bot", text: reply.text, options: reply.options }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "No pude consultar esa información ahora. Inténtalo de nuevo o pregunta sobre productos, talleres, compras o citas." }]);
    } finally { setLoading(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void ask(input); };
  return <div className="fixed bottom-5 right-5 z-[80] font-sans">
    {open && <div className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white"><div><p className="font-bold">Ayuda Carvexio</p><p className="text-xs text-orange-100">Asistente sin IA externa</p></div><button onClick={() => setOpen(false)} className="rounded-lg px-2 text-xl hover:bg-white/15" aria-label="Cerrar">×</button></div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((m, index) => <div key={index} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}><div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-5 ${m.from === "user" ? "rounded-br-md bg-orange-500 text-white" : "rounded-bl-md bg-white text-slate-700 shadow-sm"}`}><p>{m.text}</p>{m.options && <div className="mt-3 flex flex-wrap gap-2">{m.options.map(option => <button key={option.value} disabled={loading} onClick={() => void ask(option.value)} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50">{option.label}</button>)}</div>}</div></div>)}{loading && <div className="text-xs text-slate-400">Buscando información real...</div>}</div>
      <div className="border-t border-slate-100 p-3"><div className="mb-2 flex flex-wrap gap-1.5">{["Buscar productos", "Qué talleres hay", "Servicios disponibles", "Cómo compro"].map(x => <button key={x} disabled={loading} onClick={() => void ask(x)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200 disabled:opacity-50">{x}</button>)}</div><form onSubmit={submit} className="flex gap-2"><input disabled={loading} value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu pregunta..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-slate-100"/><button disabled={loading} className="rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">Enviar</button></form></div>
    </div>}
    <button onClick={() => setOpen(v => !v)} className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-2xl text-white shadow-lg shadow-orange-500/40 transition hover:scale-105" aria-label="Abrir ayuda">{open ? "×" : "💬"}</button>
  </div>;
}
