import { FileLibrary } from "@/components/lab/file-library/file-library";
import { ExperimentPage, experimentMetadata } from "@/components/lab/experiment-page";
import { GridArtifacts } from "@/components/lab/remix/grid-artifacts";

export const metadata = experimentMetadata("file-library");

export default function FileLibraryPage() {
  return (
    <ExperimentPage slug="file-library" remix={<GridArtifacts />}>
      <FileLibrary />
    </ExperimentPage>
  );
}
