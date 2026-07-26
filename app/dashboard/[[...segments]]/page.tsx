import CustomerApp from "@/app/customer/CustomerApp";
/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DashboardPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  const [section, id] = segments;
  const view = !section ? "overview" : section === "tickets" && id ? "ticket" : section === "orders" && id ? "order" : section;
  return <CustomerApp view={view as any} resourceId={id} />;
}
