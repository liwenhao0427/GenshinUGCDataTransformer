
import { TableData, SlotConfig, MappingType, ValueSourceType, UGCStruct, FieldMapping } from './types';

export const parseTableData = (rawText: string): TableData => {
  const lines = rawText.trim().split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter (tab preferred, then comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  const parsedRows = lines.map(line => line.split(delimiter).map(c => c.trim()));
  
  // Use first row as headers
  const headers = parsedRows[0].map((h, i) => h || `Column ${i + 1}`);
  const rows = parsedRows.slice(1);

  return {
    headers,
    rows
  };
};

export const getValueFromSource = (
  row: string[], 
  rowIndex: number, 
  mapping: FieldMapping
): string => {
  if (mapping.sourceType === ValueSourceType.AUTO_INDEX) {
    return rowIndex.toString();
  }
  if (mapping.sourceType === ValueSourceType.STATIC) {
    return mapping.staticValue || "";
  }
  if (mapping.sourceType === ValueSourceType.COLUMN && mapping.columnIndex !== undefined) {
    const val = row[mapping.columnIndex];
    if (mapping.targetParamType === 'Float' && val) {
        const f = parseFloat(val);
        if (!isNaN(f)) return f.toFixed(2);
    }
    // Handle Int32 parsing if needed, or just pass through string
    return val || "";
  }
  return "";
};

export const generateUGCJson = (
  template: UGCStruct,
  data: TableData,
  configs: SlotConfig[]
): UGCStruct => {
  // Deep copy template
  const result = JSON.parse(JSON.stringify(template));

  configs.forEach(config => {
    if (config.type === MappingType.IGNORE) return;

    const targetSlot = result.value[config.index];
    if (!targetSlot) return;

    if (config.type === MappingType.STRUCT_LIST) {
      const generatedStructs = data.rows.map((row, rowIndex) => {
        const itemValues = config.structFields.map(field => ({
          param_type: field.targetParamType,
          value: getValueFromSource(row, rowIndex, field)
        }));

        return {
          param_type: "Struct",
          value: {
            structId: config.innerStructId || "0",
            type: "Struct",
            value: itemValues
          }
        };
      });

      if (targetSlot.value && typeof targetSlot.value === 'object') {
         targetSlot.value.value = generatedStructs;
         // Ensure the inner structId matches the config
         if (config.innerStructId) {
             targetSlot.value.structId = config.innerStructId;
         }
      }

    } else if (config.type === MappingType.DICT_KV) {
      const generatedEntries = data.rows.map((row, rowIndex) => {
        if (!config.keyMapping || !config.valueMapping) return null;

        return {
          key: {
            param_type: config.dictKeyType || "String",
            value: getValueFromSource(row, rowIndex, config.keyMapping)
          },
          value: {
            param_type: config.dictValueType || "String",
            value: getValueFromSource(row, rowIndex, config.valueMapping)
          }
        };
      }).filter(Boolean);

      if (targetSlot.value && typeof targetSlot.value === 'object') {
        targetSlot.value.value = generatedEntries;
        if(config.dictKeyType) targetSlot.value.key_type = config.dictKeyType;
        if(config.dictValueType) targetSlot.value.value_type = config.dictValueType;
      }
    }
  });

  return result;
};
