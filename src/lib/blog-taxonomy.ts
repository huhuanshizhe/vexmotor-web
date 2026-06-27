/** 博客分类、主题等前台展示用常量（不含硬编码文章数据） */

export const blogCategories = ['Technical Guide', 'Application Note', 'Tutorial', 'News & Updates'] as const;
export type BlogCategory = (typeof blogCategories)[number];

export const blogCategorySlug: Record<BlogCategory, string> = {
  'Technical Guide': 'technical-guide',
  'Application Note': 'application-note',
  'Tutorial': 'tutorial',
  'News & Updates': 'news',
};

export const blogCategoryFromSlug = Object.fromEntries(
  Object.entries(blogCategorySlug).map(([key, value]) => [value, key as BlogCategory]),
) as Record<string, BlogCategory>;

export const blogProductTopics = ['Stepper Motor', 'BLDC Motor', 'Servo & Integrated', 'Drivers & Power'] as const;
export type BlogProductTopic = (typeof blogProductTopics)[number];

export const blogProductTopicSlug: Record<BlogProductTopic, string> = {
  'Stepper Motor': 'stepper-motor',
  'BLDC Motor': 'bldc-motor',
  'Servo & Integrated': 'servo-integrated',
  'Drivers & Power': 'drivers-power',
};

export const blogProductTopicFromSlug = Object.fromEntries(
  Object.entries(blogProductTopicSlug).map(([key, value]) => [value, key as BlogProductTopic]),
) as Record<string, BlogProductTopic>;

export const blogPageSize = 12;

export function filterBoardBlogsByProductTopic<T extends { tags: string[] }>(items: T[], topic: BlogProductTopic) {
  return items.filter((item) => item.tags.includes(topic));
}
