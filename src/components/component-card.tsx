import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function ComponentCard({
  name,
  title,
  description,
  category,
  frameworks,
}: {
  name: string;
  title: string;
  description: string;
  category: string;
  frameworks: string[];
}) {
  return (
    <article className="collection-card">
      <Link
        to="/components/$name/"
        params={{ name }}
        className={`collection-visual visual-${name}`}
        aria-label={`Explore ${title.toLowerCase()}`}
      >
        <span className="nonvisual-preview">{frameworks.join(" + ")}</span>
      </Link>
      <div className="collection-caption">
        <Link to="/components/$name/" params={{ name }}>
          <h3>{title}</h3>
          <ArrowUpRight size={15} />
        </Link>
        <p>{description}</p>
        <span>
          {category} · {frameworks.join(" · ")}
        </span>
      </div>
    </article>
  );
}
