
import React, { useEffect } from 'react';
import { SlotConfig, MappingType, ValueSourceType, TargetFile, FieldMapping, StructureDefinition } from '../types';
import { Settings, Plus, X, AlertTriangle, FileCode } from 'lucide-react';

interface MappingPanelProps {
  activeFile: TargetFile | null;
  structureRegistry: { [id: string]: StructureDefinition };
  configs: SlotConfig[];
  setConfigs: (configs: SlotConfig[]) => void;
  tableHeaders: string[];
}

export const MappingPanel: React.FC<MappingPanelProps> = ({ activeFile, structureRegistry, configs, setConfigs, tableHeaders }) => {
  
  // Initialize configs when activeFile changes
  useEffect(() => {
    if (activeFile && configs.length === 0) {
      const initialConfigs: SlotConfig[] = activeFile.content.value.map((item, idx) => {
        const isList = item.param_type === 'StructList';
        const isDict = item.param_type === 'Dict';
        const label = item.key || `Item ${idx}`;

        if (isList) {
            const innerId = item.value?.structId || "";
            // Try to find definition in registry to auto-populate fields
            let autoFields: FieldMapping[] = [];
            if (innerId && structureRegistry[innerId]) {
                autoFields = structureRegistry[innerId].content.value.map(p => ({
                    targetParamType: p.param_type,
                    targetKey: p.key,
                    sourceType: ValueSourceType.COLUMN,
                    columnIndex: 0 // Default to first column, user will change
                }));
            } else {
                 // Fallback default
                 autoFields = [
                    { targetParamType: 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 0 },
                 ];
            }

            return {
                index: idx,
                type: MappingType.STRUCT_LIST,
                label,
                structFields: autoFields,
                innerStructId: innerId
            };
        }
        if (isDict) {
            return {
                index: idx,
                type: MappingType.DICT_KV,
                label,
                dictKeyType: item.value?.key_type || 'String',
                dictValueType: item.value?.value_type || 'String',
                keyMapping: { targetParamType: item.value?.key_type || 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 0 },
                valueMapping: { targetParamType: item.value?.value_type || 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 1 },
                structFields: []
            };
        }
        return { index: idx, type: MappingType.IGNORE, label, structFields: [] };
      });
      setConfigs(initialConfigs);
    }
  }, [activeFile, configs.length, setConfigs, structureRegistry]);

  const updateConfig = (index: number, updates: Partial<SlotConfig>) => {
    setConfigs(configs.map(c => c.index === index ? { ...c, ...updates } : c));
  };

  if (!activeFile) {
      return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden items-center justify-center text-slate-400">
            <FileCode className="w-12 h-12 mb-3 opacity-50" />
            <p>请先在左侧选择或上传一个“初始数据”文件</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          2. 配置映射规则 - <span className="text-primary">{activeFile.name}</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {configs.map((config) => (
          <ConfigCard 
            key={config.index} 
            config={config} 
            onChange={(updates) => updateConfig(config.index, updates)}
            headers={tableHeaders}
            structureRegistry={structureRegistry}
          />
        ))}
      </div>
    </div>
  );
};

// --- Sub-Components ---

interface ConfigCardProps {
  config: SlotConfig;
  onChange: (updates: Partial<SlotConfig>) => void;
  headers: string[];
  structureRegistry: { [id: string]: StructureDefinition };
}

const ConfigCard: React.FC<ConfigCardProps> = ({ config, onChange, headers, structureRegistry }) => {
  
  const isStructList = config.type === MappingType.STRUCT_LIST;
  const missingDefinition = isStructList && config.innerStructId && !structureRegistry[config.innerStructId];
  const structName = isStructList && config.innerStructId && structureRegistry[config.innerStructId]?.name;

  return (
    <div className="border border-slate-200 rounded-md p-3 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
            #{config.index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700 truncate" title={config.label}>
            {config.label || `Item ${config.index}`}
          </span>
        </div>
        <select 
            value={config.type}
            onChange={(e) => onChange({ type: e.target.value as MappingType })}
            className="text-xs border-none bg-slate-50 font-medium text-primary focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-2 py-1 ml-2"
        >
            <option value={MappingType.STRUCT_LIST}>结构体列表 (StructList)</option>
            <option value={MappingType.DICT_KV}>字典 (Dict)</option>
            <option value={MappingType.IGNORE}>忽略 (Ignore)</option>
        </select>
      </div>

      {isStructList && (
        <div className="space-y-3">
           <div className="flex items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                <div className="flex items-center gap-2">
                    <span>结构 ID:</span>
                    <input 
                        type="text" 
                        value={config.innerStructId || ''} 
                        onChange={e => onChange({ innerStructId: e.target.value })}
                        className="border rounded px-1 py-0.5 w-24 text-slate-700 font-mono"
                    />
                </div>
                {missingDefinition ? (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        未找到定义
                    </span>
                ) : (
                    <span className="text-green-600 font-medium truncate max-w-[120px]">
                        {structName || '已定义'}
                    </span>
                )}
           </div>

           {missingDefinition && (
               <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                   提示：请在上方“结构体定义库”中上传 ID 为 <b>{config.innerStructId}</b> 的结构体 JSON，以便自动识别字段。
               </div>
           )}

           <div className="space-y-2">
             <div className="flex justify-between items-end">
                <p className="text-xs font-semibold text-slate-600">字段映射:</p>
             </div>
             {config.structFields.map((field, idx) => (
               <div key={idx} className="flex gap-2 items-center group">
                 <span className="text-[10px] text-slate-400 w-4 text-center">{idx+1}</span>
                 
                 <div className="flex flex-col gap-1 w-28 shrink-0">
                    {field.targetKey && (
                        <span className="text-[10px] font-medium text-slate-600 truncate" title={field.targetKey}>
                            {field.targetKey}
                        </span>
                    )}
                    <input 
                        className="text-xs border rounded px-2 py-1 focus:border-primary focus:outline-none font-mono text-slate-500"
                        value={field.targetParamType}
                        onChange={(e) => {
                            const newFields = [...config.structFields];
                            newFields[idx] = { ...field, targetParamType: e.target.value };
                            onChange({ structFields: newFields });
                        }}
                        placeholder="类型"
                    />
                 </div>

                 <div className="flex-1 min-w-0">
                    <FieldSourceSelector 
                        field={field} 
                        headers={headers}
                        onChange={(newField) => {
                            const newFields = [...config.structFields];
                            newFields[idx] = newField;
                            onChange({ structFields: newFields });
                        }}
                    />
                 </div>
                 <button 
                    onClick={() => {
                        const newFields = config.structFields.filter((_, i) => i !== idx);
                        onChange({ structFields: newFields });
                    }}
                    className="text-slate-300 hover:text-red-500 p-1 rounded transition opacity-0 group-hover:opacity-100"
                    title="删除字段"
                 >
                     <X className="w-3 h-3" />
                 </button>
               </div>
             ))}
             <button 
                onClick={() => {
                    onChange({ structFields: [...config.structFields, { targetParamType: 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 0 }] });
                }}
                className="w-full py-1.5 mt-2 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-primary hover:border-primary hover:bg-blue-50 transition flex items-center justify-center gap-1"
             >
                 <Plus className="w-3 h-3" /> 添加字段
             </button>
           </div>
        </div>
      )}

      {config.type === MappingType.DICT_KV && (
        <div className="space-y-3 text-sm">
           <div className="grid grid-cols-[40px_1fr_2fr] gap-2 items-center">
             <span className="text-slate-500 text-xs font-mono">Key</span>
             <input 
                value={config.dictKeyType} 
                onChange={(e) => onChange({ dictKeyType: e.target.value })}
                className="border rounded px-2 py-1 text-xs w-full focus:border-primary focus:outline-none font-mono"
                placeholder="键类型"
             />
             {config.keyMapping && (
                <FieldSourceSelector 
                    field={config.keyMapping} 
                    headers={headers}
                    onChange={(fm) => onChange({ keyMapping: fm })}
                />
             )}
           </div>
           <div className="grid grid-cols-[40px_1fr_2fr] gap-2 items-center">
             <span className="text-slate-500 text-xs font-mono">Value</span>
             <input 
                value={config.dictValueType} 
                onChange={(e) => onChange({ dictValueType: e.target.value })}
                className="border rounded px-2 py-1 text-xs w-full focus:border-primary focus:outline-none font-mono"
                placeholder="值类型"
             />
              {config.valueMapping && (
                <FieldSourceSelector 
                    field={config.valueMapping} 
                    headers={headers}
                    onChange={(fm) => onChange({ valueMapping: fm })}
                />
             )}
           </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Selector ---

interface FieldSourceSelectorProps {
    field: FieldMapping;
    headers: string[];
    onChange: (f: FieldMapping) => void;
}

const FieldSourceSelector: React.FC<FieldSourceSelectorProps> = ({ field, headers, onChange }) => {
    return (
        <div className="flex gap-1 w-full items-center">
            <select 
                value={field.sourceType}
                onChange={(e) => onChange({ ...field, sourceType: e.target.value as ValueSourceType })}
                className="text-xs border rounded px-1 py-1 bg-slate-50 text-slate-600 focus:border-primary focus:outline-none w-20 shrink-0"
            >
                <option value={ValueSourceType.COLUMN}>列</option>
                <option value={ValueSourceType.AUTO_INDEX}>序号</option>
                <option value={ValueSourceType.STATIC}>固定</option>
            </select>

            {field.sourceType === ValueSourceType.COLUMN && (
                <select 
                    value={field.columnIndex}
                    onChange={(e) => onChange({ ...field, columnIndex: parseInt(e.target.value) })}
                    className="text-xs border rounded px-1 py-1 flex-1 text-slate-700 focus:border-primary focus:outline-none min-w-0"
                    title={headers[field.columnIndex || 0]}
                >
                    {headers.length > 0 ? headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                    )) : <option value={0}>Column 1</option>}
                </select>
            )}

             {field.sourceType === ValueSourceType.STATIC && (
                <input 
                    type="text"
                    value={field.staticValue || ''}
                    onChange={(e) => onChange({ ...field, staticValue: e.target.value })}
                    className="text-xs border rounded px-1 py-1 flex-1 focus:border-primary focus:outline-none min-w-0"
                    placeholder="输入固定值..."
                />
            )}
        </div>
    );
};
