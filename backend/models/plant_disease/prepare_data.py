import os
import shutil
from pathlib import Path

# ─────────────────────────────────────────────
# CONFIGURE THESE TWO PATHS
# ─────────────────────────────────────────────
SOURCE_DIR = os.path.expanduser("~/Desktop/PlantDiseas")
OUTPUT_DIR = os.path.expanduser("~/Desktop/plant_disease_data")
# ─────────────────────────────────────────────

SPLITS = ["Train", "Val", "Test"]
OUTPUT_SPLITS = {"Train": "train", "Val": "val", "Test": "test"}


def sanitize(name):
    """Convert folder name to a clean class label: 'Early Blight' → 'Early_Blight'"""
    return name.strip().replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")


def prepare():
    source = Path(SOURCE_DIR)
    output = Path(OUTPUT_DIR)

    if not source.exists():
        print(f"❌ Source not found: {source}")
        return

    print(f"📂 Source : {source}")
    print(f"📂 Output : {output}")
    print()

    total_copied = 0
    class_names = set()

    for plant_dir in sorted(source.iterdir()):
        if not plant_dir.is_dir():
            continue

        plant_name = sanitize(plant_dir.name)

        for split in SPLITS:
            split_dir = plant_dir / split
            if not split_dir.exists():
                # try lowercase
                split_dir = plant_dir / split.lower()
            if not split_dir.exists():
                continue

            out_split = OUTPUT_SPLITS[split]

            for disease_dir in sorted(split_dir.iterdir()):
                if not disease_dir.is_dir():
                    continue

                disease_name = sanitize(disease_dir.name)
                class_label = f"{plant_name}_{disease_name}"
                class_names.add(class_label)

                dest_dir = output / out_split / class_label
                dest_dir.mkdir(parents=True, exist_ok=True)

                images = list(disease_dir.glob("*.jpg")) + \
                         list(disease_dir.glob("*.jpeg")) + \
                         list(disease_dir.glob("*.png")) + \
                         list(disease_dir.glob("*.JPG"))

                for img in images:
                    shutil.copy2(img, dest_dir / img.name)
                    total_copied += 1

                print(f"  ✅ {out_split:5s} | {class_label:50s} | {len(images):4d} images")

    print()
    print(f"✅ Done — {total_copied} images copied across {len(class_names)} classes")
    print()
    print("📋 Full class list:")
    for i, name in enumerate(sorted(class_names)):
        print(f"  {i:2d}: {name}")

    print()
    print(f"📁 Output ready at: {output}")
    print("👉 Next step: run train.py")


if __name__ == "__main__":
    prepare()