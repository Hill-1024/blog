(() => {
	const STATE_KEY = "__mizukiDevicesPageHandler";
	const existingState = window[STATE_KEY];

	if (existingState?.initialise) {
		existingState.initialise();
		return;
	}

	const state = {
		root: null,
		controller: null,
		initialise: null,
	};

	function normalise(value) {
		return String(value || "")
			.toLocaleLowerCase()
			.trim();
	}

	function initialiseDevicesPage() {
		const root = document.querySelector("[data-devices-page]");

		if (!(root instanceof HTMLElement)) {
			state.controller?.abort();
			state.controller = null;
			state.root = null;
			return;
		}

		if (state.root === root && state.controller) return;

		state.controller?.abort();
		state.root = root;
		state.controller = new AbortController();
		const { signal } = state.controller;

		const filters = root.querySelector("[data-device-filters]");
		const combobox = root.querySelector("[data-device-combobox]");
		const searchbox = root.querySelector("[data-device-searchbox]");
		const searchInput = root.querySelector("[data-device-search]");
		const catalogue = root.querySelector("[data-device-catalogue]");
		const tagEmpty = root.querySelector("[data-device-tag-empty]");
		const activeTags = root.querySelector("[data-device-active-tags]");
		const clearButton = root.querySelector("[data-device-clear]");
		const cards = Array.from(root.querySelectorAll("[data-device-card]"));
		const emptyState = root.querySelector("[data-device-empty-state]");
		const resultSummary = root.querySelector(
			"[data-device-result-summary]",
		);

		if (
			!(filters instanceof HTMLElement) ||
			!(combobox instanceof HTMLElement) ||
			!(searchbox instanceof HTMLElement) ||
			!(searchInput instanceof HTMLInputElement) ||
			!(catalogue instanceof HTMLElement) ||
			!(activeTags instanceof HTMLElement) ||
			!(clearButton instanceof HTMLButtonElement) ||
			cards.length === 0
		) {
			return;
		}

		const selected = { category: new Set(), brand: new Set() };
		let selectedOrder = [];
		let activeOption = null;
		let suppressFocusOpen = false;

		function getTagButtons() {
			return Array.from(
				filters.querySelectorAll("button[data-device-tag]"),
			).filter((button) => button instanceof HTMLButtonElement);
		}

		function getVisibleTagButtons() {
			return getTagButtons().filter((button) => !button.hidden);
		}

		getTagButtons().forEach((button, index) => {
			if (!button.id) button.id = `device-tag-option-${index}`;
		});

		function setActiveOption(button, { scroll = false } = {}) {
			getTagButtons().forEach((tag) =>
				tag.classList.toggle("keyboard-active", tag === button),
			);
			activeOption = button instanceof HTMLButtonElement ? button : null;

			if (activeOption) {
				searchInput.setAttribute(
					"aria-activedescendant",
					activeOption.id,
				);
				if (scroll) activeOption.scrollIntoView({ block: "nearest" });
			} else {
				searchInput.removeAttribute("aria-activedescendant");
			}
		}

		function openCatalogue() {
			catalogue.hidden = false;
			combobox.dataset.open = "true";
			searchInput.setAttribute("aria-expanded", "true");
		}

		function closeCatalogue({ restoreFocus = false } = {}) {
			catalogue.hidden = true;
			delete combobox.dataset.open;
			searchInput.setAttribute("aria-expanded", "false");
			setActiveOption(null);
			if (restoreFocus) {
				suppressFocusOpen = true;
				searchInput.focus({ preventScroll: true });
				queueMicrotask(() => {
					suppressFocusOpen = false;
				});
			}
		}

		function appendActiveTag(group, value) {
			const button = document.createElement("button");
			const label = document.createElement("span");
			const removeIcon = document.createElement("span");
			button.type = "button";
			button.className = "device-active-tag";
			button.dataset.removeTag = "";
			button.dataset.tagGroup = group;
			button.dataset.tagValue = value;
			label.textContent = value;
			removeIcon.className = "device-active-tag-remove";
			removeIcon.textContent = "×";
			removeIcon.setAttribute("aria-hidden", "true");
			button.append(label, removeIcon);
			button.setAttribute("aria-label", `移除筛选标签：${value}`);
			activeTags.append(button);
		}

		function removeTag(group, value) {
			selected[group].delete(value);
			selectedOrder = selectedOrder.filter(
				(tag) => tag.group !== group || tag.value !== value,
			);
		}

		function toggleTag(button) {
			const group = button.dataset.tagGroup;
			const value = button.dataset.tagValue;
			if ((group !== "category" && group !== "brand") || !value) return;

			const collection = selected[group];
			if (collection.has(value)) {
				removeTag(group, value);
			} else {
				collection.add(value);
				selectedOrder.push({ group, value });
			}

			searchInput.value = "";
			update();
			openCatalogue();
			searchInput.focus({ preventScroll: true });
		}

		function update() {
			const query = normalise(searchInput.value);
			let visibleCount = 0;
			let visibleTagCount = 0;

			cards.forEach((card) => {
				const category = card.dataset.category;
				const brand = card.dataset.brand;
				const matchesCategory =
					selected.category.size === 0 ||
					selected.category.has(category);
				const matchesBrand =
					selected.brand.size === 0 || selected.brand.has(brand);
				const matchesSearch =
					!query || normalise(card.textContent).includes(query);
				const isVisible =
					matchesCategory && matchesBrand && matchesSearch;

				card.hidden = !isVisible;
				if (isVisible) visibleCount += 1;
			});

			getTagButtons().forEach((button) => {
				const group = button.dataset.tagGroup;
				const value = button.dataset.tagValue;
				if ((group !== "category" && group !== "brand") || !value)
					return;

				const isSelected = selected[group].has(value);
				const matchesQuery = !query || normalise(value).includes(query);
				button.classList.toggle("selected", isSelected);
				button.setAttribute("aria-selected", String(isSelected));
				button.hidden = !matchesQuery;
				button.tabIndex = -1;
				if (matchesQuery) visibleTagCount += 1;
			});

			activeTags.replaceChildren();
			selectedOrder.forEach(({ group, value }) =>
				appendActiveTag(group, value),
			);
			clearButton.hidden =
				selected.category.size === 0 &&
				selected.brand.size === 0 &&
				!searchInput.value;

			if (tagEmpty instanceof HTMLElement) {
				tagEmpty.hidden = visibleTagCount !== 0;
			}
			if (emptyState instanceof HTMLElement) {
				emptyState.hidden = visibleCount !== 0;
			}
			if (resultSummary instanceof HTMLElement) {
				resultSummary.textContent = `${visibleCount} 件设备`;
			}

			if (!catalogue.hidden) {
				setActiveOption(
					activeOption && !activeOption.hidden ? activeOption : null,
				);
			}
		}

		filters.addEventListener(
			"click",
			(event) => {
				const target = event.target;
				const element = target instanceof Element ? target : null;
				if (!element) return;

				const tag = element.closest("button[data-device-tag]");
				if (tag instanceof HTMLButtonElement) {
					toggleTag(tag);
					return;
				}

				const activeTag = element.closest("button[data-remove-tag]");
				if (activeTag instanceof HTMLButtonElement) {
					const group = activeTag.dataset.tagGroup;
					const value = activeTag.dataset.tagValue;
					if ((group !== "category" && group !== "brand") || !value)
						return;

					removeTag(group, value);
					update();
					searchInput.focus({ preventScroll: true });
					openCatalogue();
					return;
				}

				if (element.closest("button[data-device-clear]")) {
					selected.category.clear();
					selected.brand.clear();
					selectedOrder = [];
					searchInput.value = "";
					update();
					searchInput.focus({ preventScroll: true });
					openCatalogue();
				}
			},
			{ signal },
		);

		searchbox.addEventListener(
			"pointerdown",
			(event) => {
				if (!(event.target instanceof Element)) return;
				if (event.target.closest("button")) return;
				openCatalogue();
				if (event.target !== searchInput) {
					event.preventDefault();
					searchInput.focus({ preventScroll: true });
				}
			},
			{ signal },
		);

		searchInput.addEventListener(
			"focus",
			() => {
				if (!suppressFocusOpen) openCatalogue();
			},
			{ signal },
		);
		searchInput.addEventListener(
			"input",
			() => {
				update();
				openCatalogue();
			},
			{ signal },
		);
		searchInput.addEventListener(
			"keydown",
			(event) => {
				if (
					event.key === "Backspace" &&
					!searchInput.value &&
					selectedOrder.length > 0
				) {
					event.preventDefault();
					const lastTag = selectedOrder.at(-1);
					if (!lastTag) return;
					removeTag(lastTag.group, lastTag.value);
					update();
					return;
				}

				if (event.key === "ArrowDown" || event.key === "ArrowUp") {
					event.preventDefault();
					openCatalogue();
					const visibleTags = getVisibleTagButtons();
					if (visibleTags.length === 0) return;
					const currentIndex = visibleTags.indexOf(activeOption);
					const step = event.key === "ArrowDown" ? 1 : -1;
					const nextIndex =
						currentIndex < 0
							? event.key === "ArrowDown"
								? 0
								: visibleTags.length - 1
							: (currentIndex + step + visibleTags.length) %
								visibleTags.length;
					setActiveOption(visibleTags[nextIndex], { scroll: true });
					return;
				}

				if (event.key === "Enter" && !catalogue.hidden) {
					const target =
						activeOption && !activeOption.hidden
							? activeOption
							: getVisibleTagButtons()[0];
					if (target) {
						event.preventDefault();
						toggleTag(target);
					}
					return;
				}

				if (event.key === "Escape" && !catalogue.hidden) {
					event.preventDefault();
					closeCatalogue();
					return;
				}

				if (event.key === "Tab" && !catalogue.hidden) closeCatalogue();
			},
			{ signal },
		);

		combobox.addEventListener(
			"focusout",
			() => {
				requestAnimationFrame(() => {
					if (!combobox.contains(document.activeElement))
						closeCatalogue();
				});
			},
			{ signal },
		);

		document.addEventListener(
			"pointerdown",
			(event) => {
				if (
					!(event.target instanceof Node) ||
					combobox.contains(event.target)
				) {
					return;
				}
				closeCatalogue();
			},
			{ capture: true, signal },
		);

		update();
	}

	state.initialise = initialiseDevicesPage;
	window[STATE_KEY] = state;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialiseDevicesPage, {
			once: true,
		});
	} else {
		initialiseDevicesPage();
	}

	[
		"astro:page-load",
		"astro:after-swap",
		"swup:contentReplaced",
		"swup:pageView",
	].forEach((eventName) =>
		document.addEventListener(eventName, initialiseDevicesPage),
	);
})();
