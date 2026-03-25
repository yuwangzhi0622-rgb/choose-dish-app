"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  Shuffle,
  Heart,
  CalendarDays,
  Home,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/", label: "点菜", icon: Home },
  { href: "/dishes", label: "管理", icon: UtensilsCrossed },
  { href: "/recommend", label: "随机", icon: Shuffle },
  { href: "/history", label: "记录", icon: CalendarDays },
  { href: "/stats", label: "统计", icon: BarChart3 },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:top-0 md:bottom-auto md:w-64 md:h-screen md:border-r md:border-t-0 md:shadow-none">
      {/* Logo/Brand for Desktop */}
      <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed className="text-orange-500" size={24} />
          幸福里私房菜
        </span>
      </div>

      <div className="flex justify-around items-center h-[4.5rem] max-w-lg mx-auto md:flex-col md:items-stretch md:justify-start md:h-auto md:p-4 md:gap-2 md:max-w-none">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full md:w-auto md:h-auto md:flex-row md:justify-start md:px-4 md:py-3 md:rounded-xl transition-colors ${
                isActive
                  ? "text-orange-600 md:bg-orange-50"
                  : "text-gray-400 hover:text-gray-900 md:hover:bg-gray-50"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="md:w-5 md:h-5" />
              <span className={`text-[10px] md:text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
