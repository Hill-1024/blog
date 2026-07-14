/**
 * 统一的浮窗管理器
 * 确保同一时间只有一个浮窗处于打开状态，并提供统一的动画效果
 */

type PanelId =
	| "mobile-toc-panel"
	| "display-setting"
	| "nav-menu-panel"
	| "search-panel"
	| "wallpaper-mode-panel";

const panelIds: PanelId[] = [
	"mobile-toc-panel",
	"display-setting",
	"nav-menu-panel",
	"search-panel",
	"wallpaper-mode-panel",
];

const panelTriggers: Record<PanelId, string> = {
	"mobile-toc-panel": "mobile-toc-switch",
	"display-setting": "display-settings-switch",
	"nav-menu-panel": "nav-menu-switch",
	"search-panel": "search-switch",
	"wallpaper-mode-panel": "wallpaper-mode-switch",
};

export interface PanelStateChangeDetail {
	panelId: PanelId;
	isOpen: boolean;
}

class PanelManager {
	private activePanels = new Set<PanelId>();
	private panelStack: PanelId[] = [];
	private readonly duration = 100;
	private readonly mobileOnlyPanels: PanelId[] = [
		"mobile-toc-panel",
		"nav-menu-panel",
		"search-panel",
	];

	private handleDocumentKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Escape") return;
		const panelId = this.panelStack.at(-1);
		if (!panelId) return;

		event.preventDefault();
		void this.closePanel(panelId).then(() => {
			document.getElementById(panelTriggers[panelId])?.focus();
		});
	};

	private handleViewportChange = (): void => {
		if (window.innerWidth < 1280) return;

		this.mobileOnlyPanels.forEach((panelId) => {
			const panel = document.getElementById(panelId);
			if (panel && !panel.classList.contains("float-panel-closed")) {
				void this.closePanel(panelId);
			}
		});
	};

	constructor() {
		if (typeof document === "undefined") return;
		document.addEventListener("keydown", this.handleDocumentKeydown);
		window.addEventListener("resize", this.handleViewportChange, {
			passive: true,
		});

		queueMicrotask(() => {
			panelIds.forEach((panelId) => {
				const panel = document.getElementById(panelId);
				if (!panel) return;

				const isOpen = !panel.classList.contains("float-panel-closed");
				this.syncAccessibility(panelId, panel, isOpen, false);
				if (isOpen) {
					this.activePanels.add(panelId);
					this.panelStack.push(panelId);
				}
			});
			this.handleViewportChange();
		});
	}

	private syncAccessibility(
		panelId: PanelId,
		panel: HTMLElement,
		isOpen: boolean,
		dispatch = true,
	): void {
		panel.setAttribute("aria-hidden", String(!isOpen));
		if (isOpen) {
			panel.removeAttribute("inert");
		} else {
			panel.setAttribute("inert", "");
		}

		const trigger = document.getElementById(panelTriggers[panelId]);
		trigger?.setAttribute("aria-expanded", String(isOpen));

		if (dispatch) {
			document.dispatchEvent(
				new CustomEvent<PanelStateChangeDetail>("panel-state-change", {
					detail: { panelId, isOpen },
				}),
			);
		}
	}

	/**
	 * 应用动画打开浮窗
	 */
	private animateIn(panel: HTMLElement): Promise<void> {
		return new Promise((resolve) => {
			// 检查是否正在主题切换，如果是则跳过动画
			const isThemeTransitioning =
				document.documentElement.classList.contains(
					"is-theme-transitioning",
				);

			if (isThemeTransitioning) {
				// 主题切换期间，直接显示面板，不设置pointer-events: none
				panel.classList.remove("float-panel-closed");
				panel.style.opacity = "1";
				panel.style.transform = "scale(1) translateY(0)";
				resolve();
				return;
			}

			panel.classList.remove("float-panel-closed");
			panel.style.opacity = "0";
			panel.style.transform = "scale(0.95) translateY(-10px)";
			panel.style.pointerEvents = "none";

			requestAnimationFrame(() => {
				panel.style.transition = `all ${this.duration}ms ease-out`;

				requestAnimationFrame(() => {
					panel.style.opacity = "1";
					panel.style.transform = "scale(1) translateY(0)";
					panel.style.pointerEvents = "auto";

					setTimeout(() => {
						panel.style.transition = "";
						resolve();
					}, this.duration);
				});
			});
		});
	}

	/**
	 * 应用动画关闭浮窗
	 */
	private animateOut(panel: HTMLElement): Promise<void> {
		return new Promise((resolve) => {
			// 检查是否正在主题切换
			const isThemeTransitioning =
				document.documentElement.classList.contains(
					"is-theme-transitioning",
				);

			if (isThemeTransitioning) {
				// 主题切换期间，直接关闭面板，不设置pointer-events: none
				panel.classList.add("float-panel-closed");
				panel.style.opacity = "";
				panel.style.transform = "";
				resolve();
				return;
			}

			panel.style.transition = `all ${this.duration}ms ease-out`;
			panel.style.pointerEvents = "none";
			panel.style.opacity = "0";
			panel.style.transform = "scale(0.95) translateY(-10px)";

			setTimeout(() => {
				panel.classList.add("float-panel-closed");
				panel.style.transition = "";
				panel.style.opacity = "";
				panel.style.transform = "";
				panel.style.pointerEvents = "";
				resolve();
			}, this.duration);
		});
	}

	/**
	 * 切换指定浮窗的开关状态
	 * @param panelId 浮窗ID
	 * @param forceState 强制设置状态 (可选)
	 * @returns 浮窗最终状态 (true: 打开, false: 关闭)
	 */
	async togglePanel(
		panelId: PanelId,
		forceState?: boolean,
	): Promise<boolean> {
		const panel = document.getElementById(panelId);
		if (!panel) {
			console.warn(`Panel ${panelId} not found`);
			return false;
		}

		const isClosed = panel.classList.contains("float-panel-closed");
		const shouldOpen = forceState !== undefined ? forceState : isClosed;

		if (shouldOpen) {
			await this.closeAllPanelsExcept(panelId);
			this.syncAccessibility(panelId, panel, true);
			await this.animateIn(panel);
			this.activePanels.add(panelId);
			this.panelStack = this.panelStack.filter((id) => id !== panelId);
			this.panelStack.push(panelId);
			return true;
		}
		await this.closePanel(panelId);
		return false;
	}

	/**
	 * 关闭指定浮窗
	 * @param panelId 浮窗ID
	 */
	async closePanel(panelId: PanelId): Promise<void> {
		const panel = document.getElementById(panelId);
		if (!panel) {
			this.activePanels.delete(panelId);
			this.panelStack = this.panelStack.filter((id) => id !== panelId);
			return;
		}

		this.syncAccessibility(panelId, panel, false);
		if (!panel.classList.contains("float-panel-closed")) {
			await this.animateOut(panel);
		}
		this.activePanels.delete(panelId);
		this.panelStack = this.panelStack.filter((id) => id !== panelId);
	}

	/**
	 * 关闭指定浮窗外的所有浮窗
	 * @param exceptPanelId 要保持打开的浮窗ID
	 */
	async closeAllPanelsExcept(exceptPanelId?: PanelId): Promise<void> {
		const closingPromises = panelIds
			.filter((panelId) => panelId !== exceptPanelId)
			.filter((panelId) => document.getElementById(panelId) !== null)
			.map((panelId) => this.closePanel(panelId));

		await Promise.all(closingPromises);
	}
}

// 创建全局浮窗管理器实例
export const panelManager = new PanelManager();

// 将浮窗管理器暴露到全局，方便在其他地方使用
if (typeof window !== "undefined") {
	(window as any).panelManager = panelManager;
}

export default panelManager;
