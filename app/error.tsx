"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return <p className="card">Errore: {error.message}</p>;
}

