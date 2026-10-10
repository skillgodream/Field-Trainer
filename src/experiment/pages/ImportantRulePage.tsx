import React from 'react';
import { Slide } from '../types';
import { Text, Pill, Panel, ImageSlot, SopHeader } from '../tokens';

export const ImportantRulePage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  let why =
    slide.why ||
    slide.gurujiCoaching?.whyItMatters ||
    'Safety and compliance boundary. Never bypass standard verification checks.';

  if (slide.title && why.trim().toLowerCase() === slide.title.trim().toLowerCase()) {
    why = 'Non-negotiable operational control: skipping this check leads to compliance violations, inventory/process discrepancies, and safety risks.';
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || 'Critical rule'} title="Critical operational control" />

      {/* 3. Visual */}
      <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />

      {/* 4. Content block: Red-tinted Panel containing the rule and why it matters */}
      <Panel type="dont" className="flex flex-col gap-3">
        <Text styleName="panel-heading">{slide.title}</Text>
        <Text styleName="body">{why}</Text>
      </Panel>
    </div>
  );
};
