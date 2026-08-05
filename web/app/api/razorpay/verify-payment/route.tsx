import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { transporter } from "@/lib/mailer";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
      product_uuid,
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
    // 2.5. Role Gate — block admins and mentors/instructors from purchasing
    // ------------------------------------------------------------------
    // Check profiles table (covers anyone with a portal account).
    const { data: existingProfile } = await supabasePublic
      .from("profiles")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    const blockedRoles = ["admin", "instructor"];
    const profileRole = existingProfile?.role?.toLowerCase() ?? "";

    if (blockedRoles.includes(profileRole)) {
      console.warn(`[verify-payment] Blocked purchase attempt by ${profileRole}: ${email}`);
      return NextResponse.json(
        {
          success: false,
          error: `This email is registered as a ${profileRole} on the platform and cannot purchase courses. Please contact support if this is an error.`,
        },
        { status: 403 },
      );
    }

    // ------------------------------------------------------------------
    // 3. User Resolution — three-tier lookup
    //
    //  Tier 1: phase2.users    (full purchase/enrollment record)
    //  Tier 2: profiles table  (auth account exists but no phase2 row yet)
    //  Tier 3: create new      (truly first-time user)
    //
    // This prevents the "user already registered" error that occurs when
    // someone has a Supabase Auth account (tier 2) but never purchased before.
    // ------------------------------------------------------------------
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id, email, auth_user_id")
      .eq("email", email)
      .maybeSingle();

    let userId: string;
    let authUserId: string | null = null;
    let isNewUser: boolean;

    if (lookupError) {
      console.error("[verify-payment] User lookup error:", lookupError);
      return NextResponse.json(
        { success: false, error: `Database error while checking user: ${lookupError.message || JSON.stringify(lookupError)}` },
        { status: 500 },
      );
    }

    if (existingUser) {
      // ── Tier 1: user exists in phase2.users ──────────────────────────
      userId = existingUser.id;
      authUserId = existingUser.auth_user_id;
      isNewUser = false;
    } else {
      // Not in phase2.users — check profiles (auth-only accounts)
      const { data: existingProfile } = await supabasePublic
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        // ── Tier 2: auth account exists, phase2.users row is missing ───
        // Recover their auth ID and create the missing phase2 record.
        console.log("[verify-payment] Tier-2 user found in profiles, backfilling phase2.users for:", email);
        authUserId = existingProfile.id; // profiles.id === auth user UUID

        const { data: backfilledUser, error: backfillError } = await supabase
          .from("users")
          .insert({
            email,
            username: name || email.split("@")[0],
            auth_user_id: authUserId,
            role: "user",
          })
          .select("id")
          .single();

        if (backfillError || !backfilledUser) {
          console.error("[verify-payment] Backfill phase2.users error:", backfillError);
          return NextResponse.json(
            { success: false, error: `Failed to sync user record: ${backfillError?.message || JSON.stringify(backfillError)}` },
            { status: 500 },
          );
        }

        userId = backfilledUser.id;
        isNewUser = false; // Has existing auth credentials → redirect to /login?message=
      } else {
        // ── Tier 3: attempt to create a brand-new auth account ──────────
        // If createUser returns "already registered", we recover the existing
        // auth user via admin.listUsers() rather than hard-failing.
        isNewUser = true;
        let authErrorMessage = "Unknown auth error";
        let authCreateFailed = false;

        try {
          const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
              email,
              password: DEFAULT_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: name ?? "" },
            });

          if (authError) {
            authErrorMessage = authError.message || JSON.stringify(authError);
            const alreadyExists =
              authError.message?.toLowerCase().includes("already") ||
              authError.message?.toLowerCase().includes("registered") ||
              authError.message?.toLowerCase().includes("email address has already");

            if (alreadyExists) {
              // ── Tier 3b: auth account exists but slipped past profile lookup ──
              // Scan auth users to recover the existing auth UID.
              console.log("[verify-payment] createUser blocked — recovering existing auth user for:", email);
              const { data: usersPage } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });
              const matched = usersPage?.users?.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase(),
              );
              if (matched) {
                authUserId = matched.id;
                isNewUser = false; // Has credentials already → redirect to /login?message=
                console.log("[verify-payment] Recovered auth user ID:", authUserId);
              } else {
                authCreateFailed = true;
              }
            } else {
              authCreateFailed = true;
              console.error("[verify-payment] Auth account creation error:", authError);
            }
          } else {
            authUserId = authData.user.id;
          }
        } catch (authErr: any) {
          authErrorMessage = authErr?.message || String(authErr);
          authCreateFailed = true;
          console.error("[verify-payment] Unexpected auth creation error:", authErr);
        }

        if (!authUserId) {
          // Failed to create OR recover an auth user — genuine failure
          return NextResponse.json(
            { success: false, error: authCreateFailed ? `Failed to create Supabase Auth account: ${authErrorMessage}` : "Could not resolve auth user. Please contact support." },
            { status: 500 },
          );
        }

        // Upsert profile (safe even if it already exists)
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
          console.error("[verify-payment] Profile upsert error:", profileError);
        }

        // Upsert phase2.users (safe if it already exists due to a race or prior backfill)
        const { data: upsertedUser, error: upsertUserError } = await supabase
          .from("users")
          .upsert(
            {
              email,
              username: name || email.split("@")[0],
              auth_user_id: authUserId,
              role: "user",
            },
            { onConflict: "email" },
          )
          .select("id")
          .single();

        if (upsertUserError || !upsertedUser) {
          console.error("[verify-payment] User upsert error:", upsertUserError);
          return NextResponse.json(
            { success: false, error: `Failed to create user record: ${upsertUserError?.message || JSON.stringify(upsertUserError)}` },
            { status: 500 },
          );
        }

        userId = upsertedUser.id;
      }
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
      // Frontend often sends "Starter Plan" but DB has "Starter", so we match by the first word
      const bundleKeyword = (bundle_id || "").split(" ")[0];
      
      const { data: bundleData } = await supabase
        .from("bundles")
        .select("id")
        .ilike("bundle_name", `%${bundleKeyword}%`)
        .limit(1)
        .maybeSingle();
      
      if (bundleData) {
        finalBundleId = bundleData.id;
      } else {
        const { data: anyBundle } = await supabase.from("bundles").select("id").limit(1).single();
        if (anyBundle) finalBundleId = anyBundle.id;
      }
    }

    let finalCourseId = null;

    // 1. Try resolving using the exact product_uuid mapped from Sanity
    if (product_uuid) {
      const requestedBatch = (batch_type || "weekday").toLowerCase();
      const { data: mcData } = await supabasePublic
        .from("maincourses")
        .select("id, title")
        .eq("product_id", product_uuid)
        .eq("batch_type", requestedBatch);

      if (mcData && mcData.length > 0) {
        finalCourseId = mcData[0].id;
      } else {
        // Fallback to finding any course by product_id if exact batch_type misses
        const { data: fallbackData } = await supabasePublic
          .from("maincourses")
          .select("id, title")
          .eq("product_id", product_uuid)
          .limit(1)
          .maybeSingle();
        if (fallbackData) finalCourseId = fallbackData.id;
      }
    }

    // 2. If no product_uuid provided, check if course_id itself is a UUID
    if (!finalCourseId && course_id && course_id.length === 36) {
      const { data: cCheck } = await supabasePublic
        .from("maincourses")
        .select("id")
        .eq("id", course_id)
        .maybeSingle();
      if (cCheck) finalCourseId = cCheck.id;
    }

    // 3. If still unresolved, try looking up by name or wildcard matching
    if (!finalCourseId) {
      const searchTerm = course_id || course_name || "Course";
      // Use limit(1) to avoid "multiple rows" error from maybeSingle
      const { data: courseData } = await supabasePublic
        .from("maincourses")
        .select("id")
        .ilike("title", `%${searchTerm}%`)
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
    // 4.5. Ensure product_uuid is actually a product ID, not a course ID
    // ------------------------------------------------------------------
    let finalProductUuid = product_uuid;
    if (finalProductUuid && finalProductUuid.length === 36) {
      // Check if it's actually a course ID mistakenly passed as product_uuid
      const { data: isCourse } = await supabasePublic
        .from("maincourses")
        .select("product_id")
        .eq("id", finalProductUuid)
        .maybeSingle();
      
      if (isCourse && isCourse.product_id) {
        finalProductUuid = isCourse.product_id;
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
    
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id, access_start_date")
      .eq("user_id", userId)
      .eq("course_id", finalCourseId)
      .maybeSingle();

    let enrollmentError;
    
    if (existingEnrollment) {
      const { error } = await supabase.from("enrollments").update({
        order_id: order.id,
        product_id: finalProductUuid,
        bundle_id: finalBundleId,
        status: "active",
        batch_type: batch_type || req.headers.get("x-mock-batch") || "weekday",
      }).eq("id", existingEnrollment.id);
      enrollmentError = error;
    } else {
      const { error } = await supabase.from("enrollments").insert({
        user_id: userId,
        order_id: order.id,
        course_id: finalCourseId,
        product_id: finalProductUuid,
        bundle_id: finalBundleId,
        status: "active",
        batch_type: batch_type || req.headers.get("x-mock-batch") || "weekday",
        access_start_date: accessStartDate.toISOString(),
        access_end_date: accessEndDate.toISOString(),
      });
      enrollmentError = error;
    }

    if (enrollmentError) {
      console.error("[verify-payment] Enrollment insert error:", enrollmentError);
      return NextResponse.json(
        { success: false, error: `Failed to create enrollment record: ${enrollmentError?.message || JSON.stringify(enrollmentError)}` },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 6.75. Send Invoice Email
    // ------------------------------------------------------------------
    try {
      const pdfStream = await renderToStream(
        <InvoicePDF 
          invoiceNumber={String(order.id).split('-')[0].toUpperCase()}
          date={new Date().toLocaleDateString()}
          clientName={name || email.split("@")[0]}
          clientPhone={customer_phone || "N/A"}
          itemName={course_name || "Premium Course"}
          amount={amountPaise / 100}
        />
      );

      // Convert Node stream to Buffer for Nodemailer attachment
      const chunks = [];
      for await (const chunk of pdfStream) {
        chunks.push(chunk);
      }
      const pdfBuffer = Buffer.concat(chunks);

      const emailSubject = isNewUser
        ? `Invoice & Welcome to ${course_name || "Premium Plan"} - The Automate`
        : `Your new course has been added — Invoice for ${course_name || "Premium Plan"} - The Automate`;

      const emailIntro = isNewUser
        ? `Thank you for choosing to learn with us! We are thrilled to welcome you to our community. Your payment for <strong>${course_name || "the course"}</strong> has been successfully processed, and your enrollment is now active.`
        : `Great news! Your payment for <strong>${course_name || "the course"}</strong> has been successfully processed, and access has been added to your existing account. You can log in with your existing credentials to start learning right away.`;

      await transporter.sendMail({
        from: `"The Automate" <${process.env.ADMIN_EMAIL}>`,
        to: email,
        subject: emailSubject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #174778;">${isNewUser ? "Welcome to The Automate!" : "New Course Access Added!"}</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear ${name || "Valued Student"},<br/><br/>
              ${emailIntro}
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Please find your official tax invoice attached to this email for your records.
            </p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
              <h3 style="margin-top: 0; color: #111827;">Order Summary</h3>
              <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Order ID:</strong> ${razorpay_order_id}</p>
              <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Amount Paid:</strong> ₹${amountPaise / 100}</p>
              <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Click the button below to access your learning portal.
            </p>

            <a href="${LEARNING_PORTAL_URL}/login" 
               style="display: inline-block; background-color: #2283FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
              Access Learning Portal
            </a>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
              If you have any questions or need assistance, please feel free to reply to this email. We're here to help!<br/><br/>
              Best regards,<br/>
              <strong>The Automate Team</strong>
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `Invoice-${String(order.id).split('-')[0].toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
    } catch (emailError) {
      console.error("[verify-payment] Email sending failed:", emailError);
    }

    // ------------------------------------------------------------------
    // 7. Build redirect URL and respond
    // ------------------------------------------------------------------
    // New users: /login?email=...&newUser=true triggers auto-login with the default password.
    // Existing users: /login?message=... shows an informational toast only.
    const redirectUrl = isNewUser
      ? `${LEARNING_PORTAL_URL}/login?email=${encodeURIComponent(email)}&newUser=true`
      : `${LEARNING_PORTAL_URL}/login?message=${encodeURIComponent("Account exists. Please log in with your existing password to access your new course.")}&email=${encodeURIComponent(email)}`;

    return NextResponse.json(
      {
        success: true,
        redirectUrl,
        isNewUser,
        existingUser: !isNewUser,
        orderId: order.id,
        message: isNewUser
          ? "Account created successfully. Check your email for login instructions."
          : "Payment recorded. Your new course has been added to your existing account.",
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
