import { withHeadingId } from "./utils";

export function H3({ children }) {
  return (
    <h3 className="group font-bold text-lg my-8 relative text-neutral-900 dark:text-gray-100">
      {withHeadingId(children)}
    </h3>
  );
}
