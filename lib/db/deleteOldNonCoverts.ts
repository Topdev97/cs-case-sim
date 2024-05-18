import { planetscaleClient } from "./";

const deleteOldNonCovertItems = async (batchSize: number) => {
  // Max 100k batchSize
  if (batchSize > 100_000)
    return console.error("Batch size cannot exceed 100,000.");

  // Query to delete items older than 2 months that are not covert items
  const query = `DELETE FROM case_sim_items WHERE unboxed_at < DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH) AND rarity NOT IN ('Covert', 'Extraordinary') LIMIT ${batchSize}`;

  let continueDeleting = true;
  let totalRowsDeleted = 0;
  const operationStart = performance.now();

  // Loop until no more rows are deleted
  while (continueDeleting) {
    const currentBatchStart = performance.now();
    console.log(`Deleting ${batchSize.toLocaleString("en")} rows...`);

    // Execute the query and add the number of rows deleted
    const response = await planetscaleClient.execute(query);
    totalRowsDeleted += response.rowsAffected;
    const currentBatchEnd = performance.now();

    console.log(
      `✓ Deleted ${response.rowsAffected.toLocaleString("en")} rows in ${(
        currentBatchEnd - currentBatchStart
      ).toFixed()}ms`,
    );

    // If less than the chosen batchSize amount of rows are deleted, there are no more rows to delete
    if (response.rowsAffected < batchSize) {
      continueDeleting = false;
      const operationEnd = performance.now();
      console.log(
        `✓ Complete. No more rows to delete. Deleted ${totalRowsDeleted.toLocaleString(
          "en",
        )} rows in ${(operationEnd - operationStart).toFixed()}ms`,
      );
    }
  }
};

deleteOldNonCovertItems(100_000);
