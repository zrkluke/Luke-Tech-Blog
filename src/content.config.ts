import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const homepageDataSchema = z.object({
  banner: z
    .object({
      title: z.string(),
      subtitle: z.string().optional(),
      image: z.string(),
    })
    .optional(),
  call_to_action: z
    .object({
      title: z.string(),
      content: z.string(),
      image: z.string(),
      button_label: z.string(),
      button_link: z.string(),
    })
    .optional(),
});

// Homepage Collection schema (default locale)
const homepageCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/homepage" }),
  schema: homepageDataSchema,
});

// English homepage copy for /en
const homepageEnCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/homepage-en" }),
  schema: homepageDataSchema,
});

const postEntrySchema = z.object({
  title: z.string(),
  meta_title: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  image: z.string().optional(),
  authors: z.array(z.string()).default(() => ["admin"]),
  categories: z.array(z.string()).default(() => ["others"]),
  tags: z.array(z.string()).default(() => ["others"]),
  draft: z.boolean().optional(),
});

// Post collection schema (default locale: zh)
const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts" }),
  schema: postEntrySchema,
});

// English posts (URLs under /en/posts/…)
const postsEnCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts-en" }),
  schema: postEntrySchema,
});

// Author collection schema
const authorsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/authors" }),
  schema: z.object({
    title: z.string(),
    image: z.string().optional(),
    description: z.string().optional(),
    meta_title: z.string().optional(),
  }),
});

const pageSchema = z.object({
  title: z.string(),
  meta_title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  layout: z.string().optional(),
  draft: z.boolean().optional(),
});

// Pages collection schema (default locale: zh, URLs without prefix)
const pagesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pages" }),
  schema: pageSchema,
});

// English-only pages (e.g. /en/about) — mirror `pageSchema` for i18n pairs
const pagesEnCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pages-en" }),
  schema: pageSchema,
});

// Export collections
export const collections = {
  homepage: homepageCollection,
  homepageEn: homepageEnCollection,
  posts: postsCollection,
  postsEn: postsEnCollection,
  pages: pagesCollection,
  pagesEn: pagesEnCollection,
  authors: authorsCollection,
};
