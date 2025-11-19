
import React, { useState } from 'react';
import { Download, CheckCircle, FileJson, Eye, Code, List, Braces, Box } from 'lucide-react';
import { TYPE_LABELS } from '../constants';

interface ResultPanelProps {
  resultJson: any;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ resultJson }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

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
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            3. 生成结果
          </h2>
          
          <div className="flex bg-slate-200 rounded-md p-0.5">
              <button 
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${viewMode === 'visual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Eye className="w-3 h-3" /> 预览
              </button>
              <button 
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${viewMode === 'json' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Code className="w-3 h-3" /> 代码
              </button>
          </div>
        </div>

        <button 
            onClick={downloadJson}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm"
        >
            <Download className="w-4 h-4" /> 下载
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-slate-50/50">
        {viewMode === 'json' ? (
            <div className="h-full bg-slate-900 p-4 overflow-auto">
                 <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(resultJson, null, 2)}
                </pre>
            </div>
        ) : (
            <div className="h-full overflow-y-auto p-4">
                {resultJson?.value ? (
                    <VisualResultViewer data={resultJson} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileJson className="w-12 h-12 mb-2 opacity-20" />
                        <p>等待生成数据...</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// --- Visual Components ---

interface VisualViewerProps {
    data: any;
    level?: number;
    label?: string;
}

const VisualResultViewer: React.FC<VisualViewerProps> = ({ data, level = 0, label }) => {
    if (!data) return <span className="text-slate-400 italic">Null</span>;

    // Handle Dict wrapper: { type: 'Dict', value: [...] }
    if (data && typeof data === 'object' && data.type === 'Dict' && Array.isArray(data.value)) {
        return <VisualResultViewer data={data.value} level={level} label={label} />;
    }

    // 1. Root or Nested Struct
    if (data.type === 'Struct' && Array.isArray(data.value)) {
        return (
            <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${level > 0 ? 'mt-2' : ''}`}>
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 rounded-t-lg flex items-center gap-2">
                    <Box className="w-3 h-3 text-indigo-500" />
                    <span className="font-medium text-sm text-slate-700">{label || data.name || "结构体"}</span>
                    {data.structId && <span className="text-[10px] text-slate-400 font-mono">ID: {data.structId}</span>}
                </div>
                <div className="p-3 space-y-2">
                    {data.value.map((item: any, idx: number) => {
                         return (
                             <div key={idx} className="flex flex-col border-l-2 border-slate-100 pl-3">
                                 <div className="flex items-baseline justify-between mb-1">
                                     <span className="text-xs font-semibold text-slate-600">{item.key || `Field ${idx+1}`}</span>
                                     <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                         {TYPE_LABELS[item.param_type] || item.param_type}
                                     </span>
                                 </div>
                                 <div className="text-sm">
                                     <VisualResultViewer data={item.value} level={level + 1} label={item.key} />
                                 </div>
                             </div>
                         );
                    })}
                </div>
            </div>
        );
    }
    
    // 2. Struct Object (Value of a Struct param)
    if (typeof data === 'object' && data.type === 'Struct' && Array.isArray(data.value)) {
         return (
            <div className="bg-slate-50/50 border border-slate-200 rounded p-2">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Box className="w-3 h-3" /> Inner Struct ({data.structId})
                </div>
                <div className="space-y-2">
                    {data.value.map((item: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-indigo-200 pl-2">
                             <div className="flex justify-between mb-0.5">
                                <span className="text-xs font-medium text-slate-600">{item.key || `Field ${idx+1}`}</span>
                                <span className="text-[10px] text-slate-400">{TYPE_LABELS[item.param_type] || item.param_type}</span>
                             </div>
                             <VisualResultViewer data={item.value} level={level + 1} />
                        </div>
                    ))}
                </div>
            </div>
         );
    }

    // 3. Struct List
    if (Array.isArray(data) && data.length > 0 && data[0]?.param_type === 'Struct') {
        return (
            <div className="space-y-2">
                {data.map((structWrapper: any, idx: number) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-slate-300 hover:border-indigo-400 transition-colors">
                        <div className="absolute -left-[5px] top-2 w-2 h-2 bg-slate-300 rounded-full" />
                        <VisualResultViewer data={structWrapper.value} level={level + 1} label={`Item ${idx+1}`} />
                    </div>
                ))}
            </div>
        );
    }

    // 4. Dict (Key-Value Pairs) - Simple List Visualization
    if (Array.isArray(data) && data.length > 0 && data[0]?.key && data[0]?.value) {
        return (
            <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border border-slate-200">
                {data.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center text-xs border-b border-slate-200 last:border-0 pb-1 mb-1 last:pb-0 last:mb-0">
                         <div className="font-mono text-slate-600 mr-2 min-w-[20px]">
                             <VisualResultViewer data={entry.key.value} />
                         </div>
                         <span className="text-slate-400 mr-2">:</span>
                         <div className="text-slate-800 font-medium">
                             <VisualResultViewer data={entry.value.value} />
                         </div>
                    </div>
                ))}
            </div>
        );
    }

    // 5. Scalar List (Array of primitives)
    if (Array.isArray(data)) {
        if (data.length === 0) return <span className="text-slate-400 text-xs">[ 空列表 ]</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {data.map((val: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {String(val)}
                    </span>
                ))}
            </div>
        );
    }

    // 6. Scalar Value
    return <span className="text-slate-800 break-all font-mono text-xs">{String(data)}</span>;
};
