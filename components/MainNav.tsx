"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/squad", label: "Rosa" },
  { href: "/matches", label: "Partite" },
  { href: "/standings", label: "Classifica" },
  { href: "/news", label: "News" },
  { href: "/settings/notifications", label: "Notifiche" }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={active ? "nav-link nav-link-active" : "nav-link"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}