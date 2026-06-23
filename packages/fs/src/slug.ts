const MAX_SLUG_LENGTH = 50;

/**
 * Convert a title into a filesystem-safe slug.
 * Cosmetic only — identity always lives in the frontmatter `id`.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}
