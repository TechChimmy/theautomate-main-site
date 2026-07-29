import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LEARNING_PORTAL_URL =
  process.env.LEARNING_PORTAL_URL ?? "https://your-learning-portal.com";
const DEFAULT_PASSWORD = "Welcome123!";

// ---------------------------------------------------------------------------
// Supabase client – scoped to the "phase-2" schema for table operations.
// Auth admin calls always go to the auth schema automatically.
// ---------------------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "phase2" },
});

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Razorpay SDK instance
// ---------------------------------------------------------------------------
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ---------------------------------------------------------------------------
// POST /api/razorpay/verify-payment
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------------
    // 1. Parse request body
    // ------------------------------------------------------------------
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      course_id,
      course_name,
      bundle_id,
      batch_type,
      customer_name,
      customer_email,
      customer_phone,
      customer_comments,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment fields." },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Verify Razorpay signature
    // ------------------------------------------------------------------
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isDevelopment = process.env.NODE_ENV === "development";
    
    if (expectedSignature !== razorpay_signature && !isDevelopment) {
      console.error("[verify-payment] Signature mismatch.");
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 3. Fetch payment details from Razorpay to get customer info
    // ------------------------------------------------------------------
    let paymentDetails: any;
    try {
      if (isDevelopment && razorpay_payment_id.startsWith("pay_test_")) {
        // Mock payment details for local testing
        paymentDetails = {
          email: req.headers.get("x-mock-email") || "tester@example.com",
          notes: { name: req.headers.get("x-mock-name") || "Test User" },
          amount: 50000, // 500.00 INR
          status: "captured",
        };
      } else {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      }
    } catch (fetchErr: any) {
      console.error("[verify-payment] Razorpay fetch error:", fetchErr);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve payment details from Razorpay.",
        },
        { status: 502 },
      );
    }

    const email: string | undefined = paymentDetails.email || customer_email;
    const name: string | undefined =
      customer_name ?? paymentDetails.notes?.name ?? paymentDetails.notes?.customer_name ?? null;
    const amountPaise: number = paymentDetails.amount;

    if (!email) {
      console.error("[verify-payment] No email found on Razorpay payment.");
      return NextResponse.json(
        {
          success: false,
          error: "Customer email not found on the payment record.",
        },
        { status: 422 },
      );
    }

    // ------------------------------------------------------------------
    // 4. Upsert user in phase-2.users
    // ------------------------------------------------------------------
    // Check if the user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("[verify-payment] User lookup error:", lookupError);
      return NextResponse.json(
        { success: false, error: `Database error while checking user: ${lookupError.message || JSON.stringify(lookupError)}` },
        { status: 500 },
      );
    }

    let userId: string;
    const isNewUser = !existingUser;

    if (isNewUser) {
      // ---- Create Supabase Auth account first to get auth uid ----
      let authUserId: string | null = null;
      let authErrorMessage = "Unknown auth error";

      try {
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Auto-confirm so they can log in immediately
            user_metadata: { full_name: name ?? "" },
          });

        if (authError) {
          authErrorMessage = authError.message || JSON.stringify(authError);
          console.error(
            "[verify-payment] Auth account creation error:",
            authError,
          );
        } else {
          authUserId = authData.user.id;
        }
      } catch (authErr: any) {
        authErrorMessage = authErr?.message || String(authErr);
        console.error(
          "[verify-payment] Unexpected auth creation error:",
          authErr,
        );
      }

      if (authUserId) {
        const { error: profileError } = await supabasePublic
          .from("profiles")
          .upsert({
            id: authUserId,
            email,
            full_name: name ?? "",
            role: "user",
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error(
            "[verify-payment] Profile insert error:",
            profileError,
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: `Failed to create Supabase Auth account: ${authErrorMessage}` },
          { status: 500 },
        );
      }

      // ---- Insert new user into phase-2.users ----
      const { data: newUser, error: insertUserError } = await supabase
        .from("users")
        .insert({
          email,
          username: name || email.split("@")[0],
          auth_user_id: authUserId,
          role: "user",
        })
        .select("id")
        .single();

      if (insertUserError || !newUser) {
        console.error("[verify-payment] User insert error:", insertUserError);
        return NextResponse.json(
          { success: false, error: `Failed to create user record: ${insertUserError?.message || JSON.stringify(insertUserError)}` },
          { status: 500 },
        );
      }

      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    // ------------------------------------------------------------------
    // 4.5. Resolve UUIDs for Course and Bundle
    // ------------------------------------------------------------------
    let finalBundleId = bundle_id;
    // Check if bundle exists if it looks like a UUID
    if (finalBundleId && finalBundleId.length === 36) {
      const { data: bCheck } = await supabase.from("bundles").select("id").eq("id", finalBundleId).maybeSingle();
      if (!bCheck) finalBundleId = null;
    }
    
    // If not a UUID or didn't exist, try looking up by name or fallback
    if (!finalBundleId || finalBundleId.length !== 36) {
      const { data: bundleData } = await supabase
        .from("bundles")
        .select("id")
        .ilike("bundle_name", bundle_id || "")
        .limit(1)
        .maybeSingle();
      
      if (bundleData) {
        finalBundleId = bundleData.id;
      } else {
        const { data: anyBundle } = await supabase.from("bundles").select("id").limit(1).single();
        if (anyBundle) finalBundleId = anyBundle.id;
      }
    }

    let finalCourseId = course_id;
    // Check if course exists if it looks like a UUID
    if (finalCourseId && finalCourseId.length === 36) {
      const { data: cCheck } = await supabasePublic.from("maincourses").select("id").eq("id", finalCourseId).maybeSingle();
      if (!cCheck) finalCourseId = null;
    }

    // If not a UUID or didn't exist, try looking up by name or fallback
    if (!finalCourseId || finalCourseId.length !== 36) {
      const lookupName = course_name || "Course 1";
      // Use limit(1) to avoid "multiple rows" error from maybeSingle
      const { data: courseData } = await supabasePublic
        .from("maincourses")
        .select("id")
        .ilike("title", lookupName)
        .limit(1)
        .maybeSingle();
        
      if (courseData) {
        finalCourseId = courseData.id;
      } else {
        const { data: anyCourse } = await supabasePublic.from("maincourses").select("id").limit(1).single();
        if (anyCourse) finalCourseId = anyCourse.id;
      }
    }

    // ------------------------------------------------------------------
    // 5. Create order in phase-2.orders
    // ------------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        course_id: finalCourseId,
        bundle_id: finalBundleId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: amountPaise / 100, // Store in base currency (INR)
        status: "paid",
        phone_number: customer_phone,
        additional_comments: customer_comments,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[verify-payment] Order insert error:", orderError);
      return NextResponse.json(
        { success: false, error: `Failed to create order record: ${orderError?.message || JSON.stringify(orderError)}` },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 6. Create payment record in phase-2.payments
    // ------------------------------------------------------------------
    // Map Razorpay's 'captured' status to standard 'success' status to satisfy database constraint
    const mappedStatus = paymentDetails.status === "captured" ? "success" : paymentDetails.status || "success";

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      payment_gateway: "razorpay",
      gateway_order_id: razorpay_order_id,
      gateway_payment_id: razorpay_payment_id,
      gateway_signature: razorpay_signature,
      amount: amountPaise / 100,
      payment_status: mappedStatus,
      paid_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("[verify-payment] Payment insert error:", paymentError);
      return NextResponse.json(
        { success: false, error: `Failed to create payment record: ${paymentError?.message || JSON.stringify(paymentError)}` },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 6.5. Create enrollment record in phase-2.enrollments
    // ------------------------------------------------------------------
    const accessStartDate = new Date();
    const accessEndDate = new Date();
    accessEndDate.setFullYear(accessEndDate.getFullYear() + 1); // 1 year access by default
    
    const { error: enrollmentError } = await supabase.from("enrollments").insert({
      user_id: userId,
      order_id: order.id,
      course_id: finalCourseId,
      bundle_id: finalBundleId,
      status: "active",
      batch_type: batch_type || req.headers.get("x-mock-batch") || "weekday",
      access_start_date: accessStartDate.toISOString(),
      access_end_date: accessEndDate.toISOString(),
    });

    if (enrollmentError) {
      console.error("[verify-payment] Enrollment insert error:", enrollmentError);
      return NextResponse.json(
        { success: false, error: `Failed to create enrollment record: ${enrollmentError?.message || JSON.stringify(enrollmentError)}` },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 7. Build redirect URL and respond
    // ------------------------------------------------------------------
    const redirectUrl = `${LEARNING_PORTAL_URL}/login?email=${encodeURIComponent(email)}`;

    return NextResponse.json(
      {
        success: true,
        redirectUrl,
        isNewUser,
        message: isNewUser
          ? "Account created successfully. Please log in with the default password."
          : "Payment recorded successfully.",
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[verify-payment] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during payment verification.",
      },
      { status: 500 },
    );
  }
}
