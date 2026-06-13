const CHANNEL_NAME = "cashflow_sync";

export type SyncEvent =
  | { type: "EXPENSE_CREATED" | "EXPENSE_UPDATED" | "EXPENSE_DELETED" }
  | { type: "INCOME_CREATED" | "INCOME_UPDATED" | "INCOME_DELETED" }
  | { type: "BUDGET_UPDATED" }
  | { type: "CATEGORY_UPDATED" };

export function broadcastDataChange(event: SyncEvent): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch (error) {
    console.warn("Broadcast failed", error);
  }
}

export function subscribeToBroadcast(
  handler: (event: SyncEvent) => void,
): () => void {
  if (typeof BroadcastChannel === "undefined") {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      handler(event.data);
    };

    return () => {
      channel.close();
    };
  } catch (error) {
    console.warn("Failed to subscribe to broadcast", error);
    return () => {};
  }
}
