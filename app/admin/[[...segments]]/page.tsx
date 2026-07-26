import OperationsDashboard from "@/app/operations/OperationsDashboard";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  return <OperationsDashboard role="admin" segments={segments} />;
}
