/**
 * Zero-cost procedural video generator for testing frontline SOP demonstrations.
 * Synthesizes a real 720p 30fps video blob using HTML5 Canvas & MediaRecorder.
 * Consumes 0 API credits and renders in ~1-2 seconds.
 */

export interface SimulationVideoOptions {
  lessonTitle: string;
  stepTitle: string;
  stepIndex: number;
  totalSteps: number;
  role?: string;
  accentColor?: string;
  durationMs?: number;
}

export async function generateSimulatedVideoBlob(options: SimulationVideoOptions): Promise<Blob> {
  const {
    lessonTitle,
    stepTitle,
    stepIndex,
    totalSteps,
    role = 'Frontline Operator',
    accentColor = '#38BDF8',
    durationMs = 4000,
  } = options;

  return new Promise((resolve) => {
    // If MediaRecorder or captureStream is not supported, return a minimal fallback
    if (typeof window === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
      resolve(new Blob([], { type: 'video/webm' }));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      // Fallback dummy blob
      resolve(new Blob([], { type: 'video/webm' }));
      return;
    }

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(30);
    } catch {
      resolve(new Blob([], { type: 'video/webm' }));
      return;
    }

    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
    } catch {
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch {
        resolve(new Blob([], { type: 'video/webm' }));
        return;
      }
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
      resolve(finalBlob);
    };

    mediaRecorder.start(100);

    const startTime = performance.now();
    let animId: number;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // 1. Background gradient (Dark Obsidian Workplace)
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#090B10');
      grad.addColorStop(0.5, '#11141F');
      grad.addColorStop(1, '#06070A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // 2. Subtle Grid / Industrial Grid Floor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      // 3. Ambient glow spot matching accentColor
      const radGrad = ctx.createRadialGradient(640, 360, 40, 640, 360, 400);
      radGrad.addColorStop(0, `${accentColor}18`);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // 4. Central Frontline Station Workstation Graphic
      const pulse = Math.sin(elapsed * 0.005) * 10;
      ctx.save();
      ctx.translate(640, 360);

      // Circular workstation target
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 160 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 140, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();

      // Frontline Worker / Action Icon
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -35, 22, 0, Math.PI * 2); // head
      ctx.fill();

      // Body / Shoulders
      ctx.beginPath();
      ctx.roundRect(-35, -5, 70, 55, 12);
      ctx.fill();

      // High-vis vest accent
      ctx.fillStyle = accentColor;
      ctx.fillRect(-20, -5, 10, 55);
      ctx.fillRect(10, -5, 10, 55);

      // Animated Arm / Hand executing task
      const armAngle = Math.sin(elapsed * 0.008) * 0.35;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(35, 10);
      ctx.lineTo(35 + Math.cos(armAngle) * 45, 10 + Math.sin(armAngle) * 45);
      ctx.stroke();

      ctx.restore();

      // 5. Upper HUD: Standard Operating Procedure Telemetry
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(40, 40, 1200, 75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, 1200, 75);

      // SOP Title & Role
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(lessonTitle, 65, 75);

      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`ROLE: ${role.toUpperCase()}   •   STEP ${stepIndex} OF ${totalSteps}`, 65, 100);

      // Free Test Mode Badge
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(1050, 55, 170, 45);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.strokeRect(1050, 55, 170, 45);
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('0 CREDITS (TEST MODE)', 1065, 82);

      // 6. Lower Third: Action Instruction Banner
      ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
      ctx.fillRect(40, 570, 1200, 110);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(40, 570, 1200, 110);

      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText(`CURRENT ACTION DIRECTIVE:`, 65, 602);

      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const cleanStep = stepTitle.length > 55 ? `${stepTitle.slice(0, 55)}...` : stepTitle;
      ctx.fillText(cleanStep, 65, 638);

      // Live progress bar along lower third bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(40, 676, 1200, 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(40, 676, 1200 * progress, 4);

      // Time counter top right
      const currentSec = (elapsed / 1000).toFixed(1);
      const totalSec = (durationMs / 1000).toFixed(1);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${currentSec}s / ${totalSec}s`, 1120, 635);

      if (elapsed < durationMs) {
        animId = requestAnimationFrame(renderFrame);
      } else {
        cancelAnimationFrame(animId);
        try {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        } catch (_) {
          resolve(new Blob([], { type: 'video/webm' }));
        }
      }
    };

    animId = requestAnimationFrame(renderFrame);
  });
}
