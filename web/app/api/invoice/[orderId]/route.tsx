import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "phase2" },
});

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 1. Fetch Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Fetch User Profile
    const { data: user } = await supabase
      .from("users")
      .select("username")
      .eq("id", order.user_id)
      .single();

    // 3. Fetch Course Name
    let courseName = "Premium Course";
    if (order.course_id) {
      const { data: course } = await supabasePublic
        .from("maincourses")
        .select("title")
        .eq("id", order.course_id)
        .single();
      if (course) courseName = course.title;
    } else if (order.bundle_id) {
      const { data: bundle } = await supabase
        .from("bundles")
        .select("bundle_name")
        .eq("id", order.bundle_id)
        .single();
      if (bundle) courseName = bundle.bundle_name;
    }

    const clientName = user?.username || "Valued Customer";
    const date = new Date(order.created_at || new Date()).toLocaleDateString();

    // 4. Generate PDF Stream
    const stream = await renderToStream(
      <InvoicePDF 
        invoiceNumber={String(order.id).split('-')[0].toUpperCase()}
        date={date}
        clientName={clientName}
        clientPhone={order.phone_number || "N/A"}
        itemName={courseName}
        amount={order.amount}
      />
    );

    // Convert NodeJS ReadableStream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${String(order.id).split('-')[0].toUpperCase()}.pdf"`
      }
    });

  } catch (err: any) {
    console.error("[invoice-generation] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate invoice", details: err?.message || err?.toString() || "Unknown error" },
      { status: 500 }
    );
  }
}
