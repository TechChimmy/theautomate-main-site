import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** slug.current of the course — used to build the /courses/[slug]/plans URL */
  courseSlug: string;
}

/**
 * Replaces the old inline plan-dropdown approach.
 * Clicking "View Plans" navigates to /courses/[slug]/plans where the full
 * plan selection UI (PricingCard grid) is shown.
 */
export default function PlanSelector({ courseSlug }: Props) {
  return (
    <Button
      asChild
      className="w-full rounded-xl bg-[#0A3D62] hover:bg-[#0166A7] text-white py-6 font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
    >
      <Link href={`/courses/${courseSlug}/plans`}>
        <ShoppingCart size={20} />
        View Plans
      </Link>
    </Button>
  );
}
