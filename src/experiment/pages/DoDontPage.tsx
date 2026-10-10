import React from 'react';
import { Slide } from '../types';
import { Text, Pill, Panel, Row, SopHeader } from '../tokens';

export const DoDontPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const dos = slide.dos || slide.comparison?.do || [];
  const donts = slide.donts || slide.comparison?.dont || [];

  // Content limit of 2-4 items each
  const finalDos = dos.slice(0, 4);
  const finalDonts = donts.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || 'Do and don\'t'} title={slide.title || 'Do and don\'t guidelines'} />

      {/* 3. Content block: Side-by-side or stacked Do and Don't Panels */}
      <div className="flex flex-col gap-4">
        {finalDos.length > 0 && (
          <Panel type="do" className="flex flex-col gap-3">
            <Text styleName="panel-heading">Do</Text>
            <div className="flex flex-col gap-2">
              {finalDos.map((item, index) => (
                <Row key={index} isTick={true}>
                  {item}
                </Row>
              ))}
            </div>
          </Panel>
        )}

        {finalDonts.length > 0 && (
          <Panel type="dont" className="flex flex-col gap-3">
            <Text styleName="panel-heading">Don't</Text>
            <div className="flex flex-col gap-2">
              {finalDonts.map((item, index) => (
                <Row key={index} isCross={true}>
                  {item}
                </Row>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};
