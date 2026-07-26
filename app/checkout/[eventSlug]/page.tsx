import CustomerApp from "@/app/customer/CustomerApp";
export default async function Page({ params }: { params: Promise<{ eventSlug: string }> }) { const { eventSlug } = await params; return <CustomerApp view="checkout" resourceId={eventSlug} />; }
