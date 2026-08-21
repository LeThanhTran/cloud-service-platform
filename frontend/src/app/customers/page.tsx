import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Quote,
  Rocket,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";

const stories = [
  {
    icon: ShoppingBag,
    company: "Mekong Retail",
    industry: "E-commerce",
    title: "Ổn định luồng bán hàng khi nhu cầu tăng cao",
    description:
      "Mô hình sử dụng Cloud VPS giúp hệ thống bán hàng có cấu hình tài nguyên rõ ràng và dễ nâng cấp theo nhu cầu vận hành.",
    metric: "Cloud VPS",
  },
  {
    icon: GraduationCap,
    company: "DeltaEdu",
    industry: "Education",
    title: "Tập trung quản lý dịch vụ trên một nền tảng",
    description:
      "Các gói dịch vụ, bảng giá và yêu cầu hỗ trợ được tổ chức tập trung để đội ngũ dễ theo dõi hơn trong quá trình vận hành.",
    metric: "Hosting",
  },
  {
    icon: Rocket,
    company: "Lotus Studio",
    industry: "Digital Agency",
    title: "Rút ngắn thời gian theo dõi yêu cầu khách hàng",
    description:
      "Reference Code, Customer Account và Notification giúp khách hàng chủ động xem trạng thái mà không cần hỏi lại nhiều lần.",
    metric: "Customer Portal",
  },
];

const testimonials = [
  {
    initials: "NA",
    name: "Nguyễn Văn An",
    role: "CTO · Mekong Retail",
    quote:
      "NovaCloud giúp quy trình theo dõi dịch vụ trở nên rõ ràng hơn. Nhóm kỹ thuật có thể kiểm tra cấu hình và trạng thái yêu cầu trên cùng một hệ thống.",
  },
  {
    initials: "TL",
    name: "Trần Minh Long",
    role: "Operations · DeltaEdu",
    quote:
      "Điểm tôi đánh giá cao là khách hàng có mã tra cứu riêng và vẫn có thể xem lại lịch sử sau khi tạo tài khoản bằng đúng email.",
  },
  {
    initials: "HP",
    name: "Hoàng Phương",
    role: "Founder · Lotus Studio",
    quote:
      "Giao diện quản trị tách rõ phần dịch vụ, bảng giá và xử lý yêu cầu nên việc demo quy trình cho đội ngũ khá trực quan.",
  },
  {
    initials: "MT",
    name: "Mai Trang",
    role: "Product Lead · SaaSHub",
    quote:
      "Thông báo trong hệ thống kết hợp email giúp luồng cập nhật trạng thái dễ theo dõi và giảm việc trao đổi thủ công.",
  },
];

const customerNames = ["Mekong Retail", "DeltaEdu", "Lotus Studio", "SaaSHub", "NovaWorks", "BlueRiver"];

export default function CustomersPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70 py-16 text-center sm:py-20">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="pointer-events-none absolute left-1/2 top-[-100%] size-[620px] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
          <Container className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Khách hàng NovaCloud</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
              Những câu chuyện xoay quanh trải nghiệm Cloud rõ ràng hơn
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Các tình huống bên dưới là dữ liệu minh họa cho bản demo NovaCloud, thể hiện cách nền tảng hỗ trợ nhiều nhóm nhu cầu khác nhau.
            </p>

            <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2.5">
              {customerNames.map((name) => (
                <span key={name} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  {name}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-18">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Customer Stories</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
                  Ba tình huống triển khai tiêu biểu
                </h2>
              </div>
              <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Xem dịch vụ <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {stories.map(({ icon: Icon, company, industry, title, description, metric }) => (
                <article key={company} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_42px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="size-5" />
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">{metric}</span>
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{industry}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-navy-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold text-navy-900">{company}</p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-y border-slate-200/70 bg-surface/70 py-14 sm:py-18">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Testimonials</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
                Khách hàng nói gì về trải nghiệm NovaCloud
              </h2>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-2">
              {testimonials.map((item) => (
                <article key={item.name} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.045)]">
                  <div className="flex items-center justify-between">
                    <Quote className="size-7 text-brand-100" fill="currentColor" />
                    <div className="flex gap-1 text-amber-400" aria-label="5 sao">
                      {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="size-3.5" fill="currentColor" />)}
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-600">“{item.quote}”</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {item.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-18">
          <Container>
            <div className="grid overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.06)] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="bg-navy-900 p-7 text-white sm:p-9">
                <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-sky-300">
                  <Users className="size-5" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">Bạn đang tìm cấu hình phù hợp?</h2>
                <p className="mt-3 text-sm leading-6 text-blue-100/70">
                  Gửi yêu cầu để đội ngũ NovaCloud tiếp nhận nhu cầu và bạn có thể theo dõi tiến trình bằng Reference Code.
                </p>
              </div>

              <div className="flex flex-col justify-center gap-4 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">NovaCloud for Business</p>
                    <p className="mt-1 text-xs text-muted">Cloud VPS · Hosting · Domain · hỗ trợ vận hành</p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Liên hệ tư vấn <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
