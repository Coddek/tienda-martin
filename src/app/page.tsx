import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { Chapter } from "@/components/sections/Chapter";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { siteConfig } from "../../site.config";

export default function Home() {
  const { name, nav, hero, wordmark, chapters, closing, preview } = siteConfig;
  return (
    <>
      <SiteHeader name={name} tone="dark" {...nav} />
      <main>
        <ScrollStory shoes={chapters.map((chapter) => chapter.shoe)}>
          <Hero
            eyebrow={hero.eyebrow}
            tagline={hero.tagline}
            wordmark={wordmark.text}
            wordmarkNote={preview && wordmark.provisional ? wordmark.provisionalLabel : undefined}
            scrollHint={hero.scrollHint}
          />
          {chapters.map((chapter) => (
            <Chapter key={chapter.id} {...chapter} />
          ))}
          <Closing {...closing} href={nav.catalogHref} />
        </ScrollStory>
      </main>
    </>
  );
}
