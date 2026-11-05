import { BurnDelete } from "@/components/lab/burn-delete/burn-delete";
import { ExperimentPage, experimentMetadata } from "@/components/lab/experiment-page";

export const metadata = experimentMetadata("burn-delete");

export default function BurnDeletePage() {
  return (
    <ExperimentPage
      slug="burn-delete"
      remix={
        <BurnDelete
          name="Grid · rabtx-web"
          title="Delete this workspace?"
          lead="Its 214 tasks, 6 agents and 1,380 runs go with it."
          flame="ember"
          autoplay={false}
        />
      }
    >
      <BurnDelete />
    </ExperimentPage>
  );
}
