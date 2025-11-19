
export interface TableData {
  headers: string[];
  rows: string[][];
}

// UGC JSON Structures
export interface UGCParam {
  param_type: string;
  value: any;
  key?: string; // For descriptive labels in structure definitions
  [key: string]: any; // For extra fields like structId
}

export interface UGCStruct {
  structId: string;
  type: string;
  value: UGCParam[];
  basic_struct_id?: string;
  name?: string;
}

// Application State Types
export interface StructureDefinition {
  id: string;
  name: string;
  content: UGCStruct;
}

export interface TargetFile {
  id: string;
  name: string;
  content: UGCStruct;
}

// Mapping Configuration Types
export enum MappingType {
  STRUCT_LIST = 'StructList',
  DICT_KV = 'Dict',
  IGNORE = 'Ignore',
}

export enum ValueSourceType {
  COLUMN = 'Column',
  AUTO_INDEX = 'AutoIndex', // For 0,1,2,3...
  STATIC = 'Static',
}

export interface FieldMapping {
  targetParamType: string; // e.g., "String", "EntityReference"
  targetKey?: string; // The 'key' name from the struct definition (e.g. "Name", "Price")
  sourceType: ValueSourceType;
  columnIndex?: number; // If source is Column
  staticValue?: string; // If source is Static
}

export interface SlotConfig {
  index: number; // Index in the root.value array of the Target File
  type: MappingType;
  label?: string; // Display name for the slot (from key field)
  
  // For StructList
  innerStructId?: string;
  structFields: FieldMapping[]; 
  
  // For Dict
  dictKeyType?: string;
  dictValueType?: string;
  keyMapping?: FieldMapping;
  valueMapping?: FieldMapping;
}
