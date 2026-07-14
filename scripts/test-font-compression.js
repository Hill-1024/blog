import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const distDir = path.join(projectRoot, "dist");
const fontDir = path.join(distDir, "assets", "font");

function walk(directory) {
	return fs
		.readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => {
			const entryPath = path.join(directory, entry.name);
			return entry.isDirectory() ? walk(entryPath) : [entryPath];
		});
}

function fail(message) {
	console.error(`✗ ${message}`);
	process.exitCode = 1;
}

if (!fs.existsSync(distDir)) {
	console.error("✗ dist 不存在，请先执行构建");
	process.exit(1);
}

const cssFiles = walk(distDir).filter((file) => file.endsWith(".css"));
const referencedFonts = new Set();

for (const cssFile of cssFiles) {
	const css = fs.readFileSync(cssFile, "utf8");
	for (const match of css.matchAll(
		/url\((?:["'])?\/assets\/font\/([^)'"?#]+)(?:\?[^)'"#]*)?(?:["'])?\)/g,
	)) {
		referencedFonts.add(decodeURIComponent(match[1]));
	}
}

if (referencedFonts.size === 0) {
	fail("构建产物没有引用任何本地字体");
}

for (const font of referencedFonts) {
	if (!fs.existsSync(path.join(fontDir, font))) {
		fail(`CSS 引用了不存在的字体：${font}`);
	}
}

const compressedFonts = [...referencedFonts].filter((font) =>
	font.endsWith(".woff2"),
);

if (compressedFonts.length === 0) {
	fail("没有生成或引用 WOFF2 压缩字体");
}

for (const font of compressedFonts) {
	const compressedPath = path.join(fontDir, font);
	const sourcePath = path.join(fontDir, font.replace(/\.woff2$/, ".ttf"));

	if (
		fs.existsSync(sourcePath) &&
		fs.statSync(compressedPath).size >= fs.statSync(sourcePath).size
	) {
		fail(`${font} 未小于对应的 TTF 源文件`);
	}
}

if (!process.exitCode) {
	console.log(
		`✓ 字体构建验证通过：${referencedFonts.size} 个引用，${compressedFonts.length} 个 WOFF2`,
	);
}
