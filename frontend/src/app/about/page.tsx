import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  Gauge,
  LockKeyhole,
  Network,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";

const values = [
  {
    icon: Gauge,
    title: "Hiệu năng rõ ràng",
    description:
      "Cấu hình CPU, RAM, lưu trữ và băng thông được công khai theo từng gói để khách hàng dễ so sánh.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật theo lớp",
    description:
      "Nền tảng ưu tiên kiểm soát truy cập theo vai trò, quản lý phiên và ghi nhận các thao tác quản trị quan trọng.",
  },
  {
    icon: Network,
    title: "Sẵn sàng mở rộng",
    description:
      "Kiến trúc dịch vụ được tổ chức để có thể mở rộng thêm gói, bảng giá, khuyến mãi và quy trình chăm sóc khách hàng.",
  },
];

const platformHighlights = [
  "Quản lý dịch vụ, bảng giá và khuyến mãi tập trung",
  "Theo dõi Order, Contact và Affiliate bằng mã tham chiếu",
  "Thông báo trong hệ thống kết hợp email khi trạng thái thay đổi",
  "Customer Account cho khách hàng đã đăng ký",
  "Audit Log cho các thao tác quản trị quan trọng",
  "Docker Compose, SQL Server và CI cho quy trình triển khai",
];

const journey = [
  {
    step: "01",
    title: "Khám phá",
    description: "Khách hàng xem dịch vụ, cấu hình, bảng giá và chương trình khuyến mãi.",
  },
  {
    step: "02",
    title: "Gửi yêu cầu",
    description: "Order, Contact hoặc Affiliate được tạo và cấp mã tham chiếu để tra cứu.",
  },
  {
    step: "03",
    title: "Xử lý",
    description: "Admin và Editor tiếp nhận nghiệp vụ, cập nhật trạng thái và phản hồi khách hàng.",
  },
  {
    step: "04",
    title: "Theo dõi",
    description: "Khách hàng theo dõi yêu cầu qua tài khoản, thông báo, email hoặc trang tra cứu.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70 py-16 sm:py-20">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute left-[-8%] top-[-35%] size-[480px] rounded-full bg-brand-100/55 blur-3xl" />
          <div className="pointer-events-none absolute right-[-8%] bottom-[-65%] size-[420px] rounded-full bg-sky-100/60 blur-3xl" />

          <Container className="relative grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Về NovaCloud
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] text-navy-900 sm:text-5xl">
                Một nền tảng Cloud được thiết kế quanh trải nghiệm vận hành rõ ràng
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
                NovaCloud kết nối trải nghiệm khách hàng với quy trình quản trị dịch vụ,
                từ lúc khám phá gói Cloud đến khi gửi yêu cầu, theo dõi trạng thái và nhận hỗ trợ.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Khám phá dịch vụ <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/customers"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy-900 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  Câu chuyện khách hàng
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Cloud className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">NovaCloud Platform</p>
                    <p className="mt-0.5 text-xs text-muted">Service · Customer · Operations</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <PlatformCard icon={Server} title="Service Catalog" text="Gói dịch vụ và cấu hình" />
                  <PlatformCard icon={Database} title="SQL Server" text="Dữ liệu nghiệp vụ tập trung" />
                  <PlatformCard icon={Users} title="Customer Account" text="Yêu cầu và thông báo cá nhân" />
                  <PlatformCard icon={LockKeyhole} title="RBAC & Audit" text="Phân quyền và nhật ký hệ thống" />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-18">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Giá trị cốt lõi</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
                Tập trung vào sự ổn định, minh bạch và khả năng mở rộng
              </h2>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {values.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.045)]">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-navy-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-y border-slate-200/70 bg-surface/70 py-14 sm:py-18">
          <Container className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Nền tảng hoàn chỉnh</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
                Không chỉ là trang giới thiệu dịch vụ
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                NovaCloud kết nối các module public, customer và admin thành một luồng thống nhất để việc vận hành có thể theo dõi được từ đầu đến cuối.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {platformHighlights.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-18">
          <Container>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Customer Journey</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
                Một hành trình xuyên suốt từ dịch vụ đến chăm sóc
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {journey.map((item) => (
                <article key={item.step} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                  <span className="text-xs font-semibold tracking-[0.16em] text-brand-600">{item.step}</span>
                  <h3 className="mt-4 text-base font-semibold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-navy-900 px-6 py-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-8">
              <div>
                <p className="text-lg font-semibold">Sẵn sàng khám phá NovaCloud?</p>
                <p className="mt-1 text-sm text-blue-100/70">So sánh gói, xem giá hoặc gửi yêu cầu dịch vụ trong vài bước.</p>
              </div>
              <Link
                href="/pricing"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-navy-900 transition hover:bg-blue-50 sm:mt-0"
              >
                Xem bảng giá <ArrowRight className="size-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PlatformCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Server;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-surface/65 p-4">
      <Icon className="size-4 text-brand-600" />
      <p className="mt-3 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}
