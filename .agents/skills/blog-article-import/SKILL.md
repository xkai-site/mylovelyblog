---
name: blog-article-import
description: Import Markdown articles from a user-provided file or folder into this Jekyll blog, preserve their content and images, add blog metadata, then stage, commit, and push the imported articles. Use when the user gives source file locations and asks to update/publish the blog with them.
---

# Import articles into this blog

When the user supplies source Markdown file paths (or a folder containing them), complete the import and publish flow without asking for the paths again.

1. Confirm the repository root and inspect `_config.yml`, `docs/writing.md`, existing `_posts/`, and the provided source files. For a folder, select its completed/publishable Markdown articles; do not import drafts or unrelated files. Do not overwrite an existing post or silently skip a requested article.
2. Preserve each article's substantive text and code. Add Jekyll front matter (`layout: post`, title, date, one existing category, relevant tags, and a unique slug). Prefer an explicit source date; otherwise use the source file's last-modified date. Name each post `_posts/YYYY-MM-DD-<stable-id>.md`. Check date consistency and duplicate slugs/URLs.
3. Find local images referenced by the Markdown. Copy them into a dedicated `assets/images/<stable-id>/` directory, retain useful filenames, and rewrite references using the site's `/mylovelyblog/assets/images/...` URL convention. Preserve remote links. Never leave source-machine absolute paths or broken local image references. Do not copy unrelated assets.
4. Review the new posts and image references; run `git diff --check` and verify every referenced local image exists. Summarize the files to be published. Then run the repository publishing script with the exact new post paths:

   ```sh
   node scripts/publish-articles.mjs _posts/YYYY-MM-DD-article.md [another-post.md ...]
   ```

   The script stages only the supplied posts and their referenced `assets/` images, commits with `更新[文章标题]` (multiple titles joined by `、`), and pushes `origin main`. It refuses to run off `main`, if the Git index already contains staged changes, or if referenced images are missing. Do not replace this with `git add .`.
5. Report the created post/image paths and the resulting commit and push outcome. If validation, commit, or push fails, stop and report the exact issue; do not claim publication succeeded.

Use the repository's conventions in `docs/writing.md` for categories, tags, metadata, and image URLs. Do not alter unrelated files or run a deployment workflow manually; the existing GitHub Actions flow handles deployment after the push.
