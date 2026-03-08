import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Upload, FileText, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useItems } from '../../hooks/useItems';
import { cn } from '../../lib/utils';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { supabase } from '../../lib/supabaseClient';

import { parseImportText } from '../../services/geminiService';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useAppStore();
  const { items, importItems } = useItems();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const handleExportJson = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mOS_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportText = () => {
    let textContent = `mOS Data Export - ${new Date().toLocaleDateString()}\n\n`;
    
    items.forEach(item => {
      textContent += `--- ${item.title || 'Untitled'} ---\n`;
      textContent += `Category: ${item.category}\n`;
      textContent += `Tags: ${item.tags.join(', ')}\n`;
      if (item.content) textContent += `Content:\n${item.content}\n`;
      if (item.metadata) {
        let metaStr = JSON.stringify(item.metadata);
        if (item.category === 'numbers') {
           metaStr = `Bank Account: ${item.metadata.bankAccount || 'N/A'}, Phone Number: ${item.metadata.phoneNumber || 'N/A'}`;
        }
        textContent += `Metadata: ${metaStr}\n`;
      }
      textContent += `\n`;
    });

    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(textContent);
    const exportFileDefaultName = `mOS_export_${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(20);
    doc.text(`mOS Data Export - ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;
    
    doc.setFontSize(12);
    items.forEach(item => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(item.title || 'Untitled', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Category: ${item.category}`, 20, y);
      y += 6;
      doc.text(`Tags: ${item.tags.join(', ')}`, 20, y);
      y += 6;
      
      if (item.content) {
        const splitContent = doc.splitTextToSize(`Content: ${item.content}`, 170);
        doc.text(splitContent, 20, y);
        y += splitContent.length * 5 + 2;
      }
      
      if (item.metadata) {
        let metaStr = JSON.stringify(item.metadata);
        if (item.category === 'numbers') {
           metaStr = `Bank Account: ${item.metadata.bankAccount || 'N/A'}, Phone Number: ${item.metadata.phoneNumber || 'N/A'}`;
        }
        const splitMeta = doc.splitTextToSize(`Metadata: ${metaStr}`, 170);
        doc.text(splitMeta, 20, y);
        y += splitMeta.length * 5 + 2;
      }
      
      y += 5;
    });
    
    doc.save(`mOS_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportWord = async () => {
    const children: any[] = [
      new Paragraph({
        text: `mOS Data Export - ${new Date().toLocaleDateString()}`,
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    items.forEach(item => {
      children.push(
        new Paragraph({
          text: item.title || 'Untitled',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Category: ", bold: true }),
            new TextRun(item.category),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Tags: ", bold: true }),
            new TextRun(item.tags.join(', ')),
          ],
        })
      );

      if (item.content) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Content: ", bold: true }),
              new TextRun(item.content),
            ],
          })
        );
      }

      if (item.metadata) {
        let metaStr = JSON.stringify(item.metadata);
        if (item.category === 'numbers') {
           metaStr = `Bank Account: ${item.metadata.bankAccount || 'N/A'}, Phone Number: ${item.metadata.phoneNumber || 'N/A'}`;
        }
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Metadata: ", bold: true }),
              new TextRun(metaStr),
            ],
          })
        );
      }
      
      children.push(new Paragraph({ text: "" }));
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', `mOS_export_${new Date().toISOString().split('T')[0]}.docx`);
    linkElement.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Reading file...');

    try {
      let importedItems = [];

      if (file.name.endsWith('.pdf')) {
        setImportMessage('Analyzing PDF with AI...');
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        importedItems = await parseImportText({
          inlineData: { data: base64, mimeType: 'application/pdf' }
        });
      } else if (file.name.endsWith('.docx')) {
        setImportMessage('Extracting text from Word document...');
        const arrayBuffer = await file.arrayBuffer();
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const result = await mammoth.extractRawText({ arrayBuffer });
        setImportMessage('Analyzing extracted text with AI...');
        importedItems = await parseImportText(result.value);
      } else {
        const text = await file.text();
        try {
          // Try parsing as JSON first
          importedItems = JSON.parse(text);
          if (!Array.isArray(importedItems)) {
            throw new Error("JSON must be an array of items");
          }
        } catch (jsonError) {
          // If not JSON, use Gemini to parse text
          setImportMessage('Analyzing unstructured text with AI...');
          importedItems = await parseImportText(text);
        }
      }

      if (!importedItems || importedItems.length === 0) {
        throw new Error("Could not extract any items from the file.");
      }

      setImportMessage(`Importing ${importedItems.length} items...`);
      await importItems(importedItems);
      
      setImportStatus('success');
      setImportMessage(`Successfully imported ${importedItems.length} items.`);
      
      setTimeout(() => {
        setImportStatus('idle');
        setSettingsOpen(false);
      }, 2000);
      
    } catch (error: any) {
      console.error("Import failed:", error);
      setImportStatus('error');
      setImportMessage(error.message || "Failed to import data.");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[90] md:w-full md:max-w-xl max-h-[90vh] flex flex-col bg-bg/95 backdrop-blur-3xl border border-white/[0.1] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-none md:rounded-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 md:p-10 border-b border-white/[0.05] relative shrink-0">
              <div className="absolute top-0 left-0 right-0 h-1 opacity-80 bg-white/20" />
              <div>
                <h2 className="font-display font-light text-4xl tracking-tight text-white/95">
                  Settings
                </h2>
                <p className="text-[10px] uppercase tracking-widest-luxury text-white/30 font-bold mt-2">
                  System Configuration
                </p>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
              
              {/* Data Management Section */}
              <section className="space-y-6">
                <div>
                  <h3 className="text-lg font-light text-white/90 mb-1">Data Management</h3>
                  <p className="text-sm text-white/40 font-light">Export your data for backup or import from a previous backup.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setSettingsOpen(false);
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-red-400 font-medium">Sign Out</div>
                      <div className="text-xs text-red-400/60 mt-1">Securely log out of your workspace.</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium">Export Backup (JSON)</div>
                      <div className="text-xs text-white/40 mt-1">Download a complete, restorable backup of all your data.</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportText}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium">Export as Text</div>
                      <div className="text-xs text-white/40 mt-1">Download a readable text file of your data.</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium">Export as PDF</div>
                      <div className="text-xs text-white/40 mt-1">Download a formatted PDF document of your data.</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportWord}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium">Export as Word</div>
                      <div className="text-xs text-white/40 mt-1">Download a Word document (.docx) of your data.</div>
                    </div>
                  </button>

                  <div className="relative">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".json,.txt,.pdf,.docx" 
                      className="hidden" 
                    />
                    <button
                      onClick={handleImportClick}
                      disabled={importStatus === 'loading'}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white/90 font-medium">Import Data</div>
                        <div className="text-xs text-white/40 mt-1">Restore data from a previously exported JSON file.</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Import Status */}
                <AnimatePresence>
                  {importStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "p-4 rounded-2xl border flex items-center gap-3 mt-4",
                        importStatus === 'loading' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                        importStatus === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                        "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        {importStatus === 'loading' && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        {importStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {importStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{importMessage}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
