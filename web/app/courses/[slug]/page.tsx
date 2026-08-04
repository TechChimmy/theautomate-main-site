import Image from "next/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { getCourseBySlug } from "@/lib/services/course.service";
import { getCourseRating } from "@/lib/services/rating.service";
import { urlFor } from "@/lib/sanity.client";
import { StarRating } from "@/components/ui/StarRating";
import ContactCTA from "@/sections/HomeCTA";
import PlanSelector from "@/components/layout/PlanSelector";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;

  // Fetch Sanity course data first — we need productUuid to fire the rating query.
  // Both fetches are then made in parallel once productUuid is known.
  const course = await getCourseBySlug(slug);
  if (!course) return notFound();

  // Parallel fetch: Supabase live rating alongside any other async work.
  // getCourseRating returns null on DB error (page still renders safely).
  const liveRating = course.productUuid
    ? await getCourseRating(course.productUuid)
    : { averageRating: 0, totalReviews: 0 };

  const heroImageUrl = course.heroImage
    ? urlFor(course.heroImage).width(1200).url()
    : "/placeholder.png";

  // Determine what to show in the rating area:
  //   liveRating === null  → DB error  → show nothing (safe fallback)
  //   totalReviews === 0   → no reviews yet
  //   totalReviews > 0     → show stars + count
  const hasReviews = liveRating !== null && liveRating.totalReviews > 0;
  const ratingError = liveRating === null;

  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-7xl font-bold text-center">{course.title}</h1>

          <div className="mt-8 flex justify-center items-center gap-8 flex-wrap">
            {/* Live rating from Supabase — replaces static course.rating */}
            {!ratingError && (
              <div className="flex items-center gap-2">
                {hasReviews ? (
                  <>
                    <StarRating
                      rating={liveRating!.averageRating}
                      showNumber={false}
                      size={20}
                    />
                    <span className="text-base font-semibold text-slate-700">
                      {liveRating!.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({liveRating!.totalReviews}{" "}
                      {liveRating!.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">No reviews yet</span>
                )}
              </div>
            )}

            {course.students != null && (
              <div className="text-slate-600">({course.students} students)</div>
            )}
            {course.instructorName && (
              <div className="text-slate-600">{course.instructorName}</div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <Image
            src={heroImageUrl}
            alt={course.title}
            width={1200}
            height={700}
            className="rounded-3xl"
          />

          <div className="space-y-16 mt-16">
            {/* Description */}
            {course.description && course.description.length > 0 && (
              <section>
                <h2 className="text-4xl font-bold mb-6">About the Course</h2>
                <div className="text-lg leading-9 prose prose-lg max-w-none">
                  <PortableText value={course.description} />
                </div>
              </section>
            )}

            {/* Key Concepts */}
            {course.keyConcepts && course.keyConcepts.length > 0 && (
              <section>
                <h2 className="text-4xl font-bold mb-6">Key Concepts</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {course.keyConcepts.map((concept, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50"
                    >
                      {concept.icon && (
                        <Image
                          src={urlFor(concept.icon).width(48).url()}
                          alt={concept.title}
                          width={48}
                          height={48}
                          className="rounded-lg flex-shrink-0"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{concept.title}</h3>
                        {concept.description && (
                          <p className="text-slate-500 text-sm mt-1">
                            {concept.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Curriculum */}
            {course.curriculum && course.curriculum.length > 0 && (
              <section>
                <h2 className="text-4xl font-bold mb-6">
                  What You&apos;ll Learn
                </h2>
                <div className="space-y-8">
                  {course.curriculum.map((mod, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-slate-50">
                      <h3 className="text-xl font-bold mb-3">
                        {mod.subheading}
                      </h3>
                      {mod.points && mod.points.length > 0 && (
                        <ul className="space-y-2">
                          {mod.points.map((point, pi) => (
                            <li key={pi}>• {point}</li>
                          ))}
                        </ul>
                      )}
                      {mod.summary && (
                        <p className="mt-3 text-sm text-slate-500 italic">
                          {mod.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Who is this for */}
            {course.whoFor && course.whoFor.length > 0 && (
              <section>
                <h2 className="text-4xl font-bold mb-6">
                  Who is this Course For?
                </h2>
                <ul className="space-y-3">
                  {course.whoFor.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <section>
                <h2 className="text-4xl font-bold mb-6">Outcomes</h2>
                <ul className="space-y-3">
                  {course.outcomes.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div>
          <div className="sticky top-28 rounded-3xl bg-blue-50 p-8">
            {course.level && (
              <div className="text-sm uppercase">{course.level}</div>
            )}

            <div className="text-5xl font-bold mt-4">
              ₹{course.price?.toLocaleString("en-IN") ?? "—"}
            </div>

            <hr className="my-8" />

            <div className="space-y-4">
              {course.duration && (
                <div>🎥 {course.duration} on-demand videos</div>
              )}
              {course.hours != null && (
                <div>⏱️ {course.hours} hours of content</div>
              )}
              {course.students != null && (
                <div>👥 {course.students} students</div>
              )}
              <div>⭐ Certificate Included</div>
            </div>

            <div className="mt-10">
              <PlanSelector courseSlug={course.slug} />
            </div>
          </div>
        </div>
      </section>

      <ContactCTA />
    </main>
  );
}
