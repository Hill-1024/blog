<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import { onMount } from "svelte";

	export let tags: string[];
	export let categories: string[];
	export let sortedPosts: Post[] = [];

	const params = new URLSearchParams(window.location.search);
	tags = params.has("tag") ? params.getAll("tag") : [];
	categories = params.has("category") ? params.getAll("category") : [];
	const uncategorized = params.get("uncategorized");

	interface Post {
		id: string;
		url?: string; // 预计算的文章 URL
		data: {
			title: string;
			tags: string[];
			category?: string;
			published: Date;
			alias?: string;
			permalink?: string; // 自定义固定链接
		};
	}

	interface Group {
		year: number;
		posts: Post[];
	}

	let groups: Group[] = [];
	let initialized = false;

	function formatDate(date: Date) {
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${month}-${day}`;
	}

	function formatTag(tagList: string[]) {
		return tagList.map((t) => `#${t}`).join(" ");
	}

	onMount(async () => {
		let filteredPosts: Post[] = sortedPosts;

		if (tags.length > 0) {
			filteredPosts = filteredPosts.filter(
				(post) =>
					Array.isArray(post.data.tags) &&
					post.data.tags.some((tag) => tags.includes(tag)),
			);
		}

		if (categories.length > 0) {
			filteredPosts = filteredPosts.filter(
				(post) =>
					post.data.category &&
					categories.includes(post.data.category),
			);
		}

		if (uncategorized) {
			filteredPosts = filteredPosts.filter((post) => !post.data.category);
		}

		// 按发布时间倒序排序，确保不受置顶影响
		filteredPosts = filteredPosts
			.slice()
			.sort(
				(a, b) =>
					b.data.published.getTime() - a.data.published.getTime(),
			);

		const grouped = filteredPosts.reduce(
			(acc, post) => {
				const year = post.data.published.getFullYear();
				if (!acc[year]) {
					acc[year] = [];
				}
				acc[year].push(post);
				return acc;
			},
			{} as Record<number, Post[]>,
		);

		const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
			year: Number.parseInt(yearStr, 10),
			posts: grouped[Number.parseInt(yearStr, 10)],
		}));

		groupedPostsArray.sort((a, b) => b.year - a.year);

		groups = groupedPostsArray;
		initialized = true;
	});
</script>

<div class="card-base px-4 py-5 sm:px-6 md:px-8 sm:py-6">
	{#each groups as group}
		<div>
			<div class="archive-year-row min-h-[3.75rem] items-center">
				<div
					class="archive-year transition text-2xl font-bold text-right text-75"
				>
					{group.year}
				</div>
				<div class="archive-rail-cell">
					<div
						class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                  -outline-offset-[2px] z-50 outline-3"
					></div>
				</div>
				<div class="min-w-0 transition text-left text-50">
					{group.posts.length}
					{i18n(
						group.posts.length === 1
							? I18nKey.postCount
							: I18nKey.postsCount,
					)}
				</div>
			</div>

			{#each group.posts as post}
				<a
					href={post.url || `/posts/${post.id}/`}
					aria-label={post.data.title}
					class="group btn-plain !block min-h-11 w-full rounded-lg hover:text-[initial]"
				>
					<div class="archive-post-row min-h-11 items-stretch">
						<!-- date -->
						<time
							datetime={post.data.published.toISOString()}
							class="self-center transition text-sm text-right text-50"
						>
							{formatDate(post.data.published)}
						</time>

						<!-- dot and line -->
						<div
							class="archive-rail-cell relative dash-line min-h-11 flex items-center"
						>
							<div
								class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                       bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                       outline outline-4 z-50
                       outline-[var(--card-bg)]
                       group-hover:outline-[var(--btn-plain-bg-hover)]
                       group-active:outline-[var(--btn-plain-bg-active)]"
							></div>
						</div>

						<!-- post title -->
						<div
							class="archive-post-title min-w-0 self-center text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
									 text-75 pr-2 sm:pr-4"
						>
							{post.data.title}
						</div>

						<!-- tag list -->
						<div
							class="archive-post-tags hidden lg:block self-center text-left text-sm transition
                     whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
						>
							{formatTag(post.data.tags)}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/each}

	{#if initialized && groups.length === 0}
		<div class="py-12 text-center text-black/55 dark:text-white/55">
			{i18n(I18nKey.noData)}
		</div>
	{/if}
</div>

<style>
	.archive-year-row,
	.archive-post-row {
		display: grid;
		grid-template-columns: 3.75rem 2rem minmax(0, 1fr);
	}

	.archive-year {
		font-size: clamp(1.125rem, 6vw, 1.5rem);
	}

	.archive-rail-cell {
		min-width: 0;
	}

	.archive-post-title {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	@media (min-width: 768px) {
		.archive-year-row,
		.archive-post-row {
			grid-template-columns: 5rem 3.5rem minmax(0, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.archive-post-row {
			grid-template-columns: 5rem 3.5rem minmax(0, 1fr) minmax(7rem, 15%);
		}
	}
</style>
