import { Lesson } from '../types';
import { TeachMePlan } from './types';
import { planKnowItSlides } from './knowItPlanner';

export function planSlides(lesson: Lesson): TeachMePlan {
  return planKnowItSlides(lesson);
}

export function getDomainHeroImage(title: string, role: string): {
  hero: string;
  checklist: Array<{ title: string; subtitle: string; img: string; status: 'check' | 'prohibited' }>;
} {
  const combined = `${title} ${role}`.toLowerCase();

  if (combined.includes('housekeeping') || combined.includes('sanitization') || combined.includes('cleaning')) {
    return {
      hero: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      checklist: [
        {
          title: 'Dilute Sanitizer (1:10 ratio)',
          subtitle: 'Measure chemical accurately into blue applicator bottle.',
          img: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=300&q=80',
          status: 'check',
        },
        {
          title: 'Microfibre Cloths Ready',
          subtitle: 'Color-coded microfibre cloths for surface sanitization.',
          img: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=300&q=80',
          status: 'check',
        },
        {
          title: 'Never Spray Directly Over Dirt',
          subtitle: 'Wipe visible debris before applying disinfectant spray.',
          img: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=300&q=80',
          status: 'prohibited',
        },
      ],
    };
  }

  if (combined.includes('patient') || combined.includes('blood') || combined.includes('lab') || combined.includes('phlebotomy') || combined.includes('medical') || combined.includes('healthcare')) {
    return {
      hero: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      checklist: [
        {
          title: 'Name & DOB Matching',
          subtitle: 'Verify patient wristband against test order form.',
          img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80',
          status: 'check',
        },
        {
          title: 'Specimen Tube Barcode',
          subtitle: 'Scan and verify barcode label before sample collection.',
          img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80',
          status: 'check',
        },
        {
          title: 'Never Draw Unverified Patient',
          subtitle: 'Do not proceed if wristband name or DOB does not match.',
          img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80',
          status: 'prohibited',
        },
      ],
    };
  }

  return {
    hero: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    checklist: [
      {
        title: 'Scan Tote Barcode',
        subtitle: 'Match pick tote location code with handheld terminal.',
        img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=300&q=80',
        status: 'check',
      },
      {
        title: 'Verify Item Expiry Date',
        subtitle: 'Check product shelf-life and batch number.',
        img: 'https://images.unsplash.com/photo-1586528116493-a02532554cfa?auto=format&fit=crop&w=300&q=80',
        status: 'check',
      },
      {
        title: 'Never Pick Damaged Stock',
        subtitle: 'Quarantine torn or leaking packaging immediately.',
        img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=300&q=80',
        status: 'prohibited',
      },
    ],
  };
}
