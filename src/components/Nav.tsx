"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  Shuffle,
  Heart,
  CalendarDays,
  ChefHat,
} from "lucide-react";

const navItems = [
  { href: "/", label: "首页", icon: ChefHat },
  { href: "/dishes", label: "菜品", icon: UtensilsCrossed },
  { href: "/recommend", label: "推荐", icon: Shuffle },
  { href: "/favorites", label: "收藏", icon: Heart },
  { href: "/history", label: "记录", icon: CalendarDays },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
