import { rmSync } from "node:fs";

const outputFolders = ["dist"] as const;

outputFolders.forEach((path) => {
	rmSync(path, { recursive: true, force: true });
});
