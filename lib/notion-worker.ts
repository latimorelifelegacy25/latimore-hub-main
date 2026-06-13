export type NotionWorkerSection = {
  heading: string;
  body: string;
};

export async function createNotionWorkerPage(input: {
  title: string;
  sections: NotionWorkerSection[];
}) {
  const response = await fetch("/api/notion-worker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create_page",
      title: input.title,
      sections: input.sections,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.data?.message || "Notion Worker failed");
  }

  return data;
}
