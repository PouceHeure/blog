---
title: "Welcome to the blog"
date: 2026-11-08
description: "What this blog is for: explanations of how things work, technology recommendations, modelling and statistics."
tags: ["tooling", "modelling", "statistics"]
draft: false
---

Until now this site was a showcase of my projects and publications. I'm adding a blog next to it, to write the things that don't fit in a project page.

## What you'll find here

I want this to be a place for short, focused articles. Three kinds of posts are planned:

- **How things work.** Explanations of tools and concepts I use every day, looking under the hood instead of only at the commands. For example, how a build tool resolves and builds a workspace.
- **Technology recommendations.** The tools, libraries and workflows I would pick today for robotics and software projects, and why.
- **Modelling and statistics.** Notes on modelling real systems, such as trains, and on the statistics needed to make sense of the data they produce.

{{< callout title="Key takeaway" >}}
Short posts, one idea each, with enough detail to be useful the next time you need it.
{{< /callout >}}

## How the posts are written

Each post has a table of contents on the left, a reading time, and tags to find related content. Longer topics are split into a series, with links to the previous and next part.

Code is shown in blocks that can be copied in one click. For example, creating a new post on this blog looks like this:

```bash
# create a new post from the blog template
hugo new blog/my-first-post.md

# preview the site locally, drafts included
hugo server -D
```

Equations are supported too, numbered automatically. A simple example, the mean of $n$ measurements:

{{< equation >}}
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i
{{< /equation >}}

## What's next

The first real articles will come soon. If there is a topic you would like me to cover, or a tool you want my opinion on, feel free to reach out through the contact button at the top of the page.
