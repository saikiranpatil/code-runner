import { execSync } from "child_process";
import { LANGUAGES } from "./src/config";

const images = [
  ...new Set(
    Object.values(LANGUAGES).map(lang => lang.image)
  ),
];

for (const image of images) {
  console.log(`Pulling ${image}...`);

  try {
    execSync(`docker pull ${image}`, {
      stdio: "inherit",
    });
  } catch (err) {
    console.error(`Failed to pull ${image}`);
  }
}

console.log("Done.");