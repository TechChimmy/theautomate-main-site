import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'courseDetails',
  title: 'Course Details',
  type: 'document',

  fields: [
    /* ---------------- HERO ---------------- */

    defineField({
      name: 'title',
      title: 'Course Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "useExistingProduct",
      title: "Use Existing LMS Product",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "productUuid",
      title: "Linked Product",
      type: "string",
      hidden: ({ parent }) => !parent?.useExistingProduct,
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'bundles',
      title: 'Bundles',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'plan' }],
        },
      ],
      description: 'Select the plan bundles that include this course.',
    }),

    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),

    defineField({
      name: 'hoverDescription',
      title: 'Hover/Popup Brief Details',
      description: 'A brief description that appears in the popup when hovering over the course card.',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'heroImage',
      title: 'Hero Image / Logo',
      type: 'image',
    }),

    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5),
    }),

    defineField({
      name: 'instructorName',
      title: 'Instructor Name',
      type: 'string',
    }),

    defineField({
      name: 'instructorImage',
      title: 'Instructor Image',
      type: 'image',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      initialValue: 1,
    }),

    /* ---------------- KEY CONCEPTS ---------------- */

    defineField({
      name: 'keyConcepts',
      title: 'Key Concepts',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'icon', type: 'image', title: 'Icon' },
            { name: 'description', type: 'string', title: 'Description' },
          ],
        },
      ],
    }),

    /* ---------------- DESCRIPTION ---------------- */

    defineField({
      name: 'description',
      title: 'Course Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),

    /* ---------------- ENROLL CARD ---------------- */

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
    }),

    defineField({
      name: 'duration',
      title: 'Duration (e.g. 6 Weeks)',
      type: 'string',
    }),

    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: ['Beginner', 'Intermediate', 'Advanced'],
      },
    }),

    /* ---------------- WHO FOR ---------------- */

    defineField({
      name: 'whoFor',
      title: 'Who is this course for?',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    /* ---------------- WHAT YOU LEARN ---------------- */

    defineField({
      name: 'curriculum',
      title: "What You'll Learn (Curriculum)",
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'module',
          fields: [
            { name: 'subheading', title: 'Subheading (e.g. Tosca Fundamentals)', type: 'string' },
            {
              name: 'points',
              title: 'Major Points',
              type: 'array',
              of: [{ type: 'string' }],
            },
            { name: 'summary', title: 'Module Summary (Short Footer Text)', type: 'string' },
          ],
        },
      ],
    }),

    /* ---------------- OUTCOMES ---------------- */

    defineField({
      name: 'outcomes',
      title: 'Outcomes',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    /* ---------------- HIGHLIGHTS ---------------- */

    defineField({
      name: 'highlights',
      title: 'Course Highlights',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'icon', type: 'image', title: 'Icon' },
            { name: 'title', type: 'string', title: 'Title' },
          ],
        },
      ],
    }),

    /* ---------------- STATS ---------------- */

    defineField({
      name: 'hours',
      title: 'Total Hours',
      type: 'number',
    }),

    defineField({
      name: 'students',
      title: 'Students Enrolled',
      type: 'number',
    }),

    defineField({
      name: 'projects',
      title: 'Projects Count',
      type: 'number',
    }),
    defineField({
      name: 'batchDetails',
      title: 'Batch Details',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
})
