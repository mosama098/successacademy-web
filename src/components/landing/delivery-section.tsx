import { SectionShell, StrongInfo } from "./section-shell";
import type { LandingSectionProps } from "./types";

export function DeliverySection({ copy }: LandingSectionProps) {
  return (
    <SectionShell title={copy.delivery.title}>
      <div className="grid gap-6 lg:grid-cols-2">
        <StrongInfo title={copy.delivery.onlineLabel} text={copy.delivery.online} />
        <StrongInfo title={copy.delivery.branchLabel} text={copy.delivery.branch} />
      </div>
    </SectionShell>
  );
}
