/**
 * MobileTOC 自定义钩子
 * 处理移动端目录的状态管理和交互逻辑
 */

export interface TOCItem {
	id: string;
	text: string;
	level: number;
	depth: number;
	badge?: string;
}

export interface PostItem {
	title: string;
	url: string;
	category?: string;
	pinned?: boolean;
}

export interface TOCConfig {
	useJapaneseBadge: boolean;
	depth: number;
}

/**
 * 生成目录项
 */
export function generateTOCItems(config: TOCConfig): TOCItem[] {
	const japaneseHiragana = [
		"ア",
		"イ",
		"ウ",
		"エ",
		"オ",
		"カ",
		"キ",
		"ク",
		"ケ",
		"コ",
		"サ",
		"シ",
		"ス",
		"セ",
		"ソ",
		"タ",
		"チ",
		"ツ",
		"テ",
		"ト",
	];

	const content = document.querySelector(
		"#post-container .markdown-content, #post-container .custom-md, .markdown-content, .custom-md, .prose",
	);
	const headings = Array.from(
		content?.querySelectorAll<HTMLElement>(
			"h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]",
		) || [],
	);
	const items: TOCItem[] = [];
	const levels = Array.from(headings).map((heading) =>
		parseInt(heading.tagName.charAt(1), 10),
	);
	const minLevel = levels.length > 0 ? Math.min(...levels) : 1;
	let topLevelCount = 0;

	headings.forEach((heading) => {
		if (!heading.id) {
			return;
		}

		const level = parseInt(heading.tagName.charAt(1), 10);

		const depth = level - minLevel;
		// depth is relative to the shallowest heading, matching every TOC form.
		if (depth < 0 || depth >= config.depth) {
			return;
		}

		const text = (heading.textContent || "").replace(/#+\s*$/, "");
		let badge = "";

		if (depth === 0) {
			topLevelCount++;
			if (
				config.useJapaneseBadge &&
				topLevelCount - 1 < japaneseHiragana.length
			) {
				badge = japaneseHiragana[topLevelCount - 1];
			} else {
				badge = topLevelCount.toString();
			}
		}

		items.push({ id: heading.id, text, level, depth, badge });
	});

	return items;
}

/**
 * 生成文章列表项（首页使用）
 */
export function generatePostItems(): PostItem[] {
	const postCards = document.querySelectorAll(".card-base");
	const items: PostItem[] = [];

	postCards.forEach((card) => {
		const titleLink = card.querySelector(
			'a[href*="/posts/"].transition.group',
		);
		const categoryLink = card.querySelector(
			'a[href*="/categories/"].link-lg',
		);
		const pinnedIcon = titleLink?.querySelector('svg[data-icon="mdi:pin"]');

		if (titleLink) {
			const href = titleLink.getAttribute("href");
			const title =
				titleLink.textContent?.replace(/\s+/g, " ").trim() || "";
			const category = categoryLink?.textContent?.trim() || "";
			const pinned = !!pinnedIcon;

			if (href && title) {
				items.push({ title, url: href, category, pinned });
			}
		}
	});

	return items;
}

/**
 * 检查是否为首页
 */
export function checkIsHomePage(): boolean {
	const pathname = window.location.pathname;
	return pathname === "/" || pathname === "" || /^\/\d+\/?$/.test(pathname);
}

/**
 * 更新活动标题（基于滚动位置）
 */
export function updateActiveHeading(): string {
	const content = document.querySelector(
		"#post-container .markdown-content, #post-container .custom-md, .markdown-content, .custom-md, .prose",
	);
	const headings = Array.from(
		content?.querySelectorAll<HTMLElement>(
			"h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]",
		) || [],
	);
	const scrollTop = window.scrollY;
	const offset = 100;

	let currentActiveId = "";
	headings.forEach((heading) => {
		if (heading.id) {
			const elementTop = (heading as HTMLElement).offsetTop - offset;
			if (scrollTop >= elementTop) {
				currentActiveId = heading.id;
			}
		}
	});

	return currentActiveId;
}

/**
 * 滚动到指定标题
 */
export function scrollToHeading(id: string, offset = 80): void {
	const element = document.getElementById(id);
	if (element) {
		const elementPosition =
			element.getBoundingClientRect().top + window.scrollY - offset;
		const nextURL = new URL(window.location.href);
		nextURL.hash = id;
		window.history.replaceState(
			window.history.state,
			"",
			`${nextURL.pathname}${nextURL.search}${nextURL.hash}`,
		);
		window.scrollTo({
			top: elementPosition,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
				.matches
				? "auto"
				: "smooth",
		});
	}
}

/**
 * 获取 TOC 配置
 */
export function getTOCConfig(): TOCConfig {
	return {
		useJapaneseBadge: window.siteConfig?.toc?.useJapaneseBadge ?? false,
		depth: window.siteConfig?.toc?.depth ?? 3,
	};
}
