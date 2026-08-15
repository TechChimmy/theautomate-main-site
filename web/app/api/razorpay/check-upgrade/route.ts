import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      productUuid: providedProductUuid,
      targetBundleTitle,
      targetBundlePrice,
    } = await req.json();

    if (!email || !targetBundleTitle || targetBundlePrice === undefined) {
      return NextResponse.json(
        {
          error:
            "Email, targetBundleTitle, and targetBundlePrice are required.",
        },
        { status: 400 },
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "phase2" },
    });

    const fullPrice = targetBundlePrice;

    // Helper to determine hierarchy
    const getTierLevel = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("premium")) return 3;
      if (lower.includes("pro")) return 2;
      return 1; // Default to Starter
    };

    // 1. Find user by email
    const supabasePublic = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );
    const { data: profile } = await supabasePublic
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!profile)
      return NextResponse.json({ eligible: false, price: fullPrice });

    // 2. Find phase2 user_id
    const { data: phase2User } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", profile.id)
      .maybeSingle();

    if (!phase2User)
      return NextResponse.json({ eligible: false, price: fullPrice });

    // 3. Find active enrollment for this course, or any Starter course if productUuid is missing
    let enrollmentQuery = supabase
      .from("enrollments")
      .select("*, bundles(bundle_name)")
      .eq("user_id", phase2User.id)
      .eq("status", "active");

    if (providedProductUuid) {
      enrollmentQuery = enrollmentQuery.or(
        `course_id.eq.${providedProductUuid},product_id.eq.${providedProductUuid}`,
      );
    }

    const { data: enrollments, error: enrollmentsError } =
      await enrollmentQuery;

    if (!enrollments || enrollments.length === 0)
      return NextResponse.json({ eligible: false, price: fullPrice });

    // Find the enrollment to upgrade from
    let enrollment = providedProductUuid ? enrollments[0] : null;

    if (!enrollment) {
      // Sort enrollments by tier (highest first) and find one we can upgrade from
      const targetLevel = getTierLevel(targetBundleTitle);

      const sortedEnrollments = [...enrollments].sort((a, b) => {
        const aName = (a.bundles as any)?.bundle_name || "Starter";
        const bName = (b.bundles as any)?.bundle_name || "Starter";
        return getTierLevel(bName) - getTierLevel(aName);
      });

      enrollment = sortedEnrollments.find((e) => {
        const bName = (e.bundles as any)?.bundle_name || "Starter";
        return getTierLevel(bName) < targetLevel;
      });
    }

    if (!enrollment)
      return NextResponse.json({
        eligible: false,
        price: fullPrice,
        message: "No eligible enrollment found to upgrade from.",
      });

    const resolvedCourseId = enrollment.course_id;
    const resolvedProductUuid = enrollment.product_id || enrollment.course_id;
    const resolvedBatchType = enrollment.batch_type || "recorded";

    // Fetch product title directly
    const { data: productData } = await supabasePublic
      .from("products")
      .select("title")
      .eq("id", resolvedProductUuid)
      .maybeSingle();

    let resolvedCourseTitle = productData?.title;

    // Fallback to course title if product not found
    if (!resolvedCourseTitle) {
      const { data: courseData } = await supabasePublic
        .from("maincourses")
        .select("title")
        .eq("id", resolvedCourseId)
        .maybeSingle();
      resolvedCourseTitle = courseData?.title || "Your Course";
    }

    // 4. Verify Hierarchy (Only Upgrades)
    const currentBundleName =
      (enrollment.bundles as any)?.bundle_name || "Starter";
    const currentLevel = getTierLevel(currentBundleName);
    const targetLevel = getTierLevel(targetBundleTitle);

    if (targetLevel <= currentLevel) {
      return NextResponse.json({
        eligible: false,
        price: fullPrice,
        message: "Cannot downgrade or buy same tier.",
      });
    }

    // 5. Check Time Window (120 hours)
    const accessStartDate = new Date(
      enrollment.access_start_date || enrollment.created_at,
    );
    const now = new Date();
    const diffHours =
      (now.getTime() - accessStartDate.getTime()) / (1000 * 60 * 60);

    if (diffHours > 120) {
      return NextResponse.json({
        eligible: false,
        price: fullPrice,
        message: "Outside upgrade window.",
      });
    }

    // 6. Calculate Difference based on orders
    const { data: orders } = await supabase
      .from("orders")
      .select("amount, phone_number, created_at")
      .eq("user_id", phase2User.id)
      .eq("course_id", resolvedCourseId)
      .in("status", ["paid", "captured", "successful", "authorized"])
      .order("created_at", { ascending: false });

    let totalPaid = 0;
    let resolvedPhone = "";
    if (orders && orders.length > 0) {
      totalPaid = orders.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Try to find the most recent non-empty phone number from past orders
      const orderWithPhone = orders.find(
        (o) => o.phone_number && o.phone_number.trim() !== "",
      );
      if (orderWithPhone) {
        resolvedPhone = orderWithPhone.phone_number;
      }
    }

    const upgradePrice = Math.max(0, targetBundlePrice - totalPaid);

    return NextResponse.json({
      eligible: true,
      price: upgradePrice,
      timeRemainingHours: Math.max(0, 120 - diffHours),
      resolvedProductUuid,
      resolvedCourseTitle,
      resolvedBatchType,
      resolvedPhone,
    });
  } catch (error: any) {
    console.error("Error in check-upgrade:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check upgrade eligibility" },
      { status: 500 },
    );
  }
}
