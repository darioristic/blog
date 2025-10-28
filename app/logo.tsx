"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Logo() {
  const pathname = usePathname();
  return (
    <span className="text-md md:text-lg whitespace-nowrap font-bold">
      {pathname === "/" ? (
        <span className="cursor-default pr-2">Dario Ristic</span>
      ) : (
        <Link
          href="/"
          className="hover:bg-neutral-200 dark:hover:bg-neutral-700 p-2 rounded-2xl -ml-2 transition-[background-color]"
        >
          Dario Ristic
        </Link>
      )}
    </span>
  );
}
