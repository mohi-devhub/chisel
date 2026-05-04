export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      {params.payment === "success" ? (
        <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Payment received. Your account will update after Razorpay confirms the
          webhook.
        </div>
      ) : null}
      <div>Dashboard - coming soon</div>
    </main>
  );
}
