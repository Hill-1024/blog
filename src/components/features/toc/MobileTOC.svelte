<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";

	import I18nKey from "../../../i18n/i18nKey";
	import { i18n } from "../../../i18n/translation";
	import {
		panelManager,
		type PanelStateChangeDetail,
	} from "../../../utils/panel-manager.js";
	import {
		checkIsHomePage,
		generateTOCItems,
		getTOCConfig,
		scrollToHeading as scrollToHeadingUtil,
		type TOCItem,
	} from "./hooks/useMobileTOC";

	let tocItems: TOCItem[] = $state([]);
	let activeId = $state("");
	let isOpen = $state(false);

	let observer: IntersectionObserver | undefined;
	let activeFrame: number | undefined;
	let refreshTimer: number | undefined;
	let registeredSwup: Swup | undefined;

	const togglePanel = async () => {
		isOpen = await panelManager.togglePanel("mobile-toc-panel");
	};

	const closePanel = async (restoreFocus = false): Promise<void> => {
		await panelManager.closePanel("mobile-toc-panel");
		isOpen = false;
		if (restoreFocus) {
			requestAnimationFrame(() => {
				document.getElementById("mobile-toc-switch")?.focus();
			});
		}
	};

	const scrollToHeading = (id: string) => {
		void closePanel();
		scrollToHeadingUtil(id);
	};

	const getContent = (): Element | null => {
		return document.querySelector(
			"#post-container .markdown-content, #post-container .custom-md, .markdown-content, .custom-md, .prose",
		);
	};

	const updateActiveHeading = () => {
		const headings = tocItems
			.map((item) => document.getElementById(item.id))
			.filter((heading): heading is HTMLElement => heading !== null);

		// Keep the first item active at the top of the article instead of
		// presenting a TOC with no current location.
		let currentActiveId = headings[0]?.id ?? "";
		for (const heading of headings) {
			if (heading.getBoundingClientRect().top <= 112) {
				currentActiveId = heading.id;
			} else {
				break;
			}
		}

		activeId = currentActiveId;
	};

	const scheduleActiveUpdate = () => {
		if (activeFrame !== undefined) {
			return;
		}
		activeFrame = requestAnimationFrame(() => {
			activeFrame = undefined;
			updateActiveHeading();
		});
	};

	const setupIntersectionObserver = () => {
		observer?.disconnect();

		observer = new IntersectionObserver(scheduleActiveUpdate, {
			rootMargin: "-80px 0px -75% 0px",
			threshold: 0,
		});

		tocItems.forEach((item) => {
			const heading = document.getElementById(item.id);
			if (heading) {
				observer?.observe(heading);
			}
		});
	};

	const init = async () => {
		await closePanel();
		observer?.disconnect();

		if (checkIsHomePage()) {
			tocItems = [];
			activeId = "";
			return;
		}

		const content = getContent();
		if (!content) {
			tocItems = [];
			activeId = "";
			return;
		}

		tocItems = generateTOCItems(getTOCConfig());
		if (tocItems.length === 0) {
			activeId = "";
			return;
		}

		setupIntersectionObserver();
		updateActiveHeading();
	};

	const scheduleRefresh = (delay = 80) => {
		if (refreshTimer !== undefined) {
			window.clearTimeout(refreshTimer);
		}
		refreshTimer = window.setTimeout(() => {
			refreshTimer = undefined;
			void init();
		}, delay);
	};

	const handlePageView = (..._args: unknown[]) => scheduleRefresh();

	const registerSwupListener = () => {
		const swup = window.swup;
		if (!swup || swup === registeredSwup) {
			return;
		}

		registeredSwup?.hooks.off("page:view", handlePageView);
		swup.hooks.on("page:view", handlePageView);
		registeredSwup = swup;
	};

	const handlePanelStateChange = (event: Event) => {
		const { detail } = event as CustomEvent<PanelStateChangeDetail>;
		if (detail.panelId === "mobile-toc-panel") {
			isOpen = detail.isOpen;
		}
	};

	onMount(() => {
		const exposedInit = () => scheduleRefresh(0);
		window.mobileTOCInit = exposedInit;

		registerSwupListener();
		scheduleRefresh(0);

		window.addEventListener("scroll", scheduleActiveUpdate, {
			passive: true,
		});
		window.addEventListener("resize", scheduleActiveUpdate, {
			passive: true,
		});
		window.addEventListener("popstate", handlePageView);
		document.addEventListener("swup:enable", registerSwupListener);
		document.addEventListener("panel-state-change", handlePanelStateChange);

		return () => {
			observer?.disconnect();
			if (activeFrame !== undefined) {
				cancelAnimationFrame(activeFrame);
			}
			if (refreshTimer !== undefined) {
				window.clearTimeout(refreshTimer);
			}

			window.removeEventListener("scroll", scheduleActiveUpdate);
			window.removeEventListener("resize", scheduleActiveUpdate);
			window.removeEventListener("popstate", handlePageView);
			document.removeEventListener("swup:enable", registerSwupListener);
			document.removeEventListener(
				"panel-state-change",
				handlePanelStateChange,
			);
			registeredSwup?.hooks.off("page:view", handlePageView);

			if (window.mobileTOCInit === exposedInit) {
				delete window.mobileTOCInit;
			}
		};
	});

	const getLevelPadding = (depth: number): string => {
		const base = "12px";
		const levelPadding: Record<number, string> = {
			0: "12px",
			1: "28px",
			2: "40px",
			3: "48px",
		};
		return levelPadding[depth] || base;
	};

	const getActivePadding = (depth: number): string => {
		const activePadding: Record<number, string> = {
			0: "9px",
			1: "25px",
			2: "37px",
			3: "45px",
		};
		return activePadding[depth] || "9px";
	};
</script>

{#if tocItems.length > 0}
	<button
		type="button"
		onclick={togglePanel}
		aria-label={i18n(I18nKey.tableOfContents)}
		aria-controls="mobile-toc-panel"
		aria-expanded={isOpen}
		id="mobile-toc-switch"
		class="btn-plain scale-animation rounded-lg h-[44px] w-[44px] active:scale-90 min-[1280px]:!hidden theme-switch-btn"
	>
		<Icon
			icon="material-symbols:format-list-bulleted"
			class="text-[1.25rem]"
			aria-hidden="true"
		/>
	</button>

	<nav
		id="mobile-toc-panel"
		aria-label={i18n(I18nKey.tableOfContents)}
		aria-hidden={!isOpen}
		inert={!isOpen}
		class="float-panel float-panel-closed mobile-toc-panel absolute md:w-[20rem] w-[calc(100vw-2rem)] top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-4 min-[1280px]:!hidden"
	>
		<div class="flex items-center justify-between mb-4">
			<p class="text-lg font-bold text-[var(--primary)]">
				{i18n(I18nKey.tableOfContents)}
			</p>
			<button
				type="button"
				onclick={() => closePanel(true)}
				aria-label="关闭目录"
				class="btn-plain rounded-lg h-[44px] w-[44px] active:scale-90 theme-switch-btn"
			>
				<Icon
					icon="material-symbols:close"
					class="text-[1rem]"
					aria-hidden="true"
				/>
			</button>
		</div>

		<div class="toc-content">
			{#each tocItems as item}
				<button
					type="button"
					onclick={() => scrollToHeading(item.id)}
					class="toc-item depth-{item.depth}"
					class:active={activeId === item.id}
					aria-current={activeId === item.id ? "location" : undefined}
					style="padding-left: {activeId === item.id
						? getActivePadding(item.depth)
						: getLevelPadding(item.depth)}"
				>
					{#if item.depth === 0}
						<span class="badge">{item.badge}</span>
					{:else if item.depth === 1}
						<span class="dot-square"></span>
					{:else}
						<span class="dot-small"></span>
					{/if}
					<span class="toc-text">{item.text}</span>
				</button>
			{/each}
		</div>
	</nav>
{/if}

<style>
	.mobile-toc-panel {
		max-height: calc(100vh - 120px);
		overflow-y: auto;
		background: var(--card-bg);
		border: 1px solid var(--line-color);
		backdrop-filter: blur(10px);
	}

	:global(.theme-switch-btn)::before {
		transition:
			transform 75ms ease-out,
			background-color 0ms !important;
	}

	.toc-content,
	.post-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.post-content {
		gap: 4px;
	}

	.toc-item {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 44px;
		text-align: left;
		padding: 8px 12px;
		border-radius: 8px;
		transition: all 0.2s ease;
		border: none;
		background: transparent;
		cursor: pointer;
		color: rgba(0, 0, 0, 0.75);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	:global(.dark) .toc-item {
		color: rgba(255, 255, 255, 0.75);
	}

	.toc-item:hover {
		background: var(--btn-plain-bg-hover);
		color: var(--primary);
	}

	.toc-item.active {
		background: var(--btn-plain-bg-active);
		color: var(--primary);
		font-weight: 600;
		border-left: 3px solid var(--primary);
	}

	.toc-item.depth-0 {
		font-weight: 600;
		font-size: 1rem;
		gap: 8px;
	}

	.toc-item.depth-1 {
		gap: 6px;
	}

	.toc-item.depth-2,
	.toc-item.depth-3 {
		font-size: 0.85rem;
		gap: 6px;
	}

	.toc-item.depth-3 {
		font-size: 0.8rem;
	}

	.toc-item.depth-4,
	.toc-item.depth-5 {
		font-size: 0.75rem;
		color: rgba(0, 0, 0, 0.5);
		gap: 6px;
	}

	:global(.dark) .toc-item.depth-4,
	:global(.dark) .toc-item.depth-5 {
		color: rgba(255, 255, 255, 0.5);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		border-radius: 6px;
		background: var(--toc-badge-bg);
		color: var(--btn-content);
		font-size: 0.8rem;
		font-weight: 600;
		flex-shrink: 0;
		line-height: 1;
	}

	.dot-square {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--toc-badge-bg);
		flex-shrink: 0;
	}

	.dot-small {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.05);
		flex-shrink: 0;
	}

	:global(.dark) .dot-small {
		background: rgba(255, 255, 255, 0.1);
	}

	.toc-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	:global(.pinned-icon) {
		display: inline;
		color: var(--primary);
		font-size: 1.25rem;
		margin-right: 0.5rem;
		transform: translateY(-0.125rem);
		vertical-align: middle;
	}

	.mobile-toc-panel::-webkit-scrollbar {
		width: 4px;
	}

	.mobile-toc-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.mobile-toc-panel::-webkit-scrollbar-thumb {
		background: var(--line-color);
		border-radius: 2px;
	}

	.mobile-toc-panel::-webkit-scrollbar-thumb:hover {
		background: var(--text-color-25);
	}
</style>
