/**
 * Fancybox 处理器
 * 管理图片灯箱的初始化和清理
 */

import fancyboxStylesheetUrl from "@fancyapps/ui/dist/fancybox/fancybox.css?url";

import { loadStylesheet } from "../utils/load-stylesheet";

import {
	FANCYBOX_SELECTORS,
	getDefaultFancyboxConfig,
} from "../core/swup-config";

const customStylesheetUrl = "/styles/fancybox-custom.css";

// Fancybox 模块类型
type FancyboxType = any;

/**
 * Fancybox 处理器类
 * 负责图片灯箱的按需加载和管理
 */
export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;
	private loadFailed = false;

	/**
	 * 初始化 Fancybox
	 * 模块可以按需加载，但样式必须在每次 Swup 切页后重新确认。
	 * Swup 的 updateHead 可能移除上一页动态插入的 link，而全局实例
	 * 仍然存在；只检查 this.Fancybox 会让下一篇文章落回无样式 DOM。
	 */
	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages || this.loadFailed) {
			return;
		}

		// 按需加载 Fancybox 模块
		if (!this.Fancybox) {
			try {
				await this.loadFancybox();
			} catch {
				// 灯箱是渐进增强；模块不可用时保留图片原生链接。
				this.Fancybox = null;
				this.loadFailed = true;
				return;
			}
		} else {
			try {
				await this.ensureStylesheets();
			} catch {
				// 样式不可用时不要打开半成品灯箱，保留图片原生链接。
				this.loadFailed = true;
				return;
			}
		}

		// 避免重复初始化
		if (this.boundSelectors.length > 0) {
			return;
		}

		this.bindImageSelectors();
		this.initialized = true;
	}

	/**
	 * 检查页面是否有需要 Fancybox 的图片
	 */
	private checkForImages(): boolean {
		return (
			document.querySelector(FANCYBOX_SELECTORS.albumImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.albumLinks) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.singleFancybox) !== null
		);
	}

	/**
	 * 确保 Fancybox 样式存在。
	 * 首屏的静态 link 会被直接复用；若 Swup 重建 head，则补回缺失 link。
	 */
	private async ensureStylesheets(): Promise<void> {
		await Promise.all([
			loadStylesheet(fancyboxStylesheetUrl, "fancybox"),
			loadStylesheet(customStylesheetUrl, "fancybox-custom"),
		]);
	}

	/**
	 * 加载 Fancybox 模块和样式
	 */
	private async loadFancybox(): Promise<void> {
		const [mod] = await Promise.all([
			import("@fancyapps/ui"),
			this.ensureStylesheets(),
		]);
		this.Fancybox = mod.Fancybox;
	}

	/**
	 * 绑定图片选择器
	 */
	private bindImageSelectors(): void {
		if (!this.Fancybox) {
			return;
		}

		const commonConfig = getDefaultFancyboxConfig();

		// 绑定相册/文章图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumImages, {
			...commonConfig,
			groupAll: true,
			Carousel: {
				transition: "slide",
				preload: 2,
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		// 绑定相册链接
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...commonConfig,
			source: (el: any) => {
				return el.getAttribute("data-src") || el.getAttribute("href");
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		// 绑定单独的 fancybox 图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.singleFancybox, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	/**
	 * 清理 Fancybox 绑定
	 * 在页面切换前调用
	 */
	cleanup(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	/**
	 * 完全销毁 Fancybox
	 */
	destroy(): void {
		this.cleanup();
		this.Fancybox = null;
		this.initialized = false;
		this.loadFailed = false;
	}

	/**
	 * 获取初始化状态
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 获取已绑定的选择器列表
	 */
	getBoundSelectors(): string[] {
		return [...this.boundSelectors];
	}
}

// 创建全局实例
let globalFancyboxHandler: FancyboxHandler | null = null;

/**
 * 获取全局 Fancybox 处理器实例
 */
export function getFancyboxHandler(): FancyboxHandler {
	if (!globalFancyboxHandler) {
		globalFancyboxHandler = new FancyboxHandler();
	}
	return globalFancyboxHandler;
}

/**
 * 初始化 Fancybox（便捷函数）
 */
export async function initFancybox(): Promise<void> {
	const handler = getFancyboxHandler();
	await handler.init();
}

/**
 * 清理 Fancybox（便捷函数）
 */
export function cleanupFancybox(): void {
	if (globalFancyboxHandler) {
		globalFancyboxHandler.cleanup();
	}
}
