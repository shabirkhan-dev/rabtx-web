import { EffortSlider } from "@/components/lab/effort-slider/effort-slider";
import { ExperimentPage, experimentMetadata } from "@/components/lab/experiment-page";

export const metadata = experimentMetadata("effort-slider");

/** The four themed sliders under the main one, each with its own words. */
const themes = [
  {
    name: "Black hole",
    note: "A spiral that grows and spins faster, then collapses: a black hole on a light page, a white hole on a dark one.",
    props: {
      theme: "galaxy",
      label: "Gravity",
      minLabel: "Drift",
      maxLabel: "Collapse",
      recommended: 2,
      help: "How much mass the galaxy gathers. At the top it collapses.",
    },
  },
  {
    name: "Race car",
    note: "Kerbs stream past on the tarmac; the last step opens the rear flap for the overtake.",
    props: {
      theme: "formula",
      label: "Pace",
      minLabel: "Steady",
      maxLabel: "Flat out",
      recommended: 2,
      help: "How hard the car is pushed, from the pit lane to an overtake.",
    },
  },
  {
    name: "Rocket launch",
    note: "The flame grows from a wisp to a full burn, then lifts off in a plume of smoke.",
    props: {
      theme: "missile",
      label: "Thrust",
      minLabel: "Idle",
      maxLabel: "Full burn",
      recommended: 3,
      recommendedLabel: "Nominal",
      help: "How much thrust the engine gives, from armed on the pad to hypersonic.",
    },
  },
  {
    name: "Sound barrier",
    note: "The wings sweep back and the afterburner lights; at Mach 1 a vapour cone blooms over the jet.",
    props: {
      theme: "jet",
      label: "Speed",
      minLabel: "Subsonic",
      maxLabel: "Supersonic",
      recommended: 3,
      help: "How fast the jet flies. The top step breaks the sound barrier.",
    },
  },
] as const;

export default function EffortSliderPage() {
  return (
    <ExperimentPage slug="effort-slider">
      <div className="flex flex-col gap-3">
        <EffortSlider />
        <ul className="grid gap-3 md:grid-cols-2">
          {themes.map(({ name, note, props }) => (
            <li key={name} className="flex flex-col gap-3">
              <EffortSlider {...props} />
              <div className="flex flex-col gap-0.5 px-1 text-sm leading-5 tracking-[-0.0064em]">
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-muted">{note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ExperimentPage>
  );
}
