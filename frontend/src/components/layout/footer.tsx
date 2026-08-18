import Link from "next/link";
import { Code, Globe, Mail, MapPin, Phone, Users } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Container } from "@/components/ui/container";

const productLinks = ["Cloud VPS", "Cloud Hosting", "Domain", "SSL Certificate", "Anti DDoS"];
const supportLinks = ["Tài liệu hướng dẫn", "Câu hỏi thường gặp", "Chính sách dịch vụ", "Liên hệ hỗ trợ"];
const communityLinks = [
  { label: "Website", icon: Globe },
  { label: "Developer", icon: Code },
  { label: "Cộng đồng", icon: Users },
];

export function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300">
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.2fr] lg:gap-12">
        <div>
          <Brand inverse />
          <p className="mt-4 max-w-[290px] text-sm leading-6 text-slate-400">
            Hạ tầng Cloud mạnh mẽ, đồng hành cùng doanh nghiệp trong hành trình chuyển đổi số.
          </p>
          <div className="mt-5 flex gap-2">
            {communityLinks.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                title={label}
                className="grid size-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Sản phẩm" items={productLinks} />
        <FooterColumn title="Hỗ trợ" items={supportLinks} />

        <div>
          <p className="text-sm font-semibold text-white">Liên hệ</p>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0" /> Hotline: 1900 1234</p>
            <p className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0" /> support@novacloud.vn</p>
            <p className="flex gap-3 leading-6"><MapPin className="mt-0.5 size-4 shrink-0" /> Đồng Tháp, Việt Nam</p>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 NovaCloud. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-slate-300">Điều khoản</Link>
            <Link href="#" className="hover:text-slate-300">Bảo mật</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <Link key={item} href="#" className="text-sm text-slate-400 transition hover:text-white">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
