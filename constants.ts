
import { UGCStruct } from "./types";

// Shared Translation Map for Parameter Types
export const TYPE_LABELS: {[key: string]: string} = {
  'String': '字符串',
  'StringList': '字符串列表',
  'Int32': '整数',
  'Int32List': '整数列表',
  'Float': '浮点数',
  'FloatList': '浮点数列表',
  'Bool': '布尔值',
  'BoolList': '布尔值列表',
  'Vector3': '三维向量',
  'Vector3List': '三维向量列表',
  'Entity': '实体',
  'EntityList': '实体列表',
  'Guid': 'GUID',
  'GuidList': 'GUID列表',
  'ConfigReference': '配置ID',
  'ConfigReferenceList': '配置ID列表',
  'EntityReference': '元件ID',
  'EntityReferenceList': '元件ID列表',
  'Army': '阵营',
  'ArmyList': '阵营列表',
  'Struct': '结构体',
  'StructList': '结构体列表',
  'Dict': '字典'
};

// The Definition for the complex structure (Simulation Structure Type)
export const SAMPLE_STRUCT_DEF_1077936134: UGCStruct = {
   "structId": "1077936134", 
   "type": "Struct", 
   "name": "模拟结构体类型",
   "value": [
      { "key": "新增变量1", "param_type": "String", "value": { "param_type": "String", "value": "" } },
      { "key": "新增变量2", "param_type": "StringList", "value": { "param_type": "StringList", "value": [] } },
      { "key": "新增变量3", "param_type": "Int32", "value": { "param_type": "Int32", "value": "0" } },
      { "key": "新增变量4", "param_type": "Int32List", "value": { "param_type": "Int32List", "value": [] } },
      { "key": "新增变量5", "param_type": "Float", "value": { "param_type": "Float", "value": "0.00" } },
      { "key": "新增变量6", "param_type": "FloatList", "value": { "param_type": "FloatList", "value": [] } },
      { "key": "新增变量7", "param_type": "Bool", "value": { "param_type": "Bool", "value": "False" } },
      { "key": "新增变量8", "param_type": "BoolList", "value": { "param_type": "BoolList", "value": [] } },
      { "key": "新增变量9", "param_type": "Vector3", "value": { "param_type": "Vector3", "value": "0,0,0" } },
      { "key": "新增变量10", "param_type": "Vector3List", "value": { "param_type": "Vector3List", "value": [] } },
      { "key": "新增变量11", "param_type": "Entity", "value": { "param_type": "Entity", "value": "0" } },
      { "key": "新增变量12", "param_type": "EntityList", "value": { "param_type": "EntityList", "value": [] } },
      { "key": "新增变量13", "param_type": "Guid", "value": { "param_type": "Guid", "value": "0" } },
      { "key": "新增变量14", "param_type": "GuidList", "value": { "param_type": "GuidList", "value": [] } },
      { "key": "新增变量15", "param_type": "ConfigReference", "value": { "param_type": "ConfigReference", "value": "0" } },
      { "key": "新增变量16", "param_type": "ConfigReferenceList", "value": { "param_type": "ConfigReferenceList", "value": [] } },
      { "key": "新增变量17", "param_type": "String", "value": { "param_type": "String", "value": "" } },
      { "key": "新增变量18", "param_type": "EntityReference", "value": { "param_type": "EntityReference", "value": "0" } },
      { "key": "新增变量19", "param_type": "EntityReferenceList", "value": { "param_type": "EntityReferenceList", "value": [] } },
      { "key": "新增变量20", "param_type": "Army", "value": { "param_type": "Army", "value": "0" } },
      { "key": "新增变量21", "param_type": "ArmyList", "value": { "param_type": "ArmyList", "value": [] } },
      { "key": "新增变量22", "param_type": "Struct", "value": { "param_type": "Struct", "value": { "structId": "1077936130", "type": "Struct", "value": [] } } },
      { "key": "新增变量24", "param_type": "Dict", "value": { "param_type": "Dict", "value": { "type": "Dict", "key_type": "String", "value_type": "String", "value": [] } } },
      { "key": "新增变量23", "param_type": "StructList", "value": { "param_type": "StructList", "value": { "structId": "1077936130", "value": [] } } }
   ]
};

// The Inner Struct Definition (referenced in the complex one)
export const SAMPLE_STRUCT_DEF_1077936130: UGCStruct = {
    "structId": "1077936130",
    "type": "Struct",
    "name": "随从基础结构",
    "value": [
        { "key": "名称", "param_type": "String", "value": "" },
        { "key": "元件ID", "param_type": "EntityReference", "value": "0" },
        { "key": "配置ID", "param_type": "ConfigReference", "value": "0" }
    ]
};

// The "Initial Data" file (Target File) - Matches the structure of 1077936134
export const SAMPLE_TARGET_JSON: UGCStruct = {
    "structId": "1077936134", 
    "type": "Struct", 
    "name": "结构体数据.json",
    "value": [
       { "param_type": "String", "value": "" },
       { "param_type": "StringList", "value": [] },
       { "param_type": "Int32", "value": 0 },
       { "param_type": "Int32List", "value": [] },
       { "param_type": "Float", "value": 0.00 },
       { "param_type": "FloatList", "value": [] },
       { "param_type": "Bool", "value": "False" },
       { "param_type": "BoolList", "value": [] },
       { "param_type": "Vector3", "value": "0,0,0" },
       { "param_type": "Vector3List", "value": [] },
       { "param_type": "Entity", "value": "0" },
       { "param_type": "EntityList", "value": [] },
       { "param_type": "Guid", "value": "0" },
       { "param_type": "GuidList", "value": [] },
       { "param_type": "ConfigReference", "value": "0" },
       { "param_type": "ConfigReferenceList", "value": [] },
       { "param_type": "String", "value": "" },
       { "param_type": "EntityReference", "value": "0" },
       { "param_type": "EntityReferenceList", "value": [] },
       { "param_type": "Army", "value": "0" },
       { "param_type": "ArmyList", "value": [] },
       { "param_type": "Struct", "value": { "structId": "1077936130", "type": "Struct", "value": [
           { "param_type": "String", "value": "" },
           { "param_type": "EntityReference", "value": "0" },
           { "param_type": "ConfigReference", "value": "0" }
       ] } },
       { "param_type": "Dict", "value": { "type": "Dict", "key_type": "String", "value_type": "String", "value": [] } },
       { "param_type": "StructList", "value": { "structId": "1077936130", "value": [] } }
    ],
    "basic_struct_id": "6e2fd6dc"
};

export const SAMPLE_TABLE_DATA = `新增变量1\t新增变量2\t新增变量3\t新增变量4\t名称
测试A\tA1,A2\t100\t1,2,3\tItem A
测试B\tB1,B2\t200\t4,5,6\tItem B
测试C\tC1,C2\t300\t7,8,9\tItem C`;