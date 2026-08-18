"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

const navigation = [
  { label: "Trang chủ", href: "/" },
  { label: "Dịch vụ", href: "/services" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Tin tức", href: "/news" },
  { label: "Đối tác", href: "/affiliate" },
  { label: "Liên hệ", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/96 backdrop-blur-md">
      <Container className="flex h-[66px] items-center justify-between">
        <Brand />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
          {navigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative py-6 text-[12.5px] font-medium transition ${
                index === 0 ? "text-brand-600" : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {item.label}
              {index === 0 && (
                <span className="absolute inset-x-0 bottom-0 mx-auto h-[2px] w-5 rounded-full bg-brand-600" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <ButtonLink href="/admin/login" className="h-10 rounded-[10px] px-4 text-[12px]">
            Đăng nhập
          </ButtonLink>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg border border-line text-navy-900 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Đóng menu" : "Mở menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-surface hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink href="/admin/login" className="mt-3 w-full">
              Đăng nhập
            </ButtonLink>
          </Container>
        </div>
      )}
    </header>
  );
}
