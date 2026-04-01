import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./load-env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

loadEnv();
console.log("Loaded .env configuration file\n");

// 从环境变量读取配置
const ENABLE_CONTENT_SYNC = process.env.ENABLE_CONTENT_SYNC !== "false"; // 默认启用
const CONTENT_REPO_URL =
  process.env.CONTENT_REPO_URL ||
  "https://github.com/Hill-1024/BlogContent.git";
const CONTENT_DIR = process.env.CONTENT_DIR || path.join(rootDir, "content");

console.log("Starting content synchronization...\n");

// 检查是否启用内容分离
if (!ENABLE_CONTENT_SYNC) {
  console.log("Content separation is disabled (ENABLE_CONTENT_SYNC=false)");
  console.log(
    "Tip: Local content will be used, will not sync from remote repository",
  );
  console.log("     To enable content separation feature, set in .env:");
  console.log("     ENABLE_CONTENT_SYNC=true");
  console.log("     CONTENT_REPO_URL=<your-repo-url>\n");
  process.exit(0);
}

// 检查并清理旧的内容目录
if (fs.existsSync(CONTENT_DIR)) {
  try {
    fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
  } catch (err) {
    console.error(
      `Failed to delete existing content directory: ${err.message}`,
    );
  }
}

// 克隆远程仓库
try {
  console.log(`Start Clone from ${CONTENT_REPO_URL}...`);
  // stdio: "inherit" 可以让终端实时显示 git clone 的进度条
  execSync(`git clone ${CONTENT_REPO_URL} "${CONTENT_DIR}"`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error(`\nClone failed: ${err.message}`);
  process.exit(1);
}

// 创建符号链接或复制内容
console.log("\nSetting up content links...");

const contentMappings = [
  { src: "posts", dest: "src/content/posts" },
  { src: "spec", dest: "src/content/spec" },
  { src: "data", dest: "src/data" },
  { src: "images", dest: "public/images" },
];

for (const mapping of contentMappings) {
  const srcPath = path.join(CONTENT_DIR, mapping.src);
  const destPath = path.join(rootDir, mapping.dest);

  // 检查仓库中是否存在对应的源文件夹
  if (!fs.existsSync(srcPath)) {
    console.log(`\n[Warning] Skipping non-existent source: ${mapping.src}`);
    // 智能提示：打印出仓库里实际存在的内容，帮你排查拼写或未提交空文件夹的问题
    try {
      const availableFiles = fs
        .readdirSync(CONTENT_DIR)
        .filter((f) => !f.startsWith(".")); // 过滤掉 .git 等隐藏文件
      console.log(
        `  -> Available folders in repo: [ ${availableFiles.join(", ")} ]`,
      );
    } catch (e) {}
    continue;
  }

  // 确保目标路径的父级目录存在 (比如 src/content 必须先存在)
  const destParentDir = path.dirname(destPath);
  if (!fs.existsSync(destParentDir)) {
    fs.mkdirSync(destParentDir, { recursive: true });
  }

  // 如果目标已存在且不是符号链接,备份它
  try {
    if (fs.existsSync(destPath) && !fs.lstatSync(destPath).isSymbolicLink()) {
      const backupPath = `${destPath}.backup`;
      console.log(
        `Backing up existing content: ${mapping.dest} -> ${mapping.dest}.backup`,
      );
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      fs.renameSync(destPath, backupPath);
    }
  } catch (e) {
    // 忽略读取状态错误
  }

  // 强制删除现有的旧软链接或残余文件
  try {
    fs.rmSync(destPath, { recursive: true, force: true });
  } catch (e) {}

  // 创建符号链接 (Windows 需要管理员权限,否则复制文件)
  try {
    // 使用绝对路径创建 junction，更稳定
    fs.symlinkSync(srcPath, destPath, "junction");
    console.log(`Created symbolic link: ${mapping.dest} -> ${mapping.src}`);
  } catch (error) {
    console.log(
      `Symlink failed, falling back to copy: ${mapping.src} -> ${mapping.dest}`,
    );
    copyRecursive(srcPath, destPath);
  }
}

console.log("\nContent synchronization completed\n");

// 递归复制函数 (如果软链接失败的备用方案)
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
