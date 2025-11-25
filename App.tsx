
import React, { useState, useMemo, useEffect } from 'react';
import { DataPanel } from './components/DataPanel';
import { MappingPanel } from './components/MappingPanel';
import { ResultPanel } from './components/ResultPanel';
import { InputModal } from './components/InputModal';
import { parseTableData, generateUGCJson } from './utils';
import { SAMPLE_TARGET_JSON, SAMPLE_STRUCT_DEF_1077936134, SAMPLE_STRUCT_DEF_1077936130 } from './constants';
import { TableData, SlotConfig, StructureDefinition, TargetFile } from './types';
import { FileJson, FolderOpen, FilePlus, Layers, Trash2, RefreshCcw } from 'lucide-react';

const STORAGE_KEY_STRUCTURES = 'ugc_transformer_structures';
const STORAGE_KEY_TARGETS = 'ugc_transformer_targets';
const STORAGE_KEY_CONFIGS = 'ugc_transformer_configs';

const App: React.FC = () => {
  // --- State ---
  
  const [rawText, setRawText] = useState<string>("");
  
  // Structure Definitions (Library) - Load from LocalStorage or default
  const [structureRegistry, setStructureRegistry] = useState<{ [id: string]: StructureDefinition }>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY_STRUCTURES);
          if (saved) return JSON.parse(saved);
      } catch (e) {
          console.error("Failed to load structures from storage", e);
      }
      return {
          [SAMPLE_STRUCT_DEF_1077936134.structId]: {
              id: SAMPLE_STRUCT_DEF_1077936134.structId,
              name: SAMPLE_STRUCT_DEF_1077936134.name || "Complex Struct",
              content: SAMPLE_STRUCT_DEF_1077936134
          },
          [SAMPLE_STRUCT_DEF_1077936130.structId]: {
              id: SAMPLE_STRUCT_DEF_1077936130.structId,
              name: SAMPLE_STRUCT_DEF_1077936130.name || "Inner Struct",
              content: SAMPLE_STRUCT_DEF_1077936130
          }
      };
  });

  // Target Files (Initial Data) - Load from LocalStorage or default
  const [targetFiles, setTargetFiles] = useState<TargetFile[]>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY_TARGETS);
          if (saved) return JSON.parse(saved);
      } catch (e) {
          console.error("Failed to load targets from storage", e);
      }
      return [{ id: 'default', name: SAMPLE_TARGET_JSON.name || 'Default Target', content: SAMPLE_TARGET_JSON }];
  });

  const [activeFileId, setActiveFileId] = useState<string>('');

  // Ensure activeFileId is valid on init
  useEffect(() => {
      if (targetFiles.length > 0) {
          if (!activeFileId || !targetFiles.find(f => f.id === activeFileId)) {
              setActiveFileId(targetFiles[0].id);
          }
      } else {
          setActiveFileId('');
      }
  }, [targetFiles, activeFileId]);

  // Persist state to LocalStorage
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_STRUCTURES, JSON.stringify(structureRegistry));
  }, [structureRegistry]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_TARGETS, JSON.stringify(targetFiles));
  }, [targetFiles]);


  // Configurations per file: Map<fileId, SlotConfig[]>
  // Load from LocalStorage
  const [configsMap, setConfigsMap] = useState<{ [fileId: string]: SlotConfig[] }>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY_CONFIGS);
          if (saved) return JSON.parse(saved);
      } catch (e) {
          console.error("Failed to load configs from storage", e);
      }
      return {};
  });

  // Persist configsMap
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(configsMap));
  }, [configsMap]);
  
  // Modal State
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; defaultValue: string; callback: (val: string) => void } | null>(null);

  // --- Derived State ---
  
  const parsedData: TableData = useMemo(() => parseTableData(rawText), [rawText]);
  
  const activeFile = useMemo(() => targetFiles.find(f => f.id === activeFileId) || null, [targetFiles, activeFileId]);
  
  // Get configs for active file, or empty array
  const activeConfigs = useMemo(() => activeFile ? (configsMap[activeFile.id] || []) : [], [activeFile, configsMap]);

  const resultJson = useMemo(() => {
    if (!activeFile) return {};
    // Pass structureRegistry to helper to resolve nested keys
    return generateUGCJson(activeFile.content, parsedData, activeConfigs, structureRegistry);
  }, [activeFile, parsedData, activeConfigs, structureRegistry]);

  // --- Handlers ---

  const handleUploadStructure = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const content = evt.target?.result as string;
              console.log("Structure JSON loaded:", content.substring(0, 100));
              const json = JSON.parse(content);
              
              let defaultId = "";
              if (json.structId) defaultId = String(json.structId);
              else if (json.basic_struct_id) defaultId = String(json.basic_struct_id);
              else defaultId = file.name.replace(/\.[^/.]+$/, "");

              // Use Custom Modal instead of window.prompt
              setModal({
                  isOpen: true,
                  title: "请输入结构体 ID (structId)",
                  defaultValue: defaultId,
                  callback: (id) => {
                      if (id.trim()) {
                          setStructureRegistry(prev => ({
                              ...prev,
                              [id]: {
                                  id,
                                  name: json.name || file.name,
                                  content: json
                              }
                          }));
                      }
                      setModal(null);
                  }
              });

          } catch (err) {
              console.error("Upload Error:", err);
              alert("无法解析 JSON 文件，请确保格式正确。");
          } finally {
              e.target.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleUploadTargetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

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
              console.error("Target File Upload Error:", err);
              alert("无效的 JSON 文件格式");
          } finally {
               e.target.value = ''; 
          }
      };
      reader.readAsText(file);
  };

  const handleUpdateConfigs = (newConfigs: SlotConfig[]) => {
      if (activeFileId) {
          setConfigsMap(prev => ({
              ...prev,
              [activeFileId]: newConfigs
          }));
      }
  };

  const handleResetStorage = () => {
      if (window.confirm("确定要清空所有缓存数据（包括映射配置）并恢复默认设置吗？")) {
          localStorage.removeItem(STORAGE_KEY_STRUCTURES);
          localStorage.removeItem(STORAGE_KEY_TARGETS);
          localStorage.removeItem(STORAGE_KEY_CONFIGS);
          window.location.reload();
      }
  };

  return (
    <div className="h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            U
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">结构体编辑工具</h1>
        </div>
        <div className="text-xs text-slate-500">
             UGC 配置映射生成器
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 overflow-hidden p-4 bg-slate-50 min-h-0">
        <div className="grid grid-cols-12 gap-4 h-full">
            
            {/* Column 1: File Management & Data Source (Left - 30%) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4 h-full min-h-0">
                
                {/* Structure Registry Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col max-h-[200px] flex-shrink-0">
                     <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            结构体定义库
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={handleResetStorage} className="text-slate-400 hover:text-red-500 p-1 rounded transition" title="清空缓存 (重置)">
                                <RefreshCcw className="w-3 h-3" />
                            </button>
                            <label className="cursor-pointer text-primary hover:bg-blue-50 p-1 rounded transition" title="上传结构体定义 JSON">
                                <FilePlus className="w-4 h-4" />
                                <input type="file" accept=".json" className="hidden" onChange={handleUploadStructure} />
                            </label>
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto text-xs space-y-1 min-h-0">
                        {Object.values(structureRegistry).length === 0 ? (
                            <p className="text-slate-400 italic">暂无定义</p>
                        ) : Object.values(structureRegistry).map((struct: StructureDefinition) => (
                            <div key={struct.id} className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100 group">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium text-slate-700 truncate">ID: {struct.id}</span>
                                    <span className="text-[10px] text-slate-500 truncate">{struct.name}</span>
                                </div>
                                <button onClick={() => {
                                    setStructureRegistry(prev => {
                                        const next = {...prev};
                                        delete next[struct.id];
                                        return next;
                                    });
                                }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Initial Data Files Section */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col max-h-[200px] flex-shrink-0">
                     <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FileJson className="w-4 h-4" />
                            初始数据 (Template)
                        </h3>
                        <label className="cursor-pointer text-primary hover:bg-blue-50 p-1 rounded transition" title="上传初始数据 JSON">
                            <FolderOpen className="w-4 h-4" />
                            <input type="file" accept=".json" className="hidden" onChange={handleUploadTargetFile} />
                        </label>
                     </div>
                     <div className="flex-1 overflow-y-auto text-xs space-y-1 min-h-0">
                        {targetFiles.length === 0 ? (
                             <p className="text-slate-400 italic">请上传初始 JSON</p>
                        ) : targetFiles.map(file => (
                            <div 
                                key={file.id} 
                                onClick={() => setActiveFileId(file.id)}
                                className={`flex justify-between items-center px-2 py-2 rounded border cursor-pointer transition ${activeFileId === file.id ? 'bg-blue-50 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                                <span className="font-medium truncate">{file.name}</span>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setTargetFiles(prev => prev.filter(f => f.id !== file.id));
                                    if(activeFileId === file.id) setActiveFileId("");
                                }} className="text-slate-300 hover:text-red-500 p-1">
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
            <div className="col-span-12 md:col-span-4 lg:col-span-5 h-full min-h-0">
                <MappingPanel 
                    activeFile={activeFile}
                    structureRegistry={structureRegistry}
                    configs={activeConfigs}
                    setConfigs={handleUpdateConfigs}
                    tableHeaders={parsedData.headers}
                />
            </div>

            {/* Column 3: Output (Right - 30%) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-4 h-full min-h-0">
                <ResultPanel resultJson={resultJson} />
            </div>
        </div>
      </main>

      {modal && (
          <InputModal 
            isOpen={modal.isOpen} 
            title={modal.title} 
            defaultValue={modal.defaultValue}
            onConfirm={modal.callback}
            onCancel={() => setModal(null)}
          />
      )}
    </div>
  );
};

export default App;
