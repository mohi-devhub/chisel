import JSZip from "jszip";

import type { GeneratedSkill } from "@/types";

export async function packageSkill(generated: GeneratedSkill): Promise<Buffer> {
  const zip = new JSZip();
  const root = zip.folder(generated.name);

  if (!root) {
    throw new Error("Could not create skill zip root folder");
  }

  root.file("SKILL.md", generated.skill_md);

  if (generated.scripts.length > 0) {
    const scripts = root.folder("scripts");
    for (const script of generated.scripts) {
      scripts?.file(script.filename, script.content);
    }
  }

  if (generated.references.length > 0) {
    const references = root.folder("references");
    for (const reference of generated.references) {
      references?.file(reference.filename, reference.content);
    }
  }

  if (generated.assets.length > 0) {
    const assets = root.folder("assets");
    for (const asset of generated.assets) {
      assets?.file(asset.filename, asset.content);
    }
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
