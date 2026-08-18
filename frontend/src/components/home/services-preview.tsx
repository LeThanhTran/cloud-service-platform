import Link from "next/link";
import {
  ArrowRight,
  CloudCog,
  Globe2,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";

const services = [
  {
    icon: CloudCog,
    title: "Cloud VPS",
    description: "Máy chủ ảo hiệu năng cao với ổ cứng NVMe SSD.",
  },
  {
    icon: Server,
    title: "Cloud Hosting",
    description: "Hosting tốc độ cao, bảo mật, tối ưu cho website.",
  },
  {
    icon: Globe2,
    title: "Domain",
    description: "Đăng ký tên miền nhanh chóng, quản lý tập trung.",
  },
  {
    icon: ShieldCheck,
    title: "SSL Certificate",
    description: "Chứng chỉ SSL bảo mật cho website và dịch vụ.",
  },
  {
    icon: Network,
    title: "Anti DDoS",
    description: "Bảo vệ hệ thống trước các cuộc tấn công DDoS.",
  },
];

export function ServicesPreview() {
  return (
    <section id="services" className="relative py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Dịch vụ nổi bật
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900 sm:text-4xl">
            Hạ tầng phù hợp cho từng nhu cầu
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            Từ website cá nhân đến hệ thống doanh nghiệp, NovaCloud cung cấp nền tảng linh hoạt để mở rộng khi bạn cần.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {services.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.055)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_45px_rgba(11,99,246,0.10)]"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon className="size-5" strokeWidth={1.9} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 min-h-[60px] text-[12.5px] leading-5 text-muted">{description}</p>
              <Link
                href="/services"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition group-hover:gap-2"
              >
                Xem chi tiết <ArrowRight className="size-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
