import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FourFrame Photo Booth",
    short_name: "FourFrame",
    description: "A pocket-sized four-photo booth.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e0e10",
    theme_color: "#0e0e10",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
