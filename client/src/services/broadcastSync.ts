const CHANNEL_NAME = "cashflow_sync";

export type SyncEvent =
  | { type: "EXPENSE_CREATED" | "EXPENSE_UPDATED" | "EXPENSE_DELETED" }
  | { type: "INCOME_CREATED" | "INCOME_UPDATED" | "INCOME_DELETED" }
  | { type: "BUDGET_UPDATED" }
  | { type: "CATEGORY_UPDATED" };

let globalChannel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!globalChannel) {
    try {
      globalChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch (error) {
      console.warn("Failed to create BroadcastChannel", error);
    }
  }
  return globalChannel;
};

export function broadcastDataChange(event: SyncEvent): void {
  const channel = getChannel();
  if (!channel) return;

  try {
    channel.postMessage(event);
  } catch (error) {
    console.warn("Broadcast failed", error);
  }
}

export function subscribeToBroadcast(
  handler: (event: SyncEvent) => void,
): () => void {
  const channel = getChannel();
  if (!channel) return () => {};

  const listener = (event: MessageEvent) => {
    handler(event.data);
  };

  try {
    channel.addEventListener("message", listener);
    return () => {
      channel.removeEventListener("message", listener);
    };
  } catch (error) {
    console.warn("Failed to subscribe to broadcast", error);
    return () => {};
  }
}
