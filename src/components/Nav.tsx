"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "选菜" },
  { href: "/quick-order", label: "快捷下单" },
  { href: "/dishes", label: "菜品管理" },
  { href: "/recommend", label: "随机推荐" },
  { href: "/history", label: "历史记录" },
  { href: "/stats", label: "数据统计" },
];

export default function Nav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? "bg-white/80 backdrop-blur-xl border-b border-stone-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-70 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm"
            >
              <UtensilsCrossed size={16} strokeWidth={1.5} className="text-stone-900" />
              <span className="text-sm font-semibold tracking-tight text-stone-900">
                幸福里
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-xs tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-full px-3 py-1.5 ${
                      isActive
                        ? "text-stone-900 font-medium bg-stone-100"
                        : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-all active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-stone-200 transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 py-3 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm tracking-wide font-medium px-3 py-2.5 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                    isActive ? "text-stone-900 bg-stone-50" : "text-stone-500 hover:text-stone-900 hover:bg-stone-50 active:bg-stone-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="关闭菜单"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-12 z-40 bg-black/5 backdrop-blur-[1px]"
        />
      )}
      {/* Spacer to prevent content from going under the fixed navbar */}
      <div className="h-12 sm:h-14"></div>
    </>
  );
}
