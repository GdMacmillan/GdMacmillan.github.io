export default {
  layout: "layouts/post.njk",
  tags: ["posts"],
  permalink: function (data) {
    const d = data.page.date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `/${year}/${month}/${day}/${data.page.fileSlug}/`;
  }
};
