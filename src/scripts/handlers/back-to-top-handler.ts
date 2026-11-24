/**
 * 返回顶部与全局滚动状态处理器
 * 统一管理返回顶部按钮、文章目录显隐以及全站导航栏区域化 Alpha 渐变
 */

import {
	BANNER_HEIGHT,
	BANNER_HEIGHT_EXTEND,
	BANNER_HEIGHT_HOME,
	SCROLL_CONFIG,
	SWUP_SELECTORS,
} from "../core/swup-config";

/**
 * 返回顶部及导航栏区域滚动状态处理器类
 */
export class BackToTopHandler {
	private backToTopBtn: HTMLElement | null = null;
	private backToTopInnerBtn: HTMLButtonElement | null = null;
	private toc: HTMLElement | null = null;
	private navbarEl: HTMLElement | null = null;
	private bannerEl: HTMLElement | null = null;
	private scrollRafId: number | null = null;
	private postTransitionTimerId: number | null = null;
	private eventsBound = false;
	private cachedContentTop: number | null = null;
	private cachedBannerHeight = 0;
	private cachedNavbarHeight = 72;
	private cachedBannerVisible = false;
	private cachedHasVisibleBanner = false;
	private lastBackToTopHidden: boolean | null = null;
	private lastTocHidden: boolean | null = null;
	private lastNavbarScrolled: boolean | null = null;
	private lastNavAlpha: number | null = null;
	private lastNavInBanner: boolean | null = null;
	private readonly scrollHandler = this.scheduleScrollUpdate.bind(this);
	private readonly resizeHandler = this.handleResize.bind(this);
	private readonly clickHandler = this.scrollToTop.bind(this);
	private readonly layoutInvalidateHandler =
		this.invalidateMetricsAndUpdate.bind(this);

	constructor(_bannerEnabled: boolean) {}

	/**
	 * 初始化滚动状态处理器
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
		this.navbarEl = document.getElementById(SWUP_SELECTORS.navbar.slice(1));
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
		window.addEventListener("navbar:sync", this.layoutInvalidateHandler);
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
		if (this.postTransitionTimerId !== null) {
			window.clearTimeout(this.postTransitionTimerId);
			this.postTransitionTimerId = null;
		}

		requestAnimationFrame(() => {
			this.cacheElements();
			this.lastNavbarScrolled = null;
			this.lastNavAlpha = null;
			this.lastNavInBanner = null;
			this.measureLayoutMetrics();
			this.handleScroll();

			// 路由或壁纸模式过渡结束后再校准一次内容与横幅几何高度
			this.postTransitionTimerId = window.setTimeout(() => {
				this.postTransitionTimerId = null;
				this.measureLayoutMetrics();
				this.handleScroll();
			}, 420);
		});
	}

	/**
	 * 统一在写操作之前读取布局几何信息，避免滚动期间读写交替导致强制同步重排
	 */
	private measureLayoutMetrics(): void {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		const contentWrapper = document.getElementById(
			SWUP_SELECTORS.contentWrapper.slice(1),
		);
		if (contentWrapper) {
			this.cachedContentTop =
				contentWrapper.getBoundingClientRect().top + scrollTop;
		} else {
			this.cachedContentTop = null;
		}

		this.cachedNavbarHeight = this.navbarEl?.offsetHeight || 72;

		const banner = this.bannerEl;
		const enableBannerMode =
			document.body.classList.contains("enable-banner");
		const isHome = document.body.classList.contains("lg:is-home");
		const isBannerHiddenOnMobile =
			viewportWidth < 1280 &&
			(banner?.classList.contains("mobile-hide-banner") || !isHome);

		if (enableBannerMode && banner && !isBannerHiddenOnMobile) {
			if (viewportWidth >= 1280) {
				// 桌面端横幅目标高度由模式类精确决定，避免在 380ms 切页高度过渡中间采样失真
				const targetVh = isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT;
				this.cachedBannerHeight = viewportHeight * (targetVh / 100);
			} else {
				this.cachedBannerHeight =
					banner.offsetHeight ||
					viewportHeight * (BANNER_HEIGHT / 100);
			}
			this.cachedHasVisibleBanner = this.cachedBannerHeight > 0;
			this.cachedBannerVisible =
				viewportWidth >= 1280 && this.cachedBannerHeight > 0;
		} else {
			this.cachedBannerHeight = 0;
			this.cachedHasVisibleBanner = false;
			this.cachedBannerVisible = false;
		}
	}

	/**
	 * 处理滚动事件（所有读取在前，仅在状态变化时写入 DOM）
	 *
	 * 导航栏区域规则（全站所有页面统一）：
	 * - 横幅模式下且当前视口存在可见横幅：
	 *   - 顶部（scrollTop = 0）：透明（full/semifull 为 0，semi 为 0.65）
	 *   - 离开横幅区域前（0 < scrollTop < bannerHeight - navbarHeight）：alpha 跟随滚动连续平滑递增
	 *   - 离开横幅区域后（scrollTop >= bannerHeight - navbarHeight）：固定为 1（毛玻璃背板），不再随滚动变化
	 * - 无横幅区域（移动端非首页、fullscreen、none 模式）：固定为 1
	 */
	private handleScroll(): void {
		// 1. Read phase
		const scrollTop = Math.max(
			0,
			window.scrollY || document.documentElement.scrollTop,
		);
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;
		const enableBannerClass =
			document.body.classList.contains("enable-banner");

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

		let targetAlpha = 1;
		let inBannerZone = false;
		let isScrolledBeyondBanner = true;

		if (this.navbarEl) {
			const dynamicMode = this.navbarEl.getAttribute(
				"data-dynamic-transparent",
			);
			const transparentMode = this.navbarEl.getAttribute(
				"data-transparent-mode",
			);

			if (
				this.cachedHasVisibleBanner &&
				dynamicMode !== "none" &&
				dynamicMode !== "semi"
			) {
				const leaveDistance = Math.max(
					64,
					this.cachedBannerHeight - this.cachedNavbarHeight,
				);
				const progress = Math.min(
					1,
					Math.max(0, scrollTop / leaveDistance),
				);

				targetAlpha =
					transparentMode === "semi"
						? 0.65 + 0.35 * progress
						: progress;
				inBannerZone = progress > 0 && progress < 1;
				isScrolledBeyondBanner = progress >= 1;
			}
		}

		const roundedAlpha =
			targetAlpha <= 0.002
				? 0
				: targetAlpha >= 0.998
					? 1
					: Number(targetAlpha.toFixed(3));

		// 2. Write phase (diffed - skip DOM writes when state is unchanged)
		if (
			this.backToTopBtn &&
			this.lastBackToTopHidden !== shouldHideBackToTop
		) {
			this.lastBackToTopHidden = shouldHideBackToTop;
			this.backToTopBtn.classList.toggle("hide", shouldHideBackToTop);
			this.setButtonAccessibility(shouldHideBackToTop);
		}

		if (this.toc && this.lastTocHidden !== shouldHideTOC) {
			this.lastTocHidden = shouldHideTOC;
			this.toc.classList.toggle("toc-hide", shouldHideTOC);
		}

		if (this.navbarEl) {
			if (this.lastNavAlpha !== roundedAlpha) {
				this.lastNavAlpha = roundedAlpha;
				this.navbarEl.style.setProperty(
					"--nav-alpha",
					String(roundedAlpha),
				);
			}

			if (this.lastNavInBanner !== inBannerZone) {
				this.lastNavInBanner = inBannerZone;
				this.navbarEl.setAttribute(
					"data-nav-in-banner",
					String(inBannerZone),
				);
			}

			if (this.lastNavbarScrolled !== isScrolledBeyondBanner) {
				this.lastNavbarScrolled = isScrolledBeyondBanner;
				this.navbarEl.classList.toggle(
					"scrolled",
					isScrolledBeyondBanner,
				);
			}
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
		if (this.postTransitionTimerId !== null) {
			window.clearTimeout(this.postTransitionTimerId);
			this.postTransitionTimerId = null;
		}
		window.removeEventListener("scroll", this.scrollHandler);
		window.removeEventListener("resize", this.resizeHandler);
		window.removeEventListener(
			"wallpaper-mode-change",
			this.layoutInvalidateHandler,
		);
		window.removeEventListener("navbar:sync", this.layoutInvalidateHandler);
		document.removeEventListener(
			"swup:page:view",
			this.layoutInvalidateHandler,
		);
		this.backToTopBtn?.removeEventListener("click", this.clickHandler);
		this.eventsBound = false;
		this.backToTopBtn = null;
		this.backToTopInnerBtn = null;
		this.toc = null;
		this.navbarEl = null;
		this.bannerEl = null;
		this.cachedContentTop = null;
		this.lastBackToTopHidden = null;
		this.lastTocHidden = null;
		this.lastNavbarScrolled = null;
		this.lastNavAlpha = null;
		this.lastNavInBanner = null;
	}

	/**
	 * 更新 Banner 启用状态（保留接口兼容）
	 */
	setBannerEnabled(_enabled: boolean): void {
		this.invalidateMetricsAndUpdate();
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
