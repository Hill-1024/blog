import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(rootDir, "content");

if (process.env.CI !== "true" && process.env.ALLOW_CI_FIXTURES !== "true") {
	console.error(
		"Refusing to prepare fixture content outside CI. Set ALLOW_CI_FIXTURES=true to override.",
	);
	process.exit(1);
}

try {
	await fs.access(path.join(contentDir, ".git"));
	if (process.env.ALLOW_CI_FIXTURES !== "true") {
		console.error(
			`Refusing to write fixtures into a git content repository: ${contentDir}`,
		);
		process.exit(1);
	}
} catch {
	// No nested content repository is present, so fixture generation is safe.
}

const files = {
	"posts/ci-smoke.md": `---
title: CI Smoke Post
published: 2026-01-01
description: Minimal fixture content for code-only CI.
tags: [ci]
category: CI
draft: false
---

# CI Smoke Post

This placeholder exists only in the CI workspace.
`,
	"spec/about.md": `# About

CI fixture page.
`,
	"spec/friends.md": `# Friends

CI fixture page.
`,
	"data/anime.ts": `export type AnimeItem = {
	title: string;
	status: "watching" | "completed" | "planned";
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string[];
	studio: string;
	link: string;
	progress: number;
	totalEpisodes: number;
	startDate: string;
	endDate: string;
};

const localAnimeList: AnimeItem[] = [
	{
		title: "CI Anime",
		status: "completed",
		rating: 0,
		cover: "/assets/anime/cmmn.webp",
		description: "CI fixture item",
		episodes: "1 episode",
		year: "2026",
		genre: ["CI"],
		studio: "CI",
		link: "#",
		progress: 1,
		totalEpisodes: 1,
		startDate: "2026-01",
		endDate: "2026-01",
	},
];

export default localAnimeList;
`,
	"data/devices.ts": `export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

export type DeviceCategory = Record<string, Device[]>;

export const devicesData: DeviceCategory = {
	CI: [
		{
			name: "CI Device",
			image: "/assets/home/default-logo.webp",
			specs: "Fixture",
			description: "CI fixture device",
			link: "#",
		},
	],
};
`,
	"data/diary.ts": `export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

const diaryData: DiaryItem[] = [
	{
		id: 1,
		content: "CI fixture diary",
		date: "2026-01-01T00:00:00Z",
		tags: ["ci"],
	},
];

export const getDiaryStats = () => ({
	total: diaryData.length,
	hasImages: 0,
	hasLocation: 0,
	hasMood: 0,
	imagePercentage: 0,
	locationPercentage: 0,
	moodPercentage: 0,
});

export const getDiaryList = (limit?: number) => {
	const sortedData = [...diaryData].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
	return limit && limit > 0 ? sortedData.slice(0, limit) : sortedData;
};

export const getLatestDiary = () => getDiaryList(1)[0];
export const getDiaryById = (id: number) => diaryData.find((item) => item.id === id);
export const getDiaryWithImages = () => diaryData.filter((item) => item.images?.length);
export const getDiaryByTag = (tag: string) =>
	diaryData.filter((item) => item.tags?.includes(tag));
export const getAllTags = () => Array.from(new Set(diaryData.flatMap((item) => item.tags || []))).sort();

export default diaryData;
`,
	"data/friends.ts": `export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "CI Friend",
		imgurl: "/assets/home/default-logo.webp",
		desc: "CI fixture friend",
		siteurl: "https://example.com",
		tags: ["ci"],
	},
];

export function getFriendsList(): FriendItem[] {
	return friendsData;
}

export function getShuffledFriendsList(): FriendItem[] {
	return [...friendsData];
}
`,
	"data/projects.ts": `export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	visitUrl?: string;
}

export const projectsData: Project[] = [
	{
		id: "ci-project",
		title: "CI Project",
		description: "CI fixture project",
		image: "/assets/home/default-logo.webp",
		category: "web",
		techStack: ["Astro"],
		status: "completed",
		startDate: "2026-01-01",
		tags: ["ci"],
	},
];

export const getProjectStats = () => ({
	total: projectsData.length,
	byStatus: {
		completed: projectsData.filter((p) => p.status === "completed").length,
		inProgress: projectsData.filter((p) => p.status === "in-progress").length,
		planned: projectsData.filter((p) => p.status === "planned").length,
	},
});

export const getProjectsByCategory = (category?: string) =>
	!category || category === "all"
		? projectsData
		: projectsData.filter((p) => p.category === category);
export const getFeaturedProjects = () => projectsData.filter((p) => p.featured);
export const getAllTechStack = () =>
	Array.from(new Set(projectsData.flatMap((project) => project.techStack))).sort();
`,
	"data/skills.ts": `export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: "frontend" | "backend" | "database" | "tools" | "other";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[];
	certifications?: string[];
	color?: string;
}

export const skillsData: Skill[] = [
	{
		id: "astro",
		name: "Astro",
		description: "CI fixture skill",
		icon: "logos:astro-icon",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 1 },
		color: "#ff5d01",
	},
];

export const getSkillStats = () => ({
	total: skillsData.length,
	byLevel: {
		beginner: skillsData.filter((s) => s.level === "beginner").length,
		intermediate: skillsData.filter((s) => s.level === "intermediate").length,
		advanced: skillsData.filter((s) => s.level === "advanced").length,
		expert: skillsData.filter((s) => s.level === "expert").length,
	},
	byCategory: {
		frontend: skillsData.filter((s) => s.category === "frontend").length,
		backend: skillsData.filter((s) => s.category === "backend").length,
		database: skillsData.filter((s) => s.category === "database").length,
		tools: skillsData.filter((s) => s.category === "tools").length,
		other: skillsData.filter((s) => s.category === "other").length,
	},
});

export const getSkillsByCategory = (category?: string) =>
	!category || category === "all"
		? skillsData
		: skillsData.filter((s) => s.category === category);
export const getAdvancedSkills = () =>
	skillsData.filter((s) => s.level === "advanced" || s.level === "expert");
export const getTotalExperience = () => {
	const totalMonths = skillsData.reduce(
		(total, skill) => total + skill.experience.years * 12 + skill.experience.months,
		0,
	);
	return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
};
`,
	"data/timeline.ts": `export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string;
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "website" | "certificate" | "project" | "other";
	}[];
	icon?: string;
	color?: string;
	featured?: boolean;
}

export const timelineData: TimelineItem[] = [
	{
		id: "ci-timeline",
		title: "CI Timeline",
		description: "CI fixture timeline item",
		type: "project",
		startDate: "2026-01-01",
		icon: "material-symbols:check-circle",
		featured: true,
	},
];

export const getTimelineStats = () => ({
	total: timelineData.length,
	byType: {
		education: timelineData.filter((item) => item.type === "education").length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement").length,
	},
});

export const getTimelineByType = (type?: string) =>
	(!type || type === "all"
		? timelineData
		: timelineData.filter((item) => item.type === type)
	).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
export const getFeaturedTimeline = () => timelineData.filter((item) => item.featured);
export const getCurrentItems = () => timelineData.filter((item) => !item.endDate);
export const getTotalWorkExperience = () => ({ years: 0, months: 0 });
`,
	"data/bangumi-data.json": "[]\n",
	"data/bilibili-data.json": "[]\n",
};

for (const [relativePath, content] of Object.entries(files)) {
	const target = path.join(contentDir, relativePath);
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.writeFile(target, content);
}

await fs.mkdir(path.join(contentDir, "images", "albums"), { recursive: true });

console.log(`Prepared CI content fixtures in ${contentDir}`);
