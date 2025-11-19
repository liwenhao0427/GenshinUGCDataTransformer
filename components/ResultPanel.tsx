
import React from 'react';
import { Download, CheckCircle } from 'lucide-react';

interface ResultPanelProps {
  resultJson: any;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ resultJson }) => {
  
  const downloadJson = () => {
    const dataStr = JSON.stringify(resultJson, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (resultJson.name || "output") + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          3. 生成结果
        </h2>
        <button 
            onClick={downloadJson}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm"
        >
            <Download className="w-4 h-4" /> 下载 JSON
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden bg-slate-900 p-4">
        <pre className="text-xs text-green-400 font-mono overflow-auto h-full">
          {JSON.stringify(resultJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};
