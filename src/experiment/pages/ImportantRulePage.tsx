import React from 'react';
import { Slide } from '../types';
import { Text, Panel, ImageSlot, SopHeader } from '../tokens';

export const ImportantRulePage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  let why =
    slide.why ||
    slide.gurujiCoaching?.whyItMatters ||
    'Mandatory procedure requirement. Adhere strictly to verified operational standards.';

  if (slide.title && why.trim().toLowerCase() === slide.title.trim().toLowerCase()) {
    why = 'Non-negotiable operational standard: skipping this verification leads to procedural errors and compliance discrepancies.';
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header using dynamic title */}
      <SopHeader tag={slide.tag || 'Critical Rule'} title={slide.title || 'Operational Control'} />

      {/* Visual media slot if available */}
      {slide.img && <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />}

      {/* Content block: Alert Panel containing the rule and why it matters */}
      <Panel type="dont" className="flex flex-col gap-3 text-left">
        <Text styleName="panel-heading">{slide.title}</Text>
        <Text styleName="body">{why}</Text>
      </Panel>
    </div>
  );
};

