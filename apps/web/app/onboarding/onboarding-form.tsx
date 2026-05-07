"use client";

import { ApiError } from "@teachflow/api-client";
import { Button, Card, Input, Select } from "@teachflow/ui";
import { slugify } from "@teachflow/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB",
  "PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export function OnboardingForm() {
  const api = useApiClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-deriva o slug do nome enquanto o usuário não tocar manualmente.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.branches.create({
        name: name.trim(),
        slug: slug.trim(),
        cnpj: cnpj.trim() || null,
        city: city.trim() || null,
        state: state || null,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`[${e.status}] ${e.detail}`);
      } else {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome da filial"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Cursinho Centro"
      />
      <Input
        label="Slug"
        required
        value={slug}
        onChange={(event) => {
          setSlug(event.target.value);
          setSlugTouched(true);
        }}
        helper="Identificador único na URL. Pode editar livremente."
        placeholder="cursinho-centro"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Cidade"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="São Paulo"
        />
        <Select
          label="UF"
          value={state}
          onChange={(event) => setState(event.target.value)}
        >
          <option value="">—</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="CNPJ (opcional)"
        value={cnpj}
        onChange={(event) => setCnpj(event.target.value)}
        helper="Apenas dígitos. Pode preencher depois."
        placeholder="00.000.000/0000-00"
      />

      {error && (
        <Card tone="blush" padding="sm">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="lg" loading={loading} iconRight="arrow-right">
          Criar filial e entrar
        </Button>
      </div>
    </form>
  );
}
