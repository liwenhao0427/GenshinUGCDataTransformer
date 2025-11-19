
import React, { useState } from 'react';
import { TableData } from '../types';
import { Upload, ClipboardPaste, Check } from 'lucide-react';
import { SAMPLE_TABLE_DATA } from '../constants';

interface DataPanelProps {
  rawText: string;
  setRawText: (text: string) => void;
  parsedData: TableData;
}

export const DataPanel: React.FC<DataPanelProps> = ({ rawText, setRawText, parsedData }) => {
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null);

  const handlePasteSample = () => {
    setRawText(SAMPLE_TABLE_DATA);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHeader(text);
    setTimeout(() => setCopiedHeader(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <ClipboardPaste className="w-4 h-4" />
          1. 数据源 (表格)
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={handlePasteSample}
                className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 transition"
            >
                加载示例
            </button>
            <button 
                onClick={() => setRawText('')}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
            >
                清空
            </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <textarea
          className="w-full h-32 p-3 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none resize-none"
          placeholder="在此粘贴 Excel/CSV 数据 (第一行为标题)..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />

        <div className="flex-1 overflow-auto border border-slate-200 rounded-md relative">
          {parsedData.headers.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 w-10 border-b border-slate-200 bg-slate-100">#</th>
                  {parsedData.headers.map((h, i) => (
                    <th 
                        key={i} 
                        className="px-4 py-2 whitespace-nowrap border-l border-b border-slate-200 bg-slate-100 cursor-pointer hover:bg-slate-200 transition group select-none"
                        onClick={() => copyToClipboard(h)}
                        title="点击复制标题"
                    >
                      <div className="flex items-center gap-1">
                        {h}
                        {copiedHeader === h ? (
                             <Check className="w-3 h-3 text-green-600" />
                        ) : (
                            <span className="text-[10px] text-slate-400 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                                (列 {i})
                            </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs text-slate-400">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border-l border-slate-200 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
              <Upload className="w-8 h-8 mb-2" />
              <p>暂无数据</p>
            </div>
          )}
        </div>
        {parsedData.rows.length > 0 && (
            <p className="text-xs text-slate-400 text-right">
                共 {parsedData.rows.length} 行数据
            </p>
        )}
      </div>
    </div>
  );
};
