
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

export const determineMappingType = (paramType: string): MappingType => {
    if (paramType === 'StructList') return MappingType.STRUCT_LIST;
    if (paramType === 'Dict') return MappingType.DICT_KV;
    if (paramType === 'Struct') return MappingType.STRUCT;
    if (paramType.endsWith('List')) return MappingType.SCALAR_LIST;
    return MappingType.SCALAR;
};

// Helper to format a single string value into the target type
const formatValue = (val: string, type: string): any => {
    if (type === 'Int32' || type === 'Entity' || type === 'Guid' || type === 'ConfigReference' || type === 'EntityReference' || type === 'Army') {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
    }
    if (type === 'Float') {
        const num = parseFloat(val);
        // Return as string with 2 decimals for UGC format consistency if needed, 
        // or number. The example shows numbers for Int/Float but Strings for others.
        // Let's match the example: Int/Float are raw numbers in JSON.
        return isNaN(num) ? 0.0 : num; 
    }
    if (type === 'Bool') {
        const lower = val.toLowerCase();
        // Example uses "True"/"False" strings
        return (lower === 'true' || lower === '1' || lower === 'yes') ? "True" : "False";
    }
    if (type === 'Vector3') {
        // Ensure X,Y,Z format? 
        return val || "0,0,0";
    }
    // Default String
    return val || "";
};

export const getValueFromSource = (
  row: string[], 
  rowIndex: number, 
  mapping: FieldMapping
): any => {
  let rawVal = "";
  if (mapping.sourceType === ValueSourceType.AUTO_INDEX) {
    rawVal = rowIndex.toString();
  } else if (mapping.sourceType === ValueSourceType.STATIC) {
    rawVal = mapping.staticValue || "";
  } else if (mapping.sourceType === ValueSourceType.COLUMN && mapping.columnIndex !== undefined) {
    rawVal = row[mapping.columnIndex] || "";
  }
  
  return formatValue(rawVal, mapping.targetParamType);
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

    // 1. SCALAR (Single Value) - Uses Static Value (Manual Input)
    if (config.type === MappingType.SCALAR) {
        targetSlot.value = formatValue(config.staticValue || "", config.originalParamType);
    }
    
    // 2. SCALAR LIST - Uses a Data Column and splits by delimiter
    else if (config.type === MappingType.SCALAR_LIST) {
        const baseType = config.originalParamType.replace('List', '');
        const generatedList: any[] = [];
        
        data.rows.forEach(row => {
            if (config.columnIndex !== undefined) {
                const cellContent = row[config.columnIndex] || "";
                // Split by comma or pipe
                const parts = cellContent.split(/[,|]/).map(s => s.trim()).filter(s => s !== "");
                parts.forEach(part => {
                    generatedList.push(formatValue(part, baseType));
                });
            }
        });
        targetSlot.value = generatedList;
    }

    // 3. STRUCT (Singleton) - Uses row 0 of data source or static
    else if (config.type === MappingType.STRUCT) {
        // For a single struct, we typically map it once. 
        // We can use the first row of data if columns are selected, or just static values.
        const row = data.rows.length > 0 ? data.rows[0] : [];
        const rowIndex = 0;
        
        const itemValues = config.structFields.map(field => ({
            param_type: field.targetParamType,
            value: getValueFromSource(row, rowIndex, field)
        }));
        
        if (targetSlot.value && typeof targetSlot.value === 'object') {
            targetSlot.value.value = itemValues;
             if (config.innerStructId) {
                 targetSlot.value.structId = config.innerStructId;
             }
        }
    }

    // 4. STRUCT LIST - Generates one struct per row
    else if (config.type === MappingType.STRUCT_LIST) {
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
         if (config.innerStructId) {
             targetSlot.value.structId = config.innerStructId;
         }
      }
    } 
    
    // 5. DICT - Key/Value pairs per row
    else if (config.type === MappingType.DICT_KV) {
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
