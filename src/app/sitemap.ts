import { MetadataRoute } from "next";
import scamTypes from "../../data/scam-types.json";

const BASE_URL = "https://cheating-henna.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const allTypeIds = scamTypes.categories.flatMap((cat) =>
    cat.types.map((type) => type.id)
  );

  const typePages: MetadataRoute.Sitemap = allTypeIds.map((id) => ({
    url: `${BASE_URL}/types/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/detector`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/types`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/report`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...typePages,
  ];
}
