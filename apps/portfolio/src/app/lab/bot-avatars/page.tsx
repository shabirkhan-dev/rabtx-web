import { BotAvatars } from "@/components/lab/bot-avatars/bot-avatars";
import { ExperimentPage, experimentMetadata } from "@/components/lab/experiment-page";
import { AgentBoard } from "@/components/lab/remix/agent-board";

export const metadata = experimentMetadata("bot-avatars");

export default function BotAvatarsPage() {
  return (
    <ExperimentPage slug="bot-avatars" remix={<AgentBoard />}>
      <BotAvatars />
    </ExperimentPage>
  );
}
