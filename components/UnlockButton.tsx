"use client";

// @ts-expect-error
import useSound from "use-sound";
import { useEffect, useRef, useState } from "react";
import UnboxedDialog from "./UnboxedDialog";
import StatsAndHistoryDialog from "./StatsAndHistoryDialog";
import Button from "./Button";
import { CaseDataType, GradeType, ItemType } from "@/types";

type GradeOddsType = {
  [grade in GradeType]: number;
};

const gradeOddsCase = {
  "Mil-Spec Grade": 0.7992,
  Restricted: 0.1598,
  Classified: 0.032,
  Covert: 0.0064,
  "Rare Special Item": 0.0026,
} as GradeOddsType;

const gradeOddsSouvenir = {
  "Consumer Grade": 0.7992,
  "Industrial Grade": 0.1598,
  "Mil-Spec Grade": 0.032,
  Restricted: 0.0064,
  Covert: 0.0014,
} as GradeOddsType;

export default ({ caseData }: { caseData: CaseDataType }) => {
  const [unboxedItems, setUnboxedItems] = useState<ItemType[]>([]);
  const [unboxedItem, setUnboxedItem] = useState<ItemType | null>(null);
  const [unlockButtonDisabled, setUnlockButtonDisabled] = useState(false);
  const unboxedDialogRef = useRef<HTMLDialogElement>(null);
  const historyDialogRef = useRef<HTMLDialogElement>(null);

  const volume = 0.5;
  const [playMilspec, { stop: stop1 }] = useSound("/audio/milspecopen.mp3", {
    volume,
  });
  const [playResricted, { stop: stop2 }] = useSound(
    "/audio/restrictedopen.mp3",
    { volume },
  );
  const [playClassified, { stop: stop3 }] = useSound(
    "/audio/classifiedopen.mp3",
    { volume },
  );

  const openCase = (dontOpenDialog?: boolean) => {
    const openedItem = getItem();
    setUnboxedItem(openedItem);
    setUnboxedItems([openedItem, ...unboxedItems]);
    localStorage.setItem(
      "unboxedItems",
      JSON.stringify([openedItem, ...unboxedItems]),
    );

    // Stop all sounds and play sound based on item grade. Covert and gold missing
    stop1();
    stop2();
    stop3();
    if (
      ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade"].includes(
        openedItem.rarity,
      )
    )
      playMilspec();
    if (openedItem.rarity === "Restricted") playResricted();
    if (openedItem.rarity === "Classified") playClassified();

    // Disable the unlock button for 1 second if the item is a Covert or RSI
    if (openedItem.name.includes("★") || openedItem.rarity === "Covert") {
      setUnlockButtonDisabled(true);
      setTimeout(() => {
        setUnlockButtonDisabled(false);
      }, 1000);
    }

    if (dontOpenDialog) return;
    unboxedDialogRef.current?.showModal();
  };

  // Load unboxed items from localStorage
  useEffect(() => {
    try {
      setUnboxedItems(JSON.parse(localStorage.getItem("unboxedItems") || "[]"));
    } catch (error) {
      setUnboxedItems([]);
    }
  }, []);

  // This is pretty hacky
  const gradeOdds =
    caseData.type === "Case" ? gradeOddsCase : gradeOddsSouvenir;

  // Simulate opening an item
  function getItem() {
    const random = Math.random();
    let cumulativeProbability = 0;

    const unboxedItemIsStatTrak =
      !caseData.name.includes("Glove") &&
      caseData.type !== "Souvenir" &&
      Math.random() <= 0.1;

    for (const grade in gradeOdds) {
      cumulativeProbability += gradeOdds[grade as GradeType];
      if (random <= cumulativeProbability) {
        if (grade === "Rare Special Item") {
          // For "Rare Special Item," select from the "contains_rare" array
          const rareItems = caseData.contains_rare;
          if (rareItems.length > 0) {
            const unboxedItem = {
              ...rareItems[Math.floor(Math.random() * rareItems.length)],
            };

            // 10% chance of StatTrak. Prefix "★ StatTrak™" to the item name and remove the other ★ from the name
            if (unboxedItemIsStatTrak) {
              unboxedItem.name =
                "★ StatTrak™ " + unboxedItem.name.replace("★", "");
            }

            return unboxedItem;
          }
        } else {
          // For other grades, select from the "contains" array
          const gradeItems = caseData.contains.filter(
            item => item.rarity === grade,
          );

          if (gradeItems.length > 0) {
            const unboxedItem = {
              ...gradeItems[Math.floor(Math.random() * gradeItems.length)],
            };

            // 10% chance of StatTrak. Prefix "StatTrak™" to the item name
            if (unboxedItemIsStatTrak) {
              unboxedItem.name = "StatTrak™ " + unboxedItem.name;
            }

            return unboxedItem;
          }
        }
      }
    }

    // If no valid grade is found, return a default item from "contains"
    return caseData.contains[0];
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => historyDialogRef.current?.showModal()}
      >
        History
      </Button>

      <Button
        variant="primary"
        disabled={unlockButtonDisabled}
        onClick={() => openCase()}
      >
        UNLOCK CONTAINER
      </Button>

      {/* UNBOXED DIALOG */}
      <UnboxedDialog
        historyDialogRef={historyDialogRef}
        unboxedDialogRef={unboxedDialogRef}
        item={unboxedItem}
        unlockButtonDisabled={unlockButtonDisabled}
        openCaseFunc={openCase}
      />

      {/* STATS AND HISTORY DIALOG */}
      <StatsAndHistoryDialog
        historyDialogRef={historyDialogRef}
        unboxedItems={unboxedItems}
        setUnboxedItems={setUnboxedItems}
      />
    </>
  );
};
