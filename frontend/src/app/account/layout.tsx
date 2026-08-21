import { AccountShell } from "@/components/account/account-shell";
import { CustomerGuard } from "@/components/account/customer-guard";

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CustomerGuard>
      <AccountShell>{children}</AccountShell>
    </CustomerGuard>
  );
}
