import CustomerApp, { type CustomerView } from "@/app/customer/CustomerApp";

const customerViews = new Set<CustomerView>([
  "overview",
  "tickets",
  "orders",
  "favorites",
  "vouchers",
  "notifications",
  "profile",
  "settings",
]);

function resolveView(section?: string, resourceId?: string): CustomerView {
  if (!section) return "overview";
  if (section === "tickets" && resourceId) return "ticket";
  if (section === "orders" && resourceId) return "order";
  return customerViews.has(section as CustomerView)
    ? (section as CustomerView)
    : "overview";
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  const [section, resourceId] = segments;

  return (
    <CustomerApp
      view={resolveView(section, resourceId)}
      resourceId={resourceId}
    />
  );
}
