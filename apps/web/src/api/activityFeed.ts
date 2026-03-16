import { activityFeed } from "./endpoints";

export async function fetchActivityFeed(params: {
  entityType: string;
  entityId: string;
}) {
  const search = new URLSearchParams();
  search.set("entityType", params.entityType);
  search.set("entityId", params.entityId);

  const response = await fetch(`${activityFeed}?${search.toString()}`);
  if (!response.ok) {
    throw new Error("Falha ao carregar histórico.");
  }

  return response.json();
}
