/**
 * 返回顶部处理器
 * 管理返回顶部按钮和滚动监听
 */

import {
	BANNER_HEIGHT,
	BANNER_HEIGHT_EXTEND,
	BANNER_HEIGHT_HOME,
	SCROLL_CONFIG,
	SWUP_SELECTORS,
} from "../core/swup-config";

/**
 * 返回顶部处理器类
 * 负责返回顶部按钮的显示/隐藏和滚动位置监听
 */
export class BackToTopHandler {
	private backToTopBtn: HTMLElement | null = null;
	private backToTopInnerBtn: HTMLButtonElement | null = null;
	private toc: HTMLElement | null = null;
	private navbar: HTMLElement | null = null;
	private bannerEl: HTMLElement | null = null;
	private bannerEnabled: boolean;
	private scrollRafId: number | null = null;
	private eventsBound = false;
	private cachedContentTop: number | null = null;
	private cachedBannerHeight = 0;
	private cachedBannerVisible = false;
	private lastBackToTopHidden: boolean | null = null;
	private lastTocHidden: boolean | null = null;
	private lastNavbarHidden: boolean | null = null;
	private readonly scrollHandler = this.scheduleScrollUpdate.bind(this);
	private readonly resizeHandler = this.handleResize.bind(this);
	private readonly clickHandler = this.scrollToTop.bind(this);
	private readonly layoutInvalidateHandler =
		this.invalidateMetricsAndUpdate.bind(this);

	constructor(bannerEnabled: boolean) {
		this.bannerEnabled = bannerEnabled;
	}

	/**
	 * 初始化返回顶部处理器
	 */
	init(): void {
		this.cacheElements();
		this.bindEvents();
		this.measureLayoutMetrics();
		this.handleScroll();
	}

	/**
	 * 缓存 DOM 元素
	 */
	private cacheElements(): void {
		this.backToTopBtn = document.getElementById(
			SWUP_SELECTORS.backToTopBtn.slice(1),
		);
		this.backToTopInnerBtn =
			this.backToTopBtn?.querySelector("button") ?? null;
		this.toc = document.getElementById(SWUP_SELECTORS.tocWrapper.slice(1));
		this.navbar = document.getElementById(
			SWUP_SELECTORS.navbarWrapper.slice(1),
		);
		this.bannerEl = document.getElementById(
			SWUP_SELECTORS.bannerWrapper.slice(1),
		);
	}

	/**
	 * 绑定事件监听
	 */
	private bindEvents(): void {
		if (this.eventsBound) {
			return;
		}

		// 使用 passive 事件监听器 + rAF 合并每帧滚动更新，避免滚动期间高频布局抖动
		window.addEventListener("scroll", this.scrollHandler, {
			passive: true,
		});
		window.addEventListener("resize", this.resizeHandler, {
			passive: true,
		});
		window.addEventListener(
			"wallpaper-mode-change",
			this.layoutInvalidateHandler,
		);
		document.addEventListener(
			"swup:page:view",
			this.layoutInvalidateHandler,
		);
		this.backToTopBtn?.addEventListener("click", this.clickHandler);
		this.eventsBound = true;
	}

	private scrollToTop(): void {
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
	}

	private scheduleScrollUpdate(): void {
		if (this.scrollRafId !== null) {
			return;
		}
		this.scrollRafId = requestAnimationFrame(() => {
			this.scrollRafId = null;
			this.handleScroll();
		});
	}

	private invalidateMetricsAndUpdate(): void {
		requestAnimationFrame(() => {
			this.cacheElements();
			this.measureLayoutMetrics();
			this.handleScroll();
		});
	}

	/**
	 * 统一在写操作之前读取布局几何信息，避免滚动期间读写交替导致强制同步重排
	 */
	private measureLayoutMetrics(): void {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const contentWrapper = document.getElementById(
			SWUP_SELECTORS.contentWrapper.slice(1),
		);
		if (contentWrapper) {
			this.cachedContentTop =
				contentWrapper.getBoundingClientRect().top + scrollTop;
		} else {
			this.cachedContentTop = null;
		}

		const banner = this.bannerEl;
		const fallbackBannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
		if (banner && document.body.classList.contains("enable-banner")) {
			const rectHeight = banner.offsetHeight;
			this.cachedBannerHeight = rectHeight || fallbackBannerHeight;
			this.cachedBannerVisible =
				window.innerWidth >= 1280 && rectHeight > 0;
		} else {
			this.cachedBannerHeight = fallbackBannerHeight;
			this.cachedBannerVisible = false;
		}
	}

	/**
	 * 处理滚动事件（所有读取在前，仅在状态变化时写入 DOM）
	 */
	private handleScroll(): void {
		// 1. Read phase
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;
		const isHome =
			document.body.classList.contains("lg:is-home") &&
			viewportWidth >= 1280;
		const enableBannerClass = document.body.classList.contains("enable-banner");

		if (this.cachedContentTop === null) {
			this.measureLayoutMetrics();
		}

		const showBackToTopThreshold =
			this.cachedContentTop !== null
				? this.cachedContentTop + viewportHeight / 4
				: viewportHeight * (BANNER_HEIGHT / 100) +
					SCROLL_CONFIG.backToTopOffset;

		const shouldHideBackToTop = !(scrollTop > showBackToTopThreshold);
		const shouldHideTOC =
			enableBannerClass &&
			viewportWidth >= 1280 &&
			this.cachedBannerVisible &&
			scrollTop <= this.cachedBannerHeight;

		const currentBannerHeight = isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT;
		const navbarHideThreshold =
			viewportHeight * (currentBannerHeight / 100) -
			SCROLL_CONFIG.navbarHideOffset;
		const shouldHideNavbar = scrollTop >= navbarHideThreshold;

		// 2. Write phase (diffed - skip DOM writes when state is unchanged)
		if (this.backToTopBtn && this.lastBackToTopHidden !== shouldHideBackToTop) {
			this.lastBackToTopHidden = shouldHideBackToTop;
			this.backToTopBtn.classList.toggle("hide", shouldHideBackToTop);
			this.setButtonAccessibility(shouldHideBackToTop);
		}

		if (this.toc && this.lastTocHidden !== shouldHideTOC) {
			this.lastTocHidden = shouldHideTOC;
			this.toc.classList.toggle("toc-hide", shouldHideTOC);
		}

		if (
			this.bannerEnabled &&
			this.navbar &&
			this.lastNavbarHidden !== shouldHideNavbar
		) {
			this.lastNavbarHidden = shouldHideNavbar;
			this.navbar.classList.toggle("navbar-hidden", shouldHideNavbar);
		}
	}

	private setButtonAccessibility(hidden: boolean): void {
		const button =
			this.backToTopInnerBtn ?? this.backToTopBtn?.querySelector("button");
		if (!button) {
			return;
		}
		button.tabIndex = hidden ? -1 : 0;
		button.setAttribute("aria-hidden", String(hidden));
	}

	/**
	 * 处理窗口大小变化
	 */
	private handleResize(): void {
		// 计算 --banner-height-extend
		// 需要是 4 的倍数以避免模糊文本
		let offset = Math.floor(
			window.innerHeight * (BANNER_HEIGHT_EXTEND / 100),
		);
		offset = offset - (offset % 4);
		document.documentElement.style.setProperty(
			"--banner-height-extend",
			`${offset}px`,
		);
		this.measureLayoutMetrics();
		this.scheduleScrollUpdate();
	}

	/**
	 * 销毁处理器
	 */
	destroy(): void {
		if (this.scrollRafId !== null) {
			cancelAnimationFrame(this.scrollRafId);
			this.scrollRafId = null;
		}
		window.removeEventListener("scroll", this.scrollHandler);
		window.removeEventListener("resize", this.resizeHandler);
		window.removeEventListener(
			"wallpaper-mode-change",
			this.layoutInvalidateHandler,
		);
		document.removeEventListener(
			"swup:page:view",
			this.layoutInvalidateHandler,
		);
		this.backToTopBtn?.removeEventListener("click", this.clickHandler);
		this.eventsBound = false;
		this.backToTopBtn = null;
		this.backToTopInnerBtn = null;
		this.toc = null;
		this.navbar = null;
		this.bannerEl = null;
		this.cachedContentTop = null;
		this.lastBackToTopHidden = null;
		this.lastTocHidden = null;
		this.lastNavbarHidden = null;
	}

	/**
	 * 更新 Banner 启用状态
	 */
	setBannerEnabled(enabled: boolean): void {
		this.bannerEnabled = enabled;
	}
}

// 创建全局实例
let globalBackToTopHandler: BackToTopHandler | null = null;

/**
 * 获取全局返回顶部处理器实例
 */
export function getBackToTopHandler(bannerEnabled: boolean): BackToTopHandler {
	if (!globalBackToTopHandler) {
		globalBackToTopHandler = new BackToTopHandler(bannerEnabled);
	}
	return globalBackToTopHandler;
}

/**
 * 初始化返回顶部处理器（便捷函数）
 */
export function initBackToTopHandler(bannerEnabled: boolean): void {
	const handler = getBackToTopHandler(bannerEnabled);
	handler.init();
}
