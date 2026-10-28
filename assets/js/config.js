// 部署时只需要改这一处：仓库与站点地址会被页面里所有外链复用。
export const REPO = "https://github.com/Youngera-hub/demotest";

export function bindRepoLinks(root = document) {
  root.querySelectorAll("a[data-repo]").forEach((a) => { a.href = REPO; });
}
