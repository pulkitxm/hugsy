import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type PreviewDefinition, previewScreen } from "../../registry/preview";
import { IPhone } from "./iphone";

export function ComponentCard({
  name,
  title,
  description,
  category,
  frameworks,
  preview,
}: {
  name: string;
  title: string;
  description: string;
  category: string;
  frameworks: string[];
  preview?: PreviewDefinition | undefined;
}) {
  return (
    <article className="collection-card">
      <Link
        to="/components/$name/"
        params={{ name }}
        className={`collection-visual visual-${name}`}
        aria-label={`Explore ${title.toLowerCase()}`}
      >
        {preview ? (
          <IPhone name={name} title={title} asset={previewScreen(preview).asset} />
        ) : (
          <span className="nonvisual-preview">{frameworks.join(" + ")}</span>
        )}
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
