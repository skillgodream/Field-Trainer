import React, { useState } from 'react';
import { X, Upload, FileText, Sparkles, Check, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';
import { extractDocumentContent, ExtractedDocument } from '../utils/documentExtractor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (extracted: ExtractedDocument) => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playTap();
      setSelectedFileName(file.name);
      setIsProcessing(true);
      sounds.playCorrect();

      const extracted = await extractDocumentContent(file);

      setTimeout(() => {
        setIsProcessing(false);
        onUploadSuccess(extracted);
        onClose();
        setSelectedFileName(null);
      }, 400);
    }
  };

  const handlePastedTextSubmit = async () => {
    if (!pastedText.trim()) return;
    sounds.playTap();
    setIsProcessing(true);
    sounds.playCorrect();

    const text = pastedText.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.max(1, Math.ceil(wordCount / 220));

    const extracted: ExtractedDocument = {
      filename: 'Custom_Pasted_SOP.txt',
      rawText: text,
      wordCount,
      pageCount,
      fileHash: `hash_${Date.now()}`,
      confirmationText: `We read 1 page · ${wordCount} words`,
      diagnostics: {
        totalChars: text.length,
        readableChars: text.length,
        controlChars: 0,
        replacementChars: 0,
        wordCount,
        pageCount,
      },
      mimeType: 'text/plain',
      extractedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsProcessing(false);
      onUploadSuccess(extracted);
      onClose();
      setPastedText('');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1116]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#F7F7F5] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200">
        {/* Top Header */}
        <div className="p-6 bg-white border-b border-[#E6E8EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCEBFF] text-[#2F6FED] flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0E1116]">Upload Universal SOP</h2>
              <p className="text-xs font-semibold text-[#66726B]">Supports any domain or industry SOP</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-[#F7F7F5] border border-[#E6E8EC] flex items-center justify-center text-[#0E1116] hover:bg-[#E6E8EC] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector: Upload File vs Paste SOP Text */}
        <div className="flex border-b border-[#E6E8EC] bg-white px-6 pt-2">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('file');
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'file'
                ? 'border-[#0E1116] text-[#0E1116]'
                : 'border-transparent text-[#66726B] hover:text-[#0E1116]'
            }`}
          >
            📄 Upload File (PDF / Word / Image)
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveTab('paste');
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#0E1116] text-[#0E1116]'
                : 'border-transparent text-[#66726B] hover:text-[#0E1116]'
            }`}
          >
            ✏️ Paste SOP Text
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'file' ? (
            <div className="space-y-3">
              {/* File Dropzone */}
              <label className="border-2 border-dashed border-[#E6E8EC] hover:border-[#0E1116] bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.99] block shadow-xs">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <div className="w-14 h-14 rounded-full bg-[#DCEBFF] text-[#2F6FED] flex items-center justify-center mb-3">
                  <Upload size={28} />
                </div>
                <p className="text-base font-bold text-[#0E1116]">
                  {isProcessing
                    ? `Reading ${selectedFileName || 'document'}...`
                    : 'Choose or drop any SOP file'}
                </p>
                <p className="text-xs text-[#66726B] font-semibold mt-1 max-w-[260px]">
                  PDF, DOCX, Word, Plain Text, or Scanned Image document from any field.
                </p>
              </label>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Sparkles size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  <strong>Single Source of Truth:</strong> Guruji extracts the exact operational steps directly from your uploaded document without any domain assumptions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#0E1116]">
                Paste your SOP document text:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste any procedure, workflow, or operating guidelines here..."
                rows={7}
                className="w-full p-4 rounded-2xl bg-white border border-[#E6E8EC] text-xs font-medium text-[#0E1116] focus:outline-none focus:border-[#0E1116] shadow-xs resize-none"
              />
              <button
                onClick={handlePastedTextSubmit}
                disabled={!pastedText.trim() || isProcessing}
                className="w-full h-12 rounded-full bg-[#0E1116] hover:bg-black disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <span>Generating Operational Blueprint...</span>
                ) : (
                  <>
                    <span>Process SOP Text</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
