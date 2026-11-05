import { Link } from "@tanstack/react-router";
import { components } from "../../generated/components";

export function ComponentList() {
  return (
    <ul className="component-list">
      {components.map((item) => (
        <li key={item.name}>
          <Link to="/components/$name/" params={{ name: item.name }}>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
            <small>{item.technique}</small>
          </Link>
        </li>
      ))}
    </ul>
  );
}
