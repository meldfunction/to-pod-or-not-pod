const markdownIt = require("markdown-it");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
  // RSS Plugin
  eleventyConfig.addPlugin(pluginRss);

  // Markdown configuration
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  });
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy for assets
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/audio");
  eleventyConfig.addPassthroughCopy("src/assets/transcripts");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  // Date filters
  eleventyConfig.addFilter("dateDisplay", (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  eleventyConfig.addFilter("dateISO", (dateStr) => {
    return new Date(dateStr).toISOString();
  });

  eleventyConfig.addFilter("dateRFC2822", (dateStr) => {
    return new Date(dateStr).toUTCString();
  });

  // Episode number padding filter
  eleventyConfig.addFilter("padStart", (num, size) => {
    return String(num).padStart(size, '0');
  });

  // Get episode by ID
  eleventyConfig.addFilter("getEpisodeById", (episodes, id) => {
    return episodes.find(ep => ep.id === id);
  });

  // Sort episodes by date (newest first)
  eleventyConfig.addFilter("sortByDate", (episodes) => {
    return [...episodes].sort((a, b) => new Date(b.airDate) - new Date(a.airDate));
  });

  // Sort episodes by ID (for episode list)
  eleventyConfig.addFilter("sortById", (episodes) => {
    return [...episodes].sort((a, b) => a.id - b.id);
  });

  return {
    pathPrefix: process.env.ELEVENTY_ENV === 'production' ? '/to-pod-or-not-pod/' : '/',
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
