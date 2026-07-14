import type { ImageMetadata } from "astro";
import path from "node:path";

export const feedImagesGlob = import.meta.glob<{ default: ImageMetadata }>(
	"/content/posts/**/*.{jpeg,jpg,png,gif,webp}",
);

export function getFeedImageImportPath(
	filePath: string | undefined,
	imageSrc: string,
): string | null {
	if (!filePath) {
		return null;
	}

	const normalizedFilePath = filePath.replace(/\\/g, "/");
	const postsMarker = "src/content/posts/";
	const markerIndex = normalizedFilePath.indexOf(postsMarker);
	if (markerIndex === -1) {
		return null;
	}

	const postPath = `/content/posts/${normalizedFilePath.slice(markerIndex + postsMarker.length)}`;
	const sourceWithoutQuery = imageSrc.split(/[?#]/, 1)[0];
	let decodedSource = sourceWithoutQuery;
	try {
		decodedSource = decodeURIComponent(sourceWithoutQuery);
	} catch {
		// Keep malformed-but-usable source text unchanged.
	}

	const importPath = path.posix.resolve(
		path.posix.dirname(postPath),
		decodedSource,
	);
	return importPath.startsWith("/content/posts/") ? importPath : null;
}
