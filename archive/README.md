# Previous site

`legacy-site/` preserves all 42 tracked files from `TaiPanda96/tai` at commit `5b40ab5065a3039f30ad0515bad32060ccd823be`, before the portfolio replacement on September 7, 2026.

The original directory structure, file contents, and symlink are preserved. This includes the previous HTML pages, scripts, styles, images, resume, specs, and agent configuration. The archive is reference material and is excluded from Vercel uploads and the Vite production output.

The active site now lives in the repository root. To inspect the previous site locally, serve this folder separately:

```sh
python3 -m http.server 8080 --directory archive/legacy-site
```

The original source also remains available in Git history at the commit above.
