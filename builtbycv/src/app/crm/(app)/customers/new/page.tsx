import { requireUser } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/crm/ui";
import { CustomerForm } from "../CustomerForm";

export const metadata = { title: "New customer" };

export default async function NewCustomer() {
  await requireUser("customers:write");
  return (
    <>
      <PageHeader back={{ href: "/crm/customers", label: "Customers" }} title="New customer" />
      <Panel><CustomerForm /></Panel>
    </>
  );
}
