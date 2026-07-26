import OperationsDashboard from "@/app/operations/OperationsDashboard";

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  return <OperationsDashboard role="organizer" segments={segments} />;
}
