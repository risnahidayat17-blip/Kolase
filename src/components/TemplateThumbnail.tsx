import React from 'react';
import { SlotRect } from '../types/studio';

interface TemplateThumbnailProps {
  slots: SlotRect[];
  slideCount?: number;
  active?: boolean;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({
  slots,
  slideCount = 1,
  active = false,
}) => {
  const isCarousel = slideCount > 1;
  const aspectClass = isCarousel ? 'w-full h-11' : 'w-11 h-14';

  return (
    <div
      className={`relative overflow-hidden rounded border transition-colors shrink-0 ${aspectClass} ${
        active
          ? 'bg-zinc-900 border-[#F2B705]'
          : 'bg-zinc-950 border-zinc-800 group-hover:border-zinc-700'
      }`}
    >
      <div className="absolute inset-1">
        {slots.map((slot) => {
          const inset = slot.insetBorder;
          return (
            <div
              key={slot.id}
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.w * 100}%`,
                height: `${slot.h * 100}%`,
                zIndex: slot.zIndex ?? 1,
              }}
              className="absolute p-[1px]"
            >
              <div
                className={`w-full h-full rounded-[1px] transition-colors ${
                  inset
                    ? active
                      ? 'bg-[#F2B705] ring-1 ring-zinc-950'
                      : 'bg-zinc-500 ring-1 ring-zinc-950'
                    : active
                    ? 'bg-[#F2B705]/30 border border-[#F2B705]/60'
                    : 'bg-zinc-800 border border-zinc-700/70 group-hover:bg-zinc-700/80'
                }`}
              />
            </div>
          );
        })}

        {/* Slide cut guide lines for carousels */}
        {isCarousel &&
          Array.from({ length: slideCount - 1 }).map((_, idx) => (
            <div
              key={idx}
              style={{ left: `${((idx + 1) / slideCount) * 100}%` }}
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-[#F2B705]/70 z-20 pointer-events-none"
            />
          ))}
      </div>
    </div>
  );
};
