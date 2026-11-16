"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Service = { id: string; name: string };

const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors focus:border-accent focus:outline-none";

export function ServiceRequestForm({ slug, services }: { slug: string; services: Service[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [window, setWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!serviceId) return setError("Escolha um serviço.");
    if (name.trim().length < 2) return setError("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Informe um telefone com DDD.");
    if (!consent) return setError("Aceite o uso dos seus dados para enviar.");

    startSubmit(async () => {
      const { data, error: rpcError } = await createClient().rpc("public_request_service", {
        p_slug: slug,
        p_service_id: serviceId,
        p_name: name.trim(),
        p_phone: phone,
        p_window: window.trim() || null,
        p_notes: notes.trim() || null,
        p_email: email.trim() || null,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setDone((data as { token: string }).token);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-background p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-3xl tracking-tight">Pedido enviado</h3>
          <p className="mt-2 text-sm text-muted-foreground">A empresa vai analisar e responder. Você pode acompanhar pelo link abaixo.</p>
        </div>
        <Link
          href={`/solicitacao?token=${done}`}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Acompanhar pedido
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-background p-6 md:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm md:col-span-2">
        <span className="text-muted-foreground">Serviço</span>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputClass}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-muted-foreground">Nome completo</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-muted-foreground">Telefone / WhatsApp</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" autoComplete="tel" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-muted-foreground">E-mail (opcional)</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-muted-foreground">Melhor período (opcional)</span>
        <input value={window} onChange={(e) => setWindow(e.target.value)} placeholder="Manhã de terça" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm md:col-span-2">
        <span className="text-muted-foreground">Descreva o que precisa (opcional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-muted-foreground md:col-span-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        Concordo que a empresa use meu nome e telefone para responder este pedido.
      </label>
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive md:col-span-2">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex h-11 w-fit items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 md:col-span-2"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Pedir orçamento
      </button>
    </form>
  );
}
