import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { IPhone } from "./iphone";

export function ComponentCard({
  name,
  title,
  description,
  category,
}: {
  name: string;
  title: string;
  description: string;
  category: string;
}) {
  return (
    <article className="collection-card">
      <Link
        to="/components/$name/"
        params={{ name }}
        className={`collection-visual visual-${name}`}
        aria-label={`Explore ${title.toLowerCase()}`}
      >
        <IPhone name={name} title={title} />
      </Link>
      <div className="collection-caption">
        <Link to="/components/$name/" params={{ name }}>
          <h3>{title}</h3>
          <ArrowUpRight size={15} />
        </Link>
        <p>{description}</p>
        <span>{category} · SwiftUI</span>
      </div>
    </article>
  );
}
