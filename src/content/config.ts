import { defineCollection, z } from "astro:content";
const helpcenter = defineCollection({
  schema: z.object({
    iconId: z.string().optional(), 
    page: z.string(),
    description: z.string(),
    category: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    lastUpdated: z.string().optional(),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(), 
  }),
});
export default helpcenter;
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
    authorAvatar: z.object({
      url: z.string(),
      alt: z.string()
    }),
    tags: z.array(z.string()),
  }),
});
export const collections = {
  helpcenter: helpcenter,
  customers: customers,
  infopages: infopages,
  posts: postsCollection,
};
