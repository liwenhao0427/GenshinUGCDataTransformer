
import React, { useEffect } from 'react';
import { SlotConfig, MappingType, ValueSourceType, TargetFile, FieldMapping, StructureDefinition } from '../types';
import { Settings, FileCode } from 'lucide-react';
import { determineMappingType } from '../utils';
import { TYPE_LABELS } from '../constants';

interface MappingPanelProps {
  activeFile: TargetFile | null;
  structureRegistry: { [id: string]: StructureDefinition };
  configs: SlotConfig[];
  setConfigs: (configs: SlotConfig[]) => void;
  tableHeaders: string[];
}

const getTranslatedType = (type: string) => {
    return TYPE_LABELS[type] || type;
};

// Helper to find column index by name (case-insensitive)
const findColumnIndex = (headers: string[], name: string): number => {
    if (!name) return -1;
    const lowerName = name.trim().toLowerCase();
    return headers.findIndex(h => h.trim().toLowerCase() === lowerName);
};

export const MappingPanel: React.FC<MappingPanelProps> = ({ activeFile, structureRegistry, configs, setConfigs, tableHeaders }) => {
  
  // 1. Initialize configs when activeFile changes (and no configs exist)
  useEffect(() => {
    if (activeFile && configs.length === 0) {
      // Try to find the matching definition for the whole file
      const fileStructId = activeFile.content.structId;
      const fileDefinition = structureRegistry[fileStructId];

      const initialConfigs: SlotConfig[] = activeFile.content.value.map((item, idx) => {
        const paramType = item.param_type;
        const mappingType = determineMappingType(paramType);
        
        // Determine Label
        // Priority: 1. Key in Target File (item.key) -> 2. Key in Definition -> 3. Default Slot X
        let label = item.key;
        
        if (!label && fileDefinition && fileDefinition.content.value[idx]) {
            label = fileDefinition.content.value[idx].key;
        }
        
        if (!label) {
            label = `Slot ${idx + 1}`;
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
            
            // Default source for singleton struct should be STATIC (Manual Input)
            // But if headers match, we might switch to COLUMN later (in auto-map effect) or here
            const defaultSource = mappingType === MappingType.STRUCT ? ValueSourceType.STATIC : ValueSourceType.COLUMN;

            if (innerId && structureRegistry[innerId]) {
                autoFields = structureRegistry[innerId].content.value.map(p => {
                    // Auto-map: Check if field key matches any header
                    const matchIdx = findColumnIndex(tableHeaders, p.key || "");
                    const useColumn = matchIdx !== -1;

                    return {
                        targetParamType: p.param_type,
                        targetKey: p.key,
                        sourceType: useColumn ? ValueSourceType.COLUMN : defaultSource,
                        columnIndex: useColumn ? matchIdx : 0,
                        staticValue: ""
                    };
                });
            } else {
                 // Fallback: Try to derive structure from target file content if available
                 if (mappingType === MappingType.STRUCT && item.value?.value && Array.isArray(item.value.value)) {
                     autoFields = item.value.value.map((p: any) => {
                        const matchIdx = findColumnIndex(tableHeaders, p.key || "");
                        const useColumn = matchIdx !== -1;
                        return {
                            targetParamType: p.param_type || 'String',
                            targetKey: p.key, 
                            sourceType: useColumn ? ValueSourceType.COLUMN : defaultSource,
                            columnIndex: useColumn ? matchIdx : 0,
                            staticValue: ""
                        };
                     });
                 } else {
                     autoFields = [{ targetParamType: 'String', sourceType: defaultSource, columnIndex: 0, staticValue: "" }];
                 }
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
             // Auto-map: Check if label matches any header
             const matchIdx = findColumnIndex(tableHeaders, label || "");
             return { ...baseConfig, columnIndex: matchIdx !== -1 ? matchIdx : 0 };
        }
        
        // Scalar
        return { ...baseConfig, staticValue: "" };
      });
      setConfigs(initialConfigs);
    }
  }, [activeFile, configs.length, setConfigs, structureRegistry]); // Removed tableHeaders from dep array to prevent full reset on paste

  // 2. Effect to Auto-Map when Table Headers Change (User pastes new data)
  // This runs whenever tableHeaders changes, scanning existing configs to see if we can improve mappings
  useEffect(() => {
      if (configs.length === 0 || tableHeaders.length === 0) return;

      let hasChanges = false;
      const newConfigs = configs.map(config => {
          const newConfig = { ...config };

          // Try mapping SCALAR_LIST
          if (newConfig.type === MappingType.SCALAR_LIST) {
              const matchIdx = findColumnIndex(tableHeaders, newConfig.label || "");
              // Only update if it finds a match and currently it might be 0 (default) or different
              // Logic: If we find a name match, we prioritize it.
              if (matchIdx !== -1 && newConfig.columnIndex !== matchIdx) {
                  newConfig.columnIndex = matchIdx;
                  hasChanges = true;
              }
          }

          // Try mapping STRUCT / STRUCT_LIST fields
          if ((newConfig.type === MappingType.STRUCT || newConfig.type === MappingType.STRUCT_LIST) && newConfig.structFields) {
              const newFields = newConfig.structFields.map(field => {
                  const matchIdx = findColumnIndex(tableHeaders, field.targetKey || "");
                  if (matchIdx !== -1) {
                      if (field.sourceType !== ValueSourceType.COLUMN || field.columnIndex !== matchIdx) {
                          hasChanges = true;
                          return { ...field, sourceType: ValueSourceType.COLUMN, columnIndex: matchIdx };
                      }
                  }
                  return field;
              });
              newConfig.structFields = newFields;
          }

          return newConfig;
      });

      if (hasChanges) {
          setConfigs(newConfigs);
      }
  }, [tableHeaders]); // Dependency on tableHeaders

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
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          2. 配置映射规则 - <span className="text-primary">{activeFile.name}</span>
        </h2>
        <div className="text-xs text-slate-500 mt-1">
            ID: {activeFile.content.structId} {structureRegistry[activeFile.content.structId] ? "(已关联定义)" : "(未找到定义，使用索引)"}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
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
        <div className="flex items-center p-2 gap-3 min-h-[3rem]">
            {/* Index */}
            <div className="w-6 flex-shrink-0 text-center text-xs text-slate-400 font-mono">
                {config.index + 1}
            </div>

            {/* Label & Type (Read Only) */}
            <div className="w-40 flex-shrink-0 flex flex-col justify-center">
                <div className="text-sm font-medium text-slate-700 truncate" title={config.label}>{config.label}</div>
            </div>

            <div className="w-24 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getTypeBadgeColor(config.originalParamType)}`}>
                    {getTranslatedType(config.originalParamType)}
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
                        className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:border-primary focus:outline-none"
                     />
                )}

                {config.type === MappingType.SCALAR_LIST && (
                    <div className="w-full flex items-center gap-2">
                        <span className="text-xs text-slate-400 whitespace-nowrap hidden xl:inline">数据列:</span>
                        <select 
                            value={config.columnIndex || 0}
                            onChange={(e) => onChange({ columnIndex: parseInt(e.target.value) })}
                            className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:border-primary focus:outline-none min-w-0"
                        >
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>
                )}

                {isComplex && (
                     <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`text-xs px-3 py-1 rounded border transition flex-shrink-0 flex items-center gap-1 ${isExpanded ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-primary text-primary hover:bg-blue-50'}`}
                     >
                         {isExpanded ? '收起配置' : '展开配置'}
                         {config.type === MappingType.STRUCT_LIST && '(列表)'}
                     </button>
                )}
            </div>
        </div>

        {/* Expanded Area for Complex Types */}
        {isExpanded && isComplex && (
            <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-3 text-xs">
                 {/* Struct / StructList Logic */}
                 {(config.type === MappingType.STRUCT || config.type === MappingType.STRUCT_LIST) && (
                     <>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <FileCode className="w-3 h-3" />
                            <span>结构 ID: {config.innerStructId}</span>
                            {structureRegistry[config.innerStructId || ''] ? (
                                <span className="text-green-600 ml-2">✓ 已加载定义: {structureRegistry[config.innerStructId || ''].name}</span>
                            ) : (
                                <span className="text-amber-600 ml-2">⚠ 未找到定义 (请上传)</span>
                            )}
                        </div>
                        
                        {config.structFields.map((field, idx) => {
                             // Dynamic Label Lookup
                             let displayLabel = field.targetKey || `Field ${idx+1}`;
                             // Try to resolve from registry
                             const definition = config.innerStructId ? structureRegistry[config.innerStructId] : null;
                             if (definition && definition.content && Array.isArray(definition.content.value)) {
                                 const defItem = definition.content.value[idx];
                                 if (defItem && defItem.key) {
                                     displayLabel = defItem.key;
                                 }
                             }

                             return (
                             <div key={idx} className="flex items-center gap-2 pl-4 border-l-2 border-slate-200 py-1">
                                 <div className="w-32 font-medium text-slate-600 truncate" title={displayLabel}>
                                     {displayLabel}
                                 </div>
                                 <div className="w-20 text-slate-400">{getTranslatedType(field.targetParamType)}</div>
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
                             );
                        })}
                     </>
                 )}

                 {/* Dict Logic */}
                 {config.type === MappingType.DICT_KV && (
                     <div className="space-y-2 pl-4 border-l-2 border-amber-200">
                         <div className="flex items-center gap-2">
                             <span className="w-10 font-bold text-slate-600">Key</span>
                             <div className="w-20 text-slate-400">{getTranslatedType(config.dictKeyType || 'String')}</div>
                             <div className="flex-1">
                                {config.keyMapping && (
                                    <FieldSourceSelector field={config.keyMapping} headers={headers} onChange={f => onChange({ keyMapping: f })} />
                                )}
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="w-10 font-bold text-slate-600">Value</span>
                             <div className="w-20 text-slate-400">{getTranslatedType(config.dictValueType || 'String')}</div>
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
