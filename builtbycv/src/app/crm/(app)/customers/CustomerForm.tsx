import { saveCustomer } from "@/app/crm/actions";
import type { Customer } from "@/lib/db/schema";
import { primaryBtn } from "@/components/crm/ui";

export function CustomerForm({ c }: { c?: Customer }) {
  const f = (name: keyof Customer, label: string, type = "text", auto?: string) => (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input name={name} type={type} autoComplete={auto} defaultValue={(c?.[name] as string) ?? ""} required={name === "firstName"} className="field min-h-10 py-2 text-sm" />
    </label>
  );
  return (
    <form action={saveCustomer} className="grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      {f("firstName", "First name *", "text", "given-name")}
      {f("lastName", "Last name", "text", "family-name")}
      {f("phone", "Phone", "tel", "tel")}
      {f("email", "Email", "email", "email")}
      <div className="sm:col-span-2">{f("address", "Street address", "text", "street-address")}</div>
      {f("city", "City", "text", "address-level2")}
      {f("zip", "ZIP", "text", "postal-code")}
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span className="text-xs font-medium text-muted">Notes</span>
        <textarea name="notes" rows={3} defaultValue={c?.notes ?? ""} className="field text-sm" />
      </label>
      <div className="sm:col-span-2"><button className={primaryBtn}>{c ? "Save customer" : "Create customer"}</button></div>
    </form>
  );
}
