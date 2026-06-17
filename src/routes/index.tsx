import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Medicure Smart Health Assistant" },
      { name: "description", content: "Smart health symptom checker and health assistant." },
    ],
  }),
});

function Home() {
  return (
    <iframe
      src="/index.html"
      title="Medicure Smart Health Assistant"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
