export const COURSES_QUERY = `
*[_type=="courseDetails"] | order(displayOrder asc){
  _id,
  title,
  "slug": slug.current,
  tagline,
  hoverDescription,
  rating,
  students,
  hours,
  duration,
  price,
  level,
  _updatedAt,
  outcomes,
  keyConcepts[]{ title },
  instructorImage,
  instructorName,
  heroImage
}
`;

export const COURSE_BY_SLUG_QUERY = `
*[_type=="courseDetails" && slug.current==$slug][0]{
  _id,
  title,
  "slug": slug.current,
  productUuid,
  tagline,
  rating,
  students,
  hours,
  duration,
  price,
  level,
  instructorImage,
  instructorName,
  heroImage,
  description,
  keyConcepts[]{
    title,
    icon,
    description
  },
  whoFor,
  curriculum[]{
    subheading,
    points,
    summary
  },
  outcomes,
  highlights[]{
    icon,
    title
  },
  projects,
  batchDetails,
  bundles[]->{
    _id,
    title,
    badge,
    price,
    rating,
    reviewCount,
    duration,
    batchOptions,
    coverImage,
    features[]{
      title,
      included
    }
  }
}
`;

/**
 * Fetches a course's title + the full plan shape required by PricingCard.
 * Uses the bundles[] reference array on the course document.
 */
export const COURSE_PLANS_QUERY = `
*[_type=="courseDetails" && slug.current==$slug][0]{
  _id,
  title,
  "slug": slug.current,
  bundles[]->{
    _id,
    title,
    badge,
    price,
    rating,
    reviewCount,
    duration,
    batchOptions,
    coverImage,
    features[]{
      title,
      included
    }
  }
}
`;
