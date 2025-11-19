import React, { useState, useMemo } from 'react';
import { DataPanel } from './components/DataPanel';
import { MappingPanel } from './components/MappingPanel';
import { ResultPanel } from './components/ResultPanel';
import { parseTableData, generateUGCJson } from './utils';
import { SAMPLE_TARGET_JSON, SAMPLE_STRUCT_DEF_1077936130 } from './constants';
import { TableData, SlotConfig, StructureDefinition, TargetFile } from './types';
import { FileJson, FolderOpen, FilePlus, Layers, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  
  const [rawText, setRawText] = useState<string>("");
  
  // Structure Definitions (Library)
  const [structureRegistry, setStructureRegistry] = useState<{ [id: string]: StructureDefinition }>({
      [SAMPLE_STRUCT_DEF_1077936130.structId]: {
          id: SAMPLE_STRUCT_DEF_1077936130.structId,
          name: SAMPLE_STRUCT_DEF_1077936130.name || "Default Struct",
          content: SAMPLE_STRUCT_DEF_1077936130
      }
  });

  // Target Files (Initial Data)
  const [targetFiles, setTargetFiles] = useState<TargetFile[]>([
      { id: 'default', name: SAMPLE_TARGET_JSON.name || 'Default Target', content: SAMPLE_TARGET_JSON }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('default');

  // Configurations per file: Map<fileId, SlotConfig[]>
  const [configsMap, setConfigsMap] = useState<{ [fileId: string]: SlotConfig[] }>({});
  
  // --- Derived State ---
  
  const parsedData: TableData = useMemo(() => parseTableData(rawText), [rawText]);
  
  const activeFile = useMemo(() => targetFiles.find(f => f.id === activeFileId) || null, [targetFiles, activeFileId]);
  
  // Get configs for active file, or empty array
  const activeConfigs = useMemo(() => activeFile ? (configsMap[activeFile.id] || []) : [], [activeFile, configsMap]);

  const resultJson = useMemo(() => {
    if (!activeFile) return {};
    return generateUGCJson(activeFile.content, parsedData, activeConfigs);
  }, [activeFile, parsedData, activeConfigs]);

  // --- Handlers ---

  const handleUploadStructure = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
              try {
                  const json = JSON.parse(evt.target?.result as string);
                  
                  // Default ID logic: try filename (digits only), else json.structId
                  let defaultId = "";
                  const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                  if (/^\d+$/.test(filenameWithoutExt)) {
                      defaultId = filenameWithoutExt;
                  } else if (json.structId) {
                      defaultId = json.structId;
                  }

                  const userInputId = window.prompt("请输入结构体 ID (structId):", defaultId);
                  if (userInputId) {
                      const id = userInputId.trim();
                      setStructureRegistry(prev => ({
                          ...prev,
                          [id]: {
                              id,
                              name: json.name || file.name,
                              content: json
                          }
                      }));
                  }
              } catch (err) {
                  alert("无效的 JSON 文件格式");
              }
              e.target.value = ''; // reset
          };
          reader.readAsText(file);
      }
  };

  const handleUploadTargetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
              try {
                  const json = JSON.parse(evt.target?.result as string);
                  const newFileId = Date.now().toString();
                  const newFile: TargetFile = {
                      id: newFileId,
                      name: file.name,
                      content: json
                  };
                  
                  setTargetFiles(prev => [...prev, newFile]);
                  setActiveFileId(newFileId);
              } catch (err) {
                  alert("无效的 JSON 文件格式");
              }
              e.target.value = ''; // reset
          };
          reader.readAsText(file);
      }
  };

  const handleUpdateConfigs = (newConfigs: SlotConfig[]) => {
      if (activeFileId) {
          setConfigsMap(prev => ({
              ...prev,
              [activeFileId]: newConfigs
          }));
      }
  };

  const handleDeleteTargetFile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTargetFiles(prev => prev.filter(f => f.id !== id));
      if (activeFileId === id) {
          setActiveFileId(targetFiles.find(f => f.id !== id)?.id || '');
      }
  };
  
  const handleDeleteStruct = (id: string) => {
      setStructureRegistry(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            U
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">UGC Data Transformer</h1>
        </div>
        <div className="text-xs text-slate-500">
             Designed for UGC Platform Configuration
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 overflow-hidden p-4 bg-slate-50">
        <div className="grid grid-cols-12 gap-4 h-full">
            
            {/* Column 1: File Management & Data Source (Left - 30%) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4 h-full">
                
                {/* Structure Registry Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col max-h-[200px]">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            结构体定义库
                        </h3>
                        <label className="cursor-pointer text-primary hover:bg-blue-50 p-1 rounded transition">
                            <FilePlus className="w-4 h-4" />
                            <input type="file" accept=".json" className="hidden" onChange={handleUploadStructure} />
                        </label>
                     </div>
                     <div className="flex-1 overflow-y-auto text-xs space-y-1">
                        {Object.values(structureRegistry).length === 0 ? (
                            <p className="text-slate-400 italic">暂无定义</p>
                        ) : Object.values(structureRegistry).map((struct: StructureDefinition) => (
                            <div key={struct.id} className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100 group">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium text-slate-700 truncate">{struct.id}</span>
                                    <span className="text-[10px] text-slate-500 truncate">{struct.name}</span>
                                </div>
                                <button onClick={() => handleDeleteStruct(struct.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Initial Data Files Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col max-h-[200px]">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FileJson className="w-4 h-4" />
                            初始数据 (Target)
                        </h3>
                        <label className="cursor-pointer text-primary hover:bg-blue-50 p-1 rounded transition">
                            <FolderOpen className="w-4 h-4" />
                            <input type="file" accept=".json" className="hidden" onChange={handleUploadTargetFile} />
                        </label>
                     </div>
                     <div className="flex-1 overflow-y-auto text-xs space-y-1">
                        {targetFiles.length === 0 ? (
                             <p className="text-slate-400 italic">请上传初始 JSON</p>
                        ) : targetFiles.map(file => (
                            <div 
                                key={file.id} 
                                onClick={() => setActiveFileId(file.id)}
                                className={`flex justify-between items-center px-2 py-2 rounded border cursor-pointer transition ${activeFileId === file.id ? 'bg-blue-50 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                                <span className="font-medium truncate">{file.name}</span>
                                <button onClick={(e) => handleDeleteTargetFile(file.id, e)} className="text-slate-300 hover:text-red-500 p-1">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Data Panel (Bottom part) */}
                <div className="flex-1 min-h-0">
                    <DataPanel 
                        rawText={rawText} 
                        setRawText={setRawText} 
                        parsedData={parsedData} 
                    />
                </div>
            </div>

            {/* Column 2: Mapping (Middle - 40%) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-5 h-full">
                <MappingPanel 
                    activeFile={activeFile}
                    structureRegistry={structureRegistry}
                    configs={activeConfigs}
                    setConfigs={handleUpdateConfigs}
                    tableHeaders={parsedData.headers}
                />
            </div>

            {/* Column 3: Output (Right - 30%) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-4 h-full">
                <ResultPanel resultJson={resultJson} />
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;