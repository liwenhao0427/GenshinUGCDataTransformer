
import React, { useEffect } from 'react';
import { SlotConfig, MappingType, ValueSourceType, TargetFile, FieldMapping, StructureDefinition } from '../types';
import { Settings, Plus, X, AlertTriangle, FileCode, AlignJustify, Type } from 'lucide-react';
import { determineMappingType } from '../utils';

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
      // Try to find the matching definition for the whole file
      const fileStructId = activeFile.content.structId;
      const fileDefinition = structureRegistry[fileStructId];

      const initialConfigs: SlotConfig[] = activeFile.content.value.map((item, idx) => {
        const paramType = item.param_type;
        const mappingType = determineMappingType(paramType);
        
        // Determine Label from Definition if available, else use index
        let label = `Slot ${idx + 1}`;
        if (fileDefinition && fileDefinition.content.value[idx]) {
            label = fileDefinition.content.value[idx].key || label;
        }

        // Default config object
        const baseConfig: SlotConfig = {
            index: idx,
            type: mappingType,
            label,
            originalParamType: paramType,
            structFields: []
        };

        if (mappingType === MappingType.STRUCT || mappingType === MappingType.STRUCT_LIST) {
            const innerId = item.value?.structId || "";
            // Try to find definition in registry to auto-populate fields
            let autoFields: FieldMapping[] = [];
            if (innerId && structureRegistry[innerId]) {
                autoFields = structureRegistry[innerId].content.value.map(p => ({
                    targetParamType: p.param_type,
                    targetKey: p.key,
                    sourceType: ValueSourceType.COLUMN,
                    columnIndex: 0 
                }));
            } else {
                 autoFields = [{ targetParamType: 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 0 }];
            }
            return { ...baseConfig, innerStructId: innerId, structFields: autoFields };
        }

        if (mappingType === MappingType.DICT_KV) {
            return {
                ...baseConfig,
                dictKeyType: item.value?.key_type || 'String',
                dictValueType: item.value?.value_type || 'String',
                keyMapping: { targetParamType: item.value?.key_type || 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 0 },
                valueMapping: { targetParamType: item.value?.value_type || 'String', sourceType: ValueSourceType.COLUMN, columnIndex: 1 },
            };
        }

        if (mappingType === MappingType.SCALAR_LIST) {
             return { ...baseConfig, columnIndex: 0 };
        }
        
        // Scalar
        return { ...baseConfig, staticValue: "" };
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
        <div className="text-xs text-slate-500 mt-1">
            ID: {activeFile.content.structId} {structureRegistry[activeFile.content.structId] ? "(已关联定义)" : "(未找到定义，使用索引)"}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {configs.map((config) => (
          <RowConfig 
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

// --- Row Based Component ---

interface RowConfigProps {
  config: SlotConfig;
  onChange: (updates: Partial<SlotConfig>) => void;
  headers: string[];
  structureRegistry: { [id: string]: StructureDefinition };
}

const RowConfig: React.FC<RowConfigProps> = ({ config, onChange, headers, structureRegistry }) => {
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isComplex = config.type === MappingType.STRUCT || config.type === MappingType.STRUCT_LIST || config.type === MappingType.DICT_KV;
  
  const getTypeBadgeColor = (type: string) => {
      if (type.includes('String')) return 'bg-blue-100 text-blue-700';
      if (type.includes('Int') || type.includes('Float')) return 'bg-green-100 text-green-700';
      if (type.includes('Bool')) return 'bg-purple-100 text-purple-700';
      if (type.includes('Struct')) return 'bg-indigo-100 text-indigo-700';
      if (type.includes('Dict')) return 'bg-amber-100 text-amber-700';
      return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="border border-slate-200 rounded bg-white hover:border-indigo-300 transition-colors">
        {/* Main Row */}
        <div className="flex items-center p-2 gap-3 h-12">
            {/* Index */}
            <div className="w-6 flex-shrink-0 text-center text-xs text-slate-400 font-mono">
                {config.index + 1}
            </div>

            {/* Label & Type (Read Only) */}
            <div className="w-48 flex-shrink-0 flex flex-col justify-center">
                <div className="text-sm font-medium text-slate-700 truncate" title={config.label}>{config.label}</div>
            </div>

            <div className="w-28 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getTypeBadgeColor(config.originalParamType)}`}>
                    {config.originalParamType}
                </span>
            </div>

            {/* Controls based on Type */}
            <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
                {config.type === MappingType.SCALAR && (
                     <input 
                        type="text"
                        value={config.staticValue || ''}
                        onChange={(e) => onChange({ staticValue: e.target.value })}
                        placeholder="输入固定值..."
                        className="w-full max-w-xs text-sm border border-slate-300 rounded px-2 py-1 focus:border-primary focus:outline-none"
                     />
                )}

                {config.type === MappingType.SCALAR_LIST && (
                    <div className="w-full max-w-xs flex items-center gap-2">
                        <span className="text-xs text-slate-400 whitespace-nowrap">数据列:</span>
                        <select 
                            value={config.columnIndex || 0}
                            onChange={(e) => onChange({ columnIndex: parseInt(e.target.value) })}
                            className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:border-primary focus:outline-none"
                        >
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>
                )}

                {isComplex && (
                     <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`text-xs px-3 py-1 rounded border transition flex items-center gap-1 ${isExpanded ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-primary text-primary hover:bg-blue-50'}`}
                     >
                         {isExpanded ? '收起配置' : '展开配置'}
                         {config.type === MappingType.STRUCT_LIST && '(列表)'}
                     </button>
                )}
            </div>
        </div>

        {/* Expanded Area for Complex Types */}
        {isExpanded && isComplex && (
            <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-3">
                 {/* Struct / StructList Logic */}
                 {(config.type === MappingType.STRUCT || config.type === MappingType.STRUCT_LIST) && (
                     <>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <FileCode className="w-3 h-3" />
                            <span>结构 ID: {config.innerStructId}</span>
                            {structureRegistry[config.innerStructId || ''] ? (
                                <span className="text-green-600 ml-2">✓ 已加载定义: {structureRegistry[config.innerStructId || ''].name}</span>
                            ) : (
                                <span className="text-amber-600 ml-2">⚠ 未找到定义 (请上传)</span>
                            )}
                        </div>
                        
                        {config.structFields.map((field, idx) => (
                             <div key={idx} className="flex items-center gap-2 pl-4 border-l-2 border-slate-200">
                                 <div className="w-32 text-xs font-medium text-slate-600 truncate" title={field.targetKey || 'Unknown'}>
                                     {field.targetKey || `Field ${idx+1}`}
                                 </div>
                                 <div className="w-20 text-[10px] text-slate-400">{field.targetParamType}</div>
                                 <div className="flex-1">
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
                             </div>
                        ))}
                     </>
                 )}

                 {/* Dict Logic */}
                 {config.type === MappingType.DICT_KV && (
                     <div className="space-y-2 pl-4 border-l-2 border-amber-200">
                         <div className="flex items-center gap-2">
                             <span className="w-10 text-xs font-bold text-slate-600">Key</span>
                             <div className="w-20 text-[10px] text-slate-400">{config.dictKeyType}</div>
                             <div className="flex-1">
                                {config.keyMapping && (
                                    <FieldSourceSelector field={config.keyMapping} headers={headers} onChange={f => onChange({ keyMapping: f })} />
                                )}
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="w-10 text-xs font-bold text-slate-600">Value</span>
                             <div className="w-20 text-[10px] text-slate-400">{config.dictValueType}</div>
                             <div className="flex-1">
                                {config.valueMapping && (
                                    <FieldSourceSelector field={config.valueMapping} headers={headers} onChange={f => onChange({ valueMapping: f })} />
                                )}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
        )}
    </div>
  );
};

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
                className="text-xs border rounded px-1 py-1 bg-white text-slate-600 focus:border-primary focus:outline-none w-20 shrink-0"
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
