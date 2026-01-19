"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Logo() {
  const pathname = usePathname();
  return (
    <span className="text-md md:text-lg whitespace-nowrap font-bold text-neutral-900 dark:text-gray-100">
      {pathname === "/" ? (
        <span className="cursor-default pr-2">Dario Ristic</span>
      ) : (
        <Link
          href="/"
          className="group p-2 no-underline hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl -ml-2 transition-[background-color]"
        >
          <span className="group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 rounded-xl py-0.5 px-1.5 inline-flex">
            Dario Ristic
          </span>
        </Link>
      )}
    </span>
  );
}
