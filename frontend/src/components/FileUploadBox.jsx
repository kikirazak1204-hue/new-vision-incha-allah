import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FileUploadBox({ onFilesSelected }) {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (onFilesSelected) onFilesSelected(files);
  };

  const removeFile = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    if (onFilesSelected) onFilesSelected(newFiles);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-[#061a3a] mb-2">
        {t('upload_doc')} {/* Utilise la traduction ! */}
      </label>
      
      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:bg-slate-50 hover:border-amber-400 transition cursor-pointer text-center group">
        
        {/* Input invisible caché par dessus la zone */}
        <input 
          type="file" 
          multiple 
          accept="image/png, image/jpeg, application/pdf, .doc, .docx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="text-slate-500">
          <svg className="mx-auto h-8 w-8 mb-2 text-slate-400 group-hover:text-amber-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-semibold text-sm">Cliquez ou glissez vos fichiers ici</span>
          <p className="text-[10px] mt-1">Images (JPG, PNG), Documents (PDF, Word)</p>
        </div>
      </div>

      {/* Affichage des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-xl shadow-sm text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg">
                  {file.type.includes('image') ? '🖼️' : '📄'}
                </span>
                <span className="truncate font-semibold text-slate-700">{file.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}