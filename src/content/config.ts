import { defineCollection, z } from "astro:content";

const helpcenter = defineCollection({
  schema: z.object({
    page: z.string(),
    description: z.string(),
    icon: z.object({
      url: z.string(),
      alt: z.string(),
    }),
  }),
});
const customers = defineCollection({
  schema: z.object({
    bgColor: z.string().optional(),
    customer: z.string(),
    testimonial: z.string().optional(),
    ctaTitle: z.string().optional(),
    partnership: z.string().optional(),
    challengesAndSolutions: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
results: z.array(z.string()),
    about: z.string(),
    details: z.record(z.string()),
    logo: z.object({
      url: z.string(),
      alt: z.string(),
    }),
  }),
});
const infopages = defineCollection({
  schema: z.object({
    page: z.string(),
    pubDate: z.date().optional(),
  }),
});
const jobs = defineCollection({
  schema: z.object({
    position: z.string(),
    location: z.string(),
    team: z.string(),
    flag: z.object({
      url: z.string(),
      alt: z.string(),
    }),

  }),
});
const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  helpcenter: helpcenter,
  customers: customers,
  infopages: infopages,
  jobs: jobs,
  posts: postsCollection,
};
