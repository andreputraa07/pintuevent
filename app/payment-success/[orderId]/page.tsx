import CustomerApp from "@/app/customer/CustomerApp";
export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <CustomerApp view="payment-success" resourceId={orderId} />;
}
