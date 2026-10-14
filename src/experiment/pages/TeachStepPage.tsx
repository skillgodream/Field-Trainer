import React from 'react';
import { Slide } from '../types';
import { Text, Pill, Row, ImageSlot, SopHeader } from '../tokens';

export const TeachStepPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const stepLabel = slide.step || 'Step 1 of 1';

  let items = slide.items;
  if (!items || items.length === 0) {
    items = (slide.content || '')
      .split('\n')
      .map((l) => l.replace(/^[\*\-•]\s*/, '').trim())
      .filter(Boolean);
    if (items.length === 0 && slide.content) {
      items = [slide.content];
    }
  }

  // Content limit of 2-4 items
  const finalItems = items.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={stepLabel} title={slide.title} />

      {/* 3. Visual */}
      <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />

      {/* 4. Content block: Step list rows */}
      <div className="flex flex-col gap-3">
        {finalItems.map((item, index) => (
          <Row key={index} index={index + 1}>
            {item}
          </Row>
        ))}
      </div>
    </div>
  );
};
