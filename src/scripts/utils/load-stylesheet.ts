type LoadStylesheetOptions = {
	preload?: boolean;
};

const pendingStylesheets = new Map<string, Promise<void>>();

/**
 * Load a stylesheet only when the feature that needs it is used.
 * Preloading is opt-in so non-critical CSS never becomes a render-blocking
 * dependency of the initial document.
 */
export function loadStylesheet(
	href: string,
	id: string,
	{ preload = false }: LoadStylesheetOptions = {},
): Promise<void> {
	if (typeof document === "undefined") {
		return Promise.resolve();
	}

	const existing = document.head.querySelector<HTMLLinkElement>(
		`link[data-dynamic-stylesheet="${id}"]`,
	);
	if (existing?.rel === "stylesheet") {
		return Promise.resolve();
	}

	const pending = pendingStylesheets.get(id);
	if (pending) {
		return pending;
	}

	const promise = new Promise<void>((resolve, reject) => {
		const link = existing ?? document.createElement("link");
		link.dataset.dynamicStylesheet = id;
		link.href = href;

		const finish = () => {
			if (preload) {
				link.rel = "stylesheet";
				link.removeAttribute("as");
			}
			pendingStylesheets.delete(id);
			resolve();
		};
		const fail = () => {
			pendingStylesheets.delete(id);
			reject(new Error(`Failed to load stylesheet: ${href}`));
		};

		link.onload = finish;
		link.onerror = fail;
		if (preload) {
			link.rel = "preload";
			link.as = "style";
		} else {
			link.rel = "stylesheet";
		}

		if (!existing) {
			document.head.appendChild(link);
		}
	});

	pendingStylesheets.set(id, promise);
	return promise;
}
