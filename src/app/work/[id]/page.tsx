import { WorkDetailPage } from "@/components/work/work-detail-page";

type WorkPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkPage({ params }: WorkPageProps) {
  const { id } = await params;
  return <WorkDetailPage id={id} />;
}
