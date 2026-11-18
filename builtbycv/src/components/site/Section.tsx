export function Section({
  id,
  children,
  className = "",
  tone = "paper",
  labelledBy,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "white" | "sand" | "ink";
  labelledBy?: string;
}) {
  const tones = {
    paper: "bg-paper text-ink",
    white: "bg-white text-ink",
    sand: "bg-sand-100 text-ink",
    ink: "bg-ink text-paper",
  };
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${tones[tone]} py-20 sm:py-28 lg:py-32 ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  lede,
  align = "left",
  extra,
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  extra?: React.ReactNode;
}) {
  return (
    <div className={`mb-12 max-w-3xl sm:mb-16 ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 id={id} className="h2">
        {title}
      </h2>
      {lede && <p className="lede mt-5">{lede}</p>}
      {extra}
    </div>
  );
}
